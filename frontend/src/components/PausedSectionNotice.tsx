"use client";

import React from 'react';
import Link from 'next/link';
import { PauseCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

type Props = {
    kind: 'collection' | 'occasion';
    sectionName: string;
    /** Set when the section is paused only because an ancestor is paused. */
    pausedBecause?: string | null;
    browseAllHref: string;
    browseAllLabel: string;
};

/**
 * Shown on a section page whose products are hidden. The section itself stays browsable and
 * stays in the navigation — this explains why the grid is empty instead of looking broken.
 */
const PausedSectionNotice: React.FC<Props> = ({
    sectionName,
    pausedBecause,
    browseAllHref,
    browseAllLabel
}) => {
    const inherited = !!pausedBecause;

    return (
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 pt-6 sm:pt-8">
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                role="status"
                className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 px-5 sm:px-7 py-5 sm:py-6 rounded-2xl bg-amber-50/80 border border-amber-200/80 backdrop-blur-sm"
            >
                <div className="w-11 h-11 shrink-0 rounded-full bg-amber-100/80 flex items-center justify-center">
                    <PauseCircle size={22} className="text-amber-600" />
                </div>

                <div className="flex-1 space-y-1.5">
                    <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-amber-700/80">
                        Temporarily unavailable
                    </p>
                    <p className="text-sm sm:text-base font-bold text-zinc-900 leading-snug">
                        {inherited
                            ? `“${sectionName}” is unavailable while “${pausedBecause}” is paused.`
                            : `“${sectionName}” is paused at the moment.`}
                    </p>
                    <p className="text-xs sm:text-[13px] text-zinc-600 leading-relaxed font-medium">
                        The designs in this {sectionName} are being refreshed and cannot be ordered
                        right now. They have not been removed — keep browsing the rest of the
                        collection in the meantime.
                    </p>
                </div>

                <Link
                    href={browseAllHref}
                    className="inline-flex items-center justify-center gap-2 self-start sm:self-center shrink-0 px-5 py-3 rounded-xl bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-black transition-all active:scale-95 whitespace-nowrap"
                >
                    {browseAllLabel}
                    <ArrowRight size={13} />
                </Link>
            </motion.div>
        </div>
    );
};

export default PausedSectionNotice;
