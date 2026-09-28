"use client";

import React, { useState } from 'react';
import { Pause, Play, Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';

type PauseKind = 'collection' | 'occasion';

type PauseTarget = {
    _id: string;
    name: string;
    isPaused?: boolean;
    /** How many nested sections this toggle also affects. */
    childCount?: number;
};

type Props = {
    kind: PauseKind;
    item: PauseTarget;
    onToggle: (id: string, nextPaused: boolean) => Promise<unknown> | unknown;
    /** 'sm' for table rows. */
    size?: 'sm' | 'md';
};

/**
 * Pausing a collection/occasion hides every product inside it (including nested
 * sub-sections) from the storefront, search, cart and checkout. The section itself stays in
 * the navigation, so unpausing brings it straight back — nothing is deleted.
 */
const PauseToggle: React.FC<Props> = ({ kind, item, onToggle, size = 'sm' }) => {
    const [pending, setPending] = useState(false);
    const [confirming, setConfirming] = useState(false);

    const isPaused = !!item.isPaused;
    const nextPaused = !isPaused;

    const affected = item.childCount && item.childCount > 0
        ? ` This also affects its ${item.childCount} nested ${item.childCount === 1 ? 'section' : 'sections'}.`
        : '';

    const run = async () => {
        setPending(true);
        try {
            await onToggle(item._id, nextPaused);
        } finally {
            setPending(false);
        }
    };

    const base = size === 'sm'
        ? 'px-2.5 py-1 rounded-full text-[9px] gap-1'
        : 'px-4 py-2.5 rounded-lg text-[10px] gap-2';

    return (
        <>
            <button
                type="button"
                disabled={pending}
                onClick={(e) => {
                    e.stopPropagation();
                    // Resuming is safe and expected, so it needs no confirmation.
                    if (nextPaused) setConfirming(true);
                    else void run();
                }}
                title={
                    isPaused
                        ? `${item.name} is paused — click to resume`
                        : `Pause ${item.name} and hide its products from the storefront`
                }
                className={`${base} inline-flex items-center font-bold uppercase tracking-wider border transition-all disabled:opacity-50 disabled:cursor-wait ${
                    isPaused
                        ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                        : 'bg-white text-zinc-500 border-zinc-200 hover:text-zinc-900 hover:border-zinc-400'
                }`}
            >
                {pending ? <Loader2 size={11} className="animate-spin" /> : isPaused ? <Pause size={11} /> : <Play size={11} />}
                <span>{pending ? '...' : isPaused ? 'Paused' : 'Live'}</span>
            </button>

            <Modal
                isOpen={confirming}
                onClose={() => setConfirming(false)}
                onConfirm={() => { void run(); }}
                type="confirm"
                title={`Pause "${item.name}"?`}
                message={
                    `Every product in this ${kind} will be hidden from the storefront immediately — ` +
                    `including search results, product pages, and the cart.` +
                    affected +
                    ` The ${kind} itself stays in your navigation and nothing is deleted.`
                }
                confirmText="Pause it"
                cancelText="Keep it live"
            />
        </>
    );
};

export default PauseToggle;
