'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/50 backdrop-blur-xl border-b border-white/5 supports-[backdrop-filter]:bg-slate-950/30">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-3 group cursor-pointer">
          <div className="bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/20 group-hover:border-blue-500/40 group-hover:bg-blue-500/20 transition-all duration-300">
            <ShieldCheck className="text-blue-400" size={24} />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-white">
            TREC<span className="text-slate-500 font-medium ml-1.5">Protocol</span>
          </span>
        </Link>

        {/* Center Links (Product Aesthetic) */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <Link href="/" className="text-white transition-colors">Dashboard</Link>
          <Link href="#" className="hover:text-white transition-colors duration-200">Vaults</Link>
          <Link href="#" className="hover:text-white transition-colors duration-200">Agents</Link>
          <Link href="#" className="hover:text-white transition-colors duration-200">Docs</Link>
        </div>

        {/* Action Section */}
        <div className="flex items-center gap-4">
          <appkit-button />
        </div>

      </div>
    </nav>
  );
}