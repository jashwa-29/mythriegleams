"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchCollections } from '@/redux/slices/collectionSlice';
import { fetchOccasions } from '@/redux/slices/occasionSlice';
import {
    fetchHomepageSettings,
    resetHomepageSettingsState,
    updateHomepageSettings,
    type HomepageSettingsReferenceValue,
    type SeasonalSectionPayload
} from '@/redux/slices/homepageSettingsSlice';
import { Gift, Layers, Loader2, Save, Settings, Sparkles, Plus, Trash2 } from 'lucide-react';
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

    const [seasonalSections, setSeasonalSections] = useState<SeasonalSectionPayload[]>([]);
    const [activeIndex, setActiveIndex] = useState<number>(0);

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

        if (settings?.seasonalSections && settings.seasonalSections.length > 0) {
            setSeasonalSections(settings.seasonalSections.map(s => ({
                _id: s._id,
                name: s.name || 'Seasonal Section',
                enabled: s.enabled,
                badge: s.badge || '',
                heading: s.heading || '',
                description: s.description || '',
                collectionIds: getAvailableReferenceIds(s.collectionIds, collections),
                occasionIds: getAvailableReferenceIds(s.occasionIds, occasions)
            })));
        } else {
            setSeasonalSections([{
                name: 'New Section',
                enabled: true,
                badge: '🪔 Festive Special',
                heading: 'Navaratri Thamboolam Collections',
                description: 'Navaratri / Golu - a subcategory of Festivals & Religious Events',
                collectionIds: collections.filter((collection) => collection.slug === DEFAULT_COLLECTION_SLUG).map((collection) => collection._id),
                occasionIds: occasions.filter((occasion) => occasion.slug === DEFAULT_OCCASION_SLUG).map((occasion) => occasion._id)
            }]);
        }
        initialized.current = true;
    }, [catalogsError, catalogsReady, collections, occasions, settings, settingsFetchError, settingsLoaded]);

    useEffect(() => {
        if (success) {
            toast.success('Homepage settings updated.');
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

    const updateActiveSection = (updates: Partial<SeasonalSectionPayload>) => {
        setSeasonalSections(curr => {
            const newSections = [...curr];
            newSections[activeIndex] = { ...newSections[activeIndex], ...updates };
            return newSections;
        });
    };

    const toggleCollection = (id: string) => {
        const currentIds = seasonalSections[activeIndex]?.collectionIds || [];
        const newIds = currentIds.includes(id) ? currentIds.filter((value) => value !== id) : [...currentIds, id];
        updateActiveSection({ collectionIds: newIds });
    };

    const toggleOccasion = (id: string) => {
        const currentIds = seasonalSections[activeIndex]?.occasionIds || [];
        const newIds = currentIds.includes(id) ? currentIds.filter((value) => value !== id) : [...currentIds, id];
        updateActiveSection({ occasionIds: newIds });
    };

    const addSection = () => {
        setSeasonalSections(curr => [...curr, {
            name: `Section ${curr.length + 1}`,
            enabled: false,
            badge: '',
            heading: '',
            description: '',
            collectionIds: [],
            occasionIds: []
        }]);
        setActiveIndex(seasonalSections.length);
    };

    const removeSection = (index: number) => {
        if (seasonalSections.length === 1) {
            toast.error("Cannot remove the last section");
            return;
        }
        setSeasonalSections(curr => curr.filter((_, i) => i !== index));
        if (activeIndex >= index && activeIndex > 0) {
            setActiveIndex(activeIndex - 1);
        }
    };

    const saveSettings = () => {
        dispatch(updateHomepageSettings({
            seasonalSections
        }));
    };

    const isLoading = !catalogsReady || !settingsLoaded || collectionsLoading || occasionsLoading;
    const hasLoadError = catalogsError || Boolean(settingsFetchError);
    const isBusy = isLoading || saving || hasLoadError;

    const activeSection = seasonalSections[activeIndex];

    if (isLoading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-zinc-400" /></div>;

    return (
        <div className="p-4 sm:p-6 max-w-[1200px] mx-auto space-y-6 bg-white min-h-screen rounded-2xl border border-zinc-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
                <div>
                    <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Homepage Settings</h1>
                    <p className="text-xs text-zinc-500 font-medium">Manage seasonal collections on the homepage.</p>
                </div>
                <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    <Settings size={15} />
                    Seasonal sections
                </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2">
                {seasonalSections.map((section, idx) => (
                    <div key={idx} className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer border ${idx === activeIndex ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'}`} onClick={() => setActiveIndex(idx)}>
                        <span className="text-sm font-bold whitespace-nowrap">{section.name || `Section ${idx + 1}`}</span>
                        {!section.enabled && <span className="text-[10px] bg-zinc-200 text-zinc-500 px-1.5 py-0.5 rounded">Disabled</span>}
                    </div>
                ))}
                <button onClick={addSection} className="flex items-center justify-center w-10 h-10 rounded-lg border border-dashed border-zinc-300 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700">
                    <Plus size={16} />
                </button>
            </div>

            {activeSection && (
                <div className="space-y-6 bg-zinc-50/50 p-5 rounded-xl border border-zinc-200">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-zinc-700 mb-1">Internal Name</label>
                            <input 
                                type="text" 
                                value={activeSection.name} 
                                onChange={e => updateActiveSection({ name: e.target.value })} 
                                className="w-full max-w-xs px-3 py-2 text-sm rounded-lg border border-zinc-300 focus:outline-none focus:border-zinc-500" 
                                placeholder="e.g. Navaratri 2026"
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="inline-flex items-center gap-3 cursor-pointer">
                                <span className="text-sm font-bold text-zinc-700">Enable Section</span>
                                <input
                                    type="checkbox"
                                    checked={activeSection.enabled}
                                    onChange={(event) => updateActiveSection({ enabled: event.target.checked })}
                                    className="sr-only"
                                />
                                <span className={`relative w-11 h-6 rounded-full transition-colors ${activeSection.enabled ? 'bg-emerald-500' : 'bg-zinc-300'}`}>
                                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${activeSection.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                </span>
                            </label>
                            <button onClick={() => removeSection(activeIndex)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-zinc-700 mb-1">Badge</label>
                            <input 
                                type="text" 
                                value={activeSection.badge} 
                                onChange={e => updateActiveSection({ badge: e.target.value })} 
                                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 focus:outline-none focus:border-zinc-500" 
                                placeholder="e.g. 🪔 Festive Special"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-700 mb-1">Heading</label>
                            <input 
                                type="text" 
                                value={activeSection.heading} 
                                onChange={e => updateActiveSection({ heading: e.target.value })} 
                                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 focus:outline-none focus:border-zinc-500" 
                                placeholder="e.g. Seasonal Collection"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-zinc-700 mb-1">Description</label>
                            <textarea 
                                value={activeSection.description} 
                                onChange={e => updateActiveSection({ description: e.target.value })} 
                                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 focus:outline-none focus:border-zinc-500 resize-none h-20" 
                                placeholder="Description text..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
                        <section className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
                            <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2"><Layers size={15} /> Collections</h2>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{activeSection.collectionIds.length} selected</span>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto divide-y divide-zinc-100">
                                {sortedCollections.map((collection) => {
                                    const isSelected = activeSection.collectionIds.includes(collection._id);
                                    const parent = parentName(collection, collections);
                                    return (
                                        <label key={collection._id} className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${isSelected ? 'bg-emerald-50' : 'hover:bg-zinc-50'}`}>
                                            <input type="checkbox" checked={isSelected} onChange={() => toggleCollection(collection._id)} className="accent-emerald-600" />
                                            <span className="min-w-0 flex-1">
                                                <span className="block text-xs font-bold text-zinc-800 truncate">{collection.name}</span>
                                                <span className="block text-[10px] text-zinc-400 mt-0.5">{parent ? `Under ${parent}` : 'Top-level collection'}</span>
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </section>

                        <section className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
                            <div className="p-4 border-b border-zinc-200 bg-rose-50 flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2"><Gift size={15} /> Occasions</h2>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{activeSection.occasionIds.length} selected</span>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto divide-y divide-zinc-100">
                                {sortedOccasions.map((occasion) => {
                                    const isSelected = activeSection.occasionIds.includes(occasion._id);
                                    const parent = parentName(occasion, occasions);
                                    return (
                                        <label key={occasion._id} className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${isSelected ? 'bg-rose-50' : 'hover:bg-zinc-50'}`}>
                                            <input type="checkbox" checked={isSelected} onChange={() => toggleOccasion(occasion._id)} className="accent-rose-600" />
                                            <span className="min-w-0 flex-1">
                                                <span className="block text-xs font-bold text-zinc-800 truncate">{occasion.name}</span>
                                                <span className="block text-[10px] text-zinc-400 mt-0.5">{parent ? `Under ${parent}` : 'Top-level occasion'}</span>
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </section>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-amber-200 bg-amber-50">
                <p className="text-xs text-amber-900 leading-relaxed">
                    <Sparkles size={14} className="inline mr-1" />
                    Save your settings for them to reflect on the storefront.
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
