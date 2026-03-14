'use client';

import React from 'react';

interface MetallicCardProps {
  children: React.ReactNode;
  /** Outer wrapper (gradient border) */
  className?: string;
  /** Inner content padding, e.g. p-5 or p-6 */
  contentClassName?: string;
  /** Optional accent: silver (brighter top shine) or slate (subtle) */
  accent?: 'silver' | 'slate';
}

const accentOverlays: Record<NonNullable<MetallicCardProps['accent']>, string> = {
  silver: 'from-white/5 to-transparent',
  slate: 'from-white/5 to-transparent',
};

export default function MetallicCard({ children, className = '', contentClassName = '', accent = 'slate' }: MetallicCardProps) {
  return (
    <div
      className={`
        rounded-xl border-2 border-white/50 bg-black
        ${className}
      `}
    >
      <div className="relative overflow-hidden rounded-xl bg-black">
        <div
          className={`absolute inset-0 pointer-events-none rounded-xl bg-gradient-to-br ${accentOverlays[accent]}`}
          aria-hidden
        />
        <div className={`relative z-10 ${contentClassName}`}>{children}</div>
      </div>
    </div>
  );
}
