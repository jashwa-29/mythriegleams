"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchCollections } from '@/redux/slices/collectionSlice';
import { fetchOccasions } from '@/redux/slices/occasionSlice';
import {
    fetchHomepageSettings,
    resetHomepageSettingsState,
    updateHomepageSettings,
    type HomepageSettingsReferenceValue
} from '@/redux/slices/homepageSettingsSlice';
import { Gift, Layers, Loader2, Save, Settings, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const DEFAULT_COLLECTION_SLUG = 'navaratri-thamboolam';
const DEFAULT_OCCASION_SLUG = 'navaratri-golu';

type CatalogItem = {
    _id: string;
    name: string;
    parent?: string | { _id: string; name?: string } | null;
};

const getReferenceId = (reference: HomepageSettingsReferenceValue | null | undefined) => {
    if (!reference) return null;
    return typeof reference === 'string' ? reference : reference._id;
};

const getAvailableReferenceIds = (
    references: HomepageSettingsReferenceValue[],
    catalog: CatalogItem[]
) => {
    const availableIds = new Set(catalog.map((item) => item._id));
    return references
        .map(getReferenceId)
        .filter((id): id is string => Boolean(id && availableIds.has(id)));
};

const getParentId = (item: CatalogItem) =>
    typeof item.parent === 'string' ? item.parent : item.parent?._id;

const HomepageSettingsPage = () => {
    const dispatch = useAppDispatch();
    const { collections, loading: collectionsLoading } = useAppSelector((state) => state.collections);
    const { occasions, loading: occasionsLoading } = useAppSelector((state) => state.occasions);
    const {
        settings,
        loaded: settingsLoaded,
        saving,
        error,
        fetchError: settingsFetchError,
        success
    } = useAppSelector((state) => state.homepageSettings);

    const [enabled, setEnabled] = useState(true);
    const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);
    const [selectedOccasionIds, setSelectedOccasionIds] = useState<string[]>([]);
    const [catalogsReady, setCatalogsReady] = useState(false);
    const [catalogsError, setCatalogsError] = useState(false);
    const initialized = useRef(false);

    useEffect(() => {
        void dispatch(fetchHomepageSettings());
    }, [dispatch]);

    useEffect(() => {
        let isActive = true;

        const loadCatalogs = async () => {
            try {
                await Promise.all([
                    dispatch(fetchCollections()).unwrap(),
                    dispatch(fetchOccasions()).unwrap()
                ]);
                if (isActive) setCatalogsError(false);
            } catch {
                if (isActive) setCatalogsError(true);
            } finally {
                if (isActive) setCatalogsReady(true);
            }
        };

        void loadCatalogs();
        return () => {
            isActive = false;
        };
    }, [dispatch]);

    useEffect(() => {
        if (initialized.current || !settingsLoaded || !catalogsReady || catalogsError || settingsFetchError) return;

        const configuredCollections = getAvailableReferenceIds(
            settings?.seasonalSection.collectionIds || [],
            collections
        );
        const configuredOccasions = getAvailableReferenceIds(
            settings?.seasonalSection.occasionIds || [],
            occasions
        );

        setEnabled(settings?.seasonalSection.enabled ?? true);
        setSelectedCollectionIds(settings
            ? configuredCollections
            : collections.filter((collection) => collection.slug === DEFAULT_COLLECTION_SLUG).map((collection) => collection._id));
        setSelectedOccasionIds(settings
            ? configuredOccasions
            : occasions.filter((occasion) => occasion.slug === DEFAULT_OCCASION_SLUG).map((occasion) => occasion._id));
        initialized.current = true;
    }, [catalogsError, catalogsReady, collections, occasions, settings, settingsFetchError, settingsLoaded]);

    useEffect(() => {
        if (success) {
            toast.success('Homepage seasonal section updated.');
            dispatch(resetHomepageSettingsState());
        }
    }, [dispatch, success]);

    useEffect(() => {
        if (error) {
            toast.error(error);
            dispatch(resetHomepageSettingsState());
        }
    }, [dispatch, error]);

    useEffect(() => {
        if (settingsFetchError) toast.error(settingsFetchError);
    }, [settingsFetchError]);

    const sortedCollections = useMemo(
        () => [...collections].sort((a, b) => {
            const parentDelta = Number(Boolean(getParentId(a))) - Number(Boolean(getParentId(b)));
            return parentDelta || a.name.localeCompare(b.name);
        }),
        [collections]
    );
    const sortedOccasions = useMemo(
        () => [...occasions].sort((a, b) => {
            const parentDelta = Number(Boolean(getParentId(a))) - Number(Boolean(getParentId(b)));
            return parentDelta || a.name.localeCompare(b.name);
        }),
        [occasions]
    );

    const parentName = (item: CatalogItem, catalog: CatalogItem[]) => {
        const parentId = getParentId(item);
        if (!parentId) return null;
        if (item.parent && typeof item.parent === 'object' && item.parent.name) return item.parent.name;
        return catalog.find((candidate) => candidate._id === parentId)?.name || null;
    };

    const toggleCollection = (id: string) => {
        setSelectedCollectionIds((current) =>
            current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
        );
    };

    const toggleOccasion = (id: string) => {
        setSelectedOccasionIds((current) =>
            current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
        );
    };

    const saveSettings = () => {
        dispatch(updateHomepageSettings({
            enabled,
            collectionIds: selectedCollectionIds,
            occasionIds: selectedOccasionIds
        }));
    };

    const isLoading = !catalogsReady || !settingsLoaded || collectionsLoading || occasionsLoading;
    const hasLoadError = catalogsError || Boolean(settingsFetchError);
    const isBusy = isLoading || saving || hasLoadError;

    return (
        <div className="p-4 sm:p-6 max-w-[1200px] mx-auto space-y-6 bg-white min-h-screen rounded-2xl border border-zinc-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
                <div>
                    <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Homepage Settings</h1>
                    <p className="text-xs text-zinc-500 font-medium">Choose the collections and occasions whose products appear in the seasonal homepage section.</p>
                </div>
                <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    <Settings size={15} />
                    Seasonal section
                </div>
            </div>

            <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-zinc-200 bg-zinc-50">
                <div>
                    <h2 className="text-sm font-bold text-zinc-900">Show seasonal section</h2>
                    <p className="text-xs text-zinc-500 mt-1">When disabled, the seasonal section is hidden from the homepage.</p>
                </div>
                <label className="inline-flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(event) => setEnabled(event.target.checked)}
                        className="sr-only"
                    />
                    <span className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-emerald-500' : 'bg-zinc-300'}`}>
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </span>
                    <span className="text-xs font-bold text-zinc-700">{enabled ? 'Enabled' : 'Disabled'}</span>
                </label>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <section className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
                    <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2"><Layers size={15} /> Collections</h2>
                            <p className="text-[10px] text-zinc-500 mt-1">Select one or more collections or subcollections.</p>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{selectedCollectionIds.length} selected</span>
                    </div>
                    <div className="max-h-[430px] overflow-y-auto divide-y divide-zinc-100">
                        {sortedCollections.map((collection) => {
                            const isSelected = selectedCollectionIds.includes(collection._id);
                            const parent = parentName(collection, collections);
                            return (
                                <label key={collection._id} className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${isSelected ? 'bg-emerald-50' : 'hover:bg-zinc-50'}`}>
                                    <input type="checkbox" checked={isSelected} onChange={() => toggleCollection(collection._id)} className="accent-emerald-600" />
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-xs font-bold text-zinc-800 truncate">{collection.name}</span>
                                        <span className="block text-[10px] text-zinc-400 mt-0.5">{parent ? `Under ${parent}` : 'Top-level collection'}</span>
                                    </span>
                                    {isSelected && <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700">Included</span>}
                                </label>
                            );
                        })}
                    </div>
                </section>

                <section className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
                    <div className="p-4 border-b border-zinc-200 bg-rose-50 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2"><Gift size={15} /> Occasions</h2>
                            <p className="text-[10px] text-zinc-500 mt-1">Select one or more occasions or sub-occasions.</p>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{selectedOccasionIds.length} selected</span>
                    </div>
                    <div className="max-h-[430px] overflow-y-auto divide-y divide-zinc-100">
                        {sortedOccasions.map((occasion) => {
                            const isSelected = selectedOccasionIds.includes(occasion._id);
                            const parent = parentName(occasion, occasions);
                            return (
                                <label key={occasion._id} className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${isSelected ? 'bg-rose-50' : 'hover:bg-zinc-50'}`}>
                                    <input type="checkbox" checked={isSelected} onChange={() => toggleOccasion(occasion._id)} className="accent-rose-600" />
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-xs font-bold text-zinc-800 truncate">{occasion.name}</span>
                                        <span className="block text-[10px] text-zinc-400 mt-0.5">{parent ? `Under ${parent}` : 'Top-level occasion'}</span>
                                    </span>
                                    {isSelected && <span className="text-[9px] font-bold uppercase tracking-wider text-rose-700">Included</span>}
                                </label>
                            );
                        })}
                    </div>
                </section>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-amber-200 bg-amber-50">
                <p className="text-xs text-amber-900 leading-relaxed">
                    <Sparkles size={14} className="inline mr-1" />
                    Products are included when they belong to any selected collection or occasion. Selecting a parent also includes its subcategories.
                </p>
                <button
                    type="button"
                    onClick={saveSettings}
                    disabled={isBusy}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save Homepage Settings
                </button>
            </div>
        </div>
    );
};

export default HomepageSettingsPage;
