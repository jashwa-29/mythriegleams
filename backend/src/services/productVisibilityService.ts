import Collection from '../models/Collection';
import Occasion from '../models/Occasion';

/**
 * How long a resolved pause index is reused. Pausing is a rare admin action, so a short cache
 * keeps storefront listings from issuing two extra queries per request while still making a
 * toggle feel instant.
 */
const CACHE_TTL_MS = 15 * 1000;

export type GroupKind = 'collection' | 'occasion';

export type PausedReason = {
    kind: GroupKind;
    /** Name of the section that actually carries the pause. */
    pausedName: string;
    /** Name of the descendant section covered by the pause, empty when it carries the pause itself. */
    viaParent?: string;
};

export type PausedIndex = {
    /** Lowercased names of paused sections, including every descendant of a paused parent. */
    collectionNames: Set<string>;
    occasionNames: Set<string>;
    /** `${kind}:${lowercasedName}` -> why it is paused, for messages and admin UI. */
    reasons: Map<string, PausedReason>;
};

type GroupRow = { _id: any; name: string; parent: any; isPaused?: boolean };

let cached: { at: number; index: PausedIndex } | null = null;

export const invalidatePausedIndex = () => {
    cached = null;
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Resolves which section names are paused. A section is paused when it, or any ancestor, has
 * isPaused set — so pausing "Wedding" also pauses "Wedding > Engagement".
 *
 * Walks the `parent` chain with a visited set so a cycle in stored data cannot hang a request.
 */
const resolvePausedNames = (rows: GroupRow[], kind: GroupKind) => {
    const names = new Set<string>();
    const reasons = new Map<string, PausedReason>();

    const byId = new Map<string, GroupRow>();
    for (const row of rows) byId.set(String(row._id), row);

    for (const row of rows) {
        const visited = new Set<string>([String(row._id)]);
        let current: GroupRow | undefined = row;
        let pausedAncestor: GroupRow | null = null;

        while (current) {
            if (current.isPaused) {
                pausedAncestor = current;
                break;
            }
            const parentId = current.parent ? String(current.parent) : null;
            if (!parentId || !byId.has(parentId) || visited.has(parentId)) break;
            visited.add(parentId);
            current = byId.get(parentId);
        }

        if (!pausedAncestor) continue;

        const ownName = (row.name || '').trim();
        const ownKey = ownName.toLowerCase();
        if (!ownKey) continue;

        names.add(ownKey);
        reasons.set(`${kind}:${ownKey}`, {
            kind,
            pausedName: pausedAncestor.name,
            // Empty when this section carries the pause itself; otherwise name this section so the
            // message can say which one is covered by the paused ancestor.
            viaParent: pausedAncestor._id === row._id ? '' : ownName
        });
    }

    return { names, reasons };
};

/**
 * The pause state of the whole catalogue.
 * `force` bypasses the cache and is used right after an admin toggles a pause.
 */
export const getPausedIndex = async (force = false): Promise<PausedIndex> => {
    if (!force && cached && Date.now() - cached.at < CACHE_TTL_MS) {
        return cached.index;
    }

    try {
        const [collectionRows, occasionRows] = await Promise.all([
            Collection.find({}).select('_id name parent isPaused').lean(),
            Occasion.find({}).select('_id name parent isPaused').lean()
        ]);

        const collections = resolvePausedNames(collectionRows as GroupRow[], 'collection');
        const occasions = resolvePausedNames(occasionRows as GroupRow[], 'occasion');

        const index: PausedIndex = {
            collectionNames: collections.names,
            occasionNames: occasions.names,
            reasons: new Map([...collections.reasons, ...occasions.reasons])
        };

        cached = { at: Date.now(), index };
        return index;
    } catch (err: any) {
        // A pause lookup must never take the storefront down: fail open and show everything.
        console.error('[visibility] Could not resolve pause state:', err.message);
        return { collectionNames: new Set(), occasionNames: new Set(), reasons: new Map() };
    }
};

/** Every product field that stores a collection or occasion name. */
export type ProductGroups = {
    category?: string;
    categories?: string[];
    subcategory?: string;
    subcategories?: string[];
    occasion?: string;
    occasions?: string[];
    occasionSub?: string;
    occasionSubs?: string[];
};

const groupNamesOf = (product: ProductGroups, kind: GroupKind): string[] => {
    // A product can sit in a sub-section without repeating its parent, so all of the sub
    // fields have to be checked too.
    const values = kind === 'collection'
        ? [product.category, ...(product.categories || []), product.subcategory, ...(product.subcategories || [])]
        : [product.occasion, ...(product.occasions || []), product.occasionSub, ...(product.occasionSubs || [])];

    return values.map((v) => (v || '').trim()).filter(Boolean);
};

/** Which paused section a product belongs to, or null when it is sellable. */
export const findPauseMatch = (product: ProductGroups, index: PausedIndex): PausedReason | null => {
    for (const name of groupNamesOf(product, 'collection')) {
        const key = name.toLowerCase();
        if (index.collectionNames.has(key)) return index.reasons.get(`collection:${key}`) || { kind: 'collection', pausedName: name };
    }
    for (const name of groupNamesOf(product, 'occasion')) {
        const key = name.toLowerCase();
        if (index.occasionNames.has(key)) return index.reasons.get(`occasion:${key}`) || { kind: 'occasion', pausedName: name };
    }
    return null;
};

export const isProductPaused = async (product: ProductGroups, force = false): Promise<boolean> =>
    findPauseMatch(product, await getPausedIndex(force)) !== null;

/**
 * Query fragment excluding every product that belongs to a paused collection or occasion.
 * Uses $nor so it composes with the $or / $and filters already built in getProducts.
 *
 * Products reference sections by name rather than id, and the stored casing is not guaranteed
 * to match the catalogue, so the match is case-insensitive.
 *
 * Collection and occasion names are only unique inside their own model — a paused collection
 * called "Wedding" must not hide a live occasion also called "Wedding". Each group therefore
 * gets its own clause instead of one shared pattern.
 */
export const pausedProductsFilter = (index: PausedIndex): Record<string, any> | null => {
    if (index.collectionNames.size === 0 && index.occasionNames.size === 0) return null;

    const patternFor = (names: Set<string>) =>
        new RegExp(`^(${[...names].map(escapeRegExp).join('|')})$`, 'i');

    const collectionRe = index.collectionNames.size > 0 ? patternFor(index.collectionNames) : null;
    const occasionRe = index.occasionNames.size > 0 ? patternFor(index.occasionNames) : null;

    const blocked: Record<string, any>[] = [];
    if (collectionRe) {
        blocked.push({ $or: [{ category: collectionRe }, { categories: collectionRe }, { subcategory: collectionRe }, { subcategories: collectionRe }] });
    }
    if (occasionRe) {
        blocked.push({ $or: [{ occasion: occasionRe }, { occasions: occasionRe }, { occasionSub: occasionRe }, { occasionSubs: occasionRe }] });
    }

    // One $nor entry per model: a product is hidden when it matches any paused section.
    return { $nor: blocked };
};

/**
 * Effective pause state for a section, so the storefront can explain itself on sub-pages too:
 * a sub-collection whose parent is paused has `isPaused` false but is not sellable.
 */
export const describeSectionPause = (index: PausedIndex, kind: GroupKind, name: string): PausedReason | null => {
    const key = (name || '').trim().toLowerCase();
    if (!key) return null;
    return index.reasons.get(`${kind}:${key}`) || null;
};

/** Explanation for a paused product, used in error messages. */
export const describePause = (match: PausedReason | null): string => {
    if (!match) return 'currently unavailable';
    if (match.viaParent) {
        return `the ${match.kind} "${match.pausedName}" is paused (which also covers "${match.viaParent}")`;
    }
    return `the ${match.kind} "${match.pausedName}" is paused`;
};
