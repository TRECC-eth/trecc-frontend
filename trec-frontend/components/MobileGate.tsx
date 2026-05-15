'use client';

import React from 'react';
import { Monitor } from 'lucide-react';

export default function MobileGate({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Mobile overlay — visible only on small screens */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black md:hidden">
        {/* Radial ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_60%,rgba(200,200,220,0.10),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_400px_at_50%_50%,rgba(160,165,185,0.06),transparent)]" />
        </div>

        <div className="relative z-10 flex flex-col items-center px-8 text-center max-w-sm">
          {/* Icon container — matches the "engraved" style */}
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-10 bg-black border border-white/[0.05] shadow-[inset_0_2px_8px_rgba(0,0,0,0.8),0_1px_1px_rgba(255,255,255,0.1)]">
            <Monitor className="text-zinc-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" size={36} strokeWidth={1.5} />
          </div>

          <h1 className="text-3xl font-medium tracking-tight mb-4 text-transparent bg-clip-text bg-[linear-gradient(180deg,#ffffff_0%,#ffffff_40%,#8c8c8c_55%,#3a3a3a_100%)]">
            Desktop Only
          </h1>

          <p className="text-zinc-500 text-sm font-light leading-relaxed tracking-wide mb-10">
            TRECC Protocol is optimised for desktop environments. Please switch to a larger screen to access the platform.
          </p>

          {/* Decorative divider */}
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
        </div>
      </div>

      {/* Desktop content — always rendered, hidden on mobile by the overlay */}
      {children}
    </>
  );
}
