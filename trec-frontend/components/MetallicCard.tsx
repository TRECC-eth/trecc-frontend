'use client';

import React from 'react';

interface MetallicCardProps {
  children: React.ReactNode;
  /** Outer wrapper class names */
  className?: string;
  /** Inner content padding and layout */
  contentClassName?: string;
  /** Optional accent, kept for compatibility but styles are unified */
  accent?: 'silver' | 'slate';
}

export default function MetallicCard({ children, className = '', contentClassName = '', accent = 'slate' }: MetallicCardProps) {
  return (
    <div
      className={`
        relative rounded-4xl text-left transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
        /* The Base Chromium Surface Reflection */
        bg-[linear-gradient(160deg,#242429_0%,#0c0c0e_40%,#000000_50%,#0f0f13_60%,#1e1e24_100%)]
        /* Laser-cut edges */
        border border-white/10 border-t-white/25 border-b-black
        /* Thick physical 3D shadow and bevel */
        shadow-[0_30px_60px_-15px_rgba(0,0,0,1),inset_0_2px_4px_rgba(255,255,255,0.2),inset_0_-4px_8px_rgba(0,0,0,0.8)]
        overflow-hidden
        ${className}
      `}
    >
      {/* The Specular Highlight (The top bright reflection of the 3D model) */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.07] to-transparent h-[45%] pointer-events-none transition-colors duration-700" />
      
      {/* Content */}
      <div className={`relative z-10 ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
}
