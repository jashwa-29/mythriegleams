"use client";

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
    fetchShippingSettings,
    resetShippingSettingsState,
    updateShippingSettings,
    type RateSlab,
    type CountryRate,
    type ShippingSettingsData
} from '@/redux/slices/shippingSettingsSlice';
import { DEFAULT_SHIPPING_SETTINGS, normalizeShippingSettings } from '@/utils/shipping';
import { Globe, Loader2, MapPin, Package, Plus, Save, Trash2, Truck } from 'lucide-react';
import toast from 'react-hot-toast';

const toNumber = (value: string, fallback = 0): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const RUPEES = (n: number) => `₹${(Number(n) || 0).toLocaleString('en-IN')}`;

const inputClass =
    'w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 focus:outline-none focus:border-zinc-500';

interface SlabEditorProps {
    slabs: RateSlab[];
    onChange: (next: RateSlab[]) => void;
}

const SlabEditor: React.FC<SlabEditorProps> = ({ slabs, onChange }) => {
    const updateAt = (index: number, patch: Partial<RateSlab>) =>
        onChange(slabs.map((slab, i) => (i === index ? { ...slab, ...patch } : slab)));

    const addSlab = () => {
        const last = slabs[slabs.length - 1];
        const nextMin = last ? (last.maxWeight ?? last.minWeight + 1000) : 0;
        onChange([...slabs, { minWeight: Number(nextMin) || 0, maxWeight: null, charge: last?.charge ?? 0 }]);
    };

    const removeSlab = (index: number) => onChange(slabs.filter((_, i) => i !== index));

    return (
        <div className="space-y-2">
            {slabs.length === 0 && (
                <p className="text-[11px] text-zinc-400">No weight slabs yet. Add one to start charging for this zone.</p>
            )}

            {slabs.map((slab, index) => (
                <div key={index} className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-3">
                    <div className="flex-1 min-w-[100px]">
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Min weight (g)</label>
                        <input
                            type="number"
                            min={0}
                            value={slab.minWeight}
                            onChange={(e) => updateAt(index, { minWeight: Math.max(0, toNumber(e.target.value)) })}
                            className={inputClass}
                        />
                    </div>
                    <div className="flex-1 min-w-[100px]">
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Max weight (g)</label>
                        <input
                            type="number"
                            min={0}
                            value={slab.maxWeight ?? ''}
                            placeholder="No limit"
                            onChange={(e) =>
                                updateAt(index, {
                                    maxWeight: e.target.value === '' ? null : Math.max(0, toNumber(e.target.value))
                                })
                            }
                            className={inputClass}
                        />
                    </div>
                    <div className="flex-1 min-w-[100px]">
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Charge (₹)</label>
                        <input
                            type="number"
                            min={0}
                            value={slab.charge}
                            onChange={(e) => updateAt(index, { charge: Math.max(0, toNumber(e.target.value)) })}
                            className={inputClass}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => removeSlab(index)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        aria-label="Remove slab"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ))}

            <button
                type="button"
                onClick={addSlab}
                className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600 hover:text-zinc-900 transition-colors"
            >
                <Plus size={12} /> Add weight slab
            </button>
        </div>
    );
};

const ShippingSettingsPage = () => {
    const dispatch = useAppDispatch();
    const { loaded, saving, error, fetchError, success } = useAppSelector((state) => state.shippingSettings);

    const [draft, setDraft] = useState<ShippingSettingsData>(DEFAULT_SHIPPING_SETTINGS);

    useEffect(() => {
        dispatch(fetchShippingSettings())
            .unwrap()
            .then((data) => setDraft(normalizeShippingSettings(data)))
            .catch(() => {
                // Errors are surfaced via the slice's fetchError.
            });
    }, [dispatch]);

    useEffect(() => {
        if (success) {
            toast.success('Delivery charges updated.');
            dispatch(resetShippingSettingsState());
        }
    }, [dispatch, success]);

    useEffect(() => {
        if (error) {
            toast.error(error);
            dispatch(resetShippingSettingsState());
        }
    }, [dispatch, error]);

    useEffect(() => {
        if (fetchError) toast.error(fetchError);
    }, [fetchError]);

    const patch = (updates: Partial<ShippingSettingsData>) => setDraft((curr) => ({ ...curr, ...updates }));

    const updateCountryRate = (index: number, updates: Partial<CountryRate>) =>
        setDraft((curr) => ({
            ...curr,
            countryRates: curr.countryRates.map((rate, i) => (i === index ? { ...rate, ...updates } : rate))
        }));

    const addCountryRate = () =>
        setDraft((curr) => ({
            ...curr,
            countryRates: [...curr.countryRates, { country: '', slabs: [{ minWeight: 0, maxWeight: null, charge: 0 }] }]
        }));

    const removeCountryRate = (index: number) =>
        setDraft((curr) => ({ ...curr, countryRates: curr.countryRates.filter((_, i) => i !== index) }));

    const save = () => {
        const cleanedCountries = draft.countryRates
            .map((rate) => ({ ...rate, country: rate.country.trim() }))
            .filter((rate) => rate.country.length > 0);

        if (cleanedCountries.length !== draft.countryRates.length) {
            toast.error('Give every country override a name, or remove it.');
            return;
        }

        void dispatch(
            updateShippingSettings({
                homeState: draft.homeState,
                withinState: draft.withinState,
                otherStates: draft.otherStates,
                international: draft.international,
                countryRates: cleanedCountries
            })
        );
    };

    if (!loaded) {
        return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-zinc-400" /></div>;
    }

    return (
        <div className="p-4 sm:p-6 max-w-[1100px] mx-auto space-y-6 bg-white min-h-screen rounded-2xl border border-zinc-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
                <div>
                    <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Delivery Charges</h1>
                    <p className="text-xs text-zinc-500 font-medium">
                        Set shipping by destination and weight. Charges are recalculated on the server when an order is placed.
                    </p>
                </div>
                <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    <Truck size={15} /> Shipping rate card
                </div>
            </div>

            {/* Domestic */}
            <section className="rounded-xl border border-zinc-200 bg-white p-5 space-y-5">
                <div className="flex items-center gap-2">
                    <MapPin size={15} className="text-zinc-500" />
                    <h2 className="text-sm font-bold text-zinc-900">India — by weight</h2>
                </div>

                <div className="max-w-xs">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Home state</label>
                    <input
                        type="text"
                        value={draft.homeState}
                        onChange={(e) => patch({ homeState: e.target.value })}
                        placeholder="e.g. Tamil Nadu"
                        className={inputClass}
                    />
                    <p className="text-[10px] text-zinc-400 mt-1">Orders shipping within this state use the home-state rates below.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 space-y-3">
                        <h3 className="text-xs font-bold text-zinc-800">Within {draft.homeState || 'home state'}</h3>
                        <SlabEditor slabs={draft.withinState} onChange={(withinState) => patch({ withinState })} />
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 space-y-3">
                        <h3 className="text-xs font-bold text-zinc-800">Other Indian states</h3>
                        <SlabEditor slabs={draft.otherStates} onChange={(otherStates) => patch({ otherStates })} />
                    </div>
                </div>
            </section>

            {/* International */}
            <section className="rounded-xl border border-zinc-200 bg-white p-5 space-y-5">
                <div className="flex items-center gap-2">
                    <Globe size={15} className="text-zinc-500" />
                    <h2 className="text-sm font-bold text-zinc-900">International — by weight</h2>
                </div>

                <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 space-y-3">
                    <div>
                        <h3 className="text-xs font-bold text-zinc-800">Default (all other countries)</h3>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Applied to any country without a specific override below.</p>
                    </div>
                    <SlabEditor slabs={draft.international} onChange={(international) => patch({ international })} />
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-zinc-800">Per-country overrides</h3>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{draft.countryRates.length} country(ies)</span>
                    </div>

                    {draft.countryRates.map((rate, index) => (
                        <div key={index} className="rounded-xl border border-zinc-200 p-4 space-y-3">
                            <div className="flex items-end gap-3">
                                <div className="flex-1 max-w-xs">
                                    <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Country</label>
                                    <input
                                        type="text"
                                        value={rate.country}
                                        onChange={(e) => updateCountryRate(index, { country: e.target.value })}
                                        placeholder="e.g. United States"
                                        className={inputClass}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeCountryRate(index)}
                                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                    aria-label="Remove country"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <SlabEditor slabs={rate.slabs} onChange={(slabs) => updateCountryRate(index, { slabs })} />
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={addCountryRate}
                        className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600 hover:text-zinc-900 transition-colors"
                    >
                        <Plus size={12} /> Add country override
                    </button>
                </div>
            </section>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-amber-200 bg-amber-50">
                <p className="text-xs text-amber-900 leading-relaxed">
                    <Package size={14} className="inline mr-1" />
                    Weight is measured in grams. Leave the heaviest slab&apos;s max weight blank so it catches any weight.
                    Current default: {RUPEES(draft.otherStates?.[0]?.charge ?? 0)} across India.
                </p>
                <button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save Delivery Charges
                </button>
            </div>
        </div>
    );
};

export default ShippingSettingsPage;
