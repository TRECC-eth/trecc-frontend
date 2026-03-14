'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import LenderDashboard from '../../../components/LenderDashboard';

export default function LenderDashboardPage() {
  return (
    <div className="w-full min-h-[calc(100vh-5rem)] flex flex-col bg-black">
      <div className="flex items-center justify-between px-6 md:px-10 py-6 border-b border-white/5">
        <Link
          href="/"
          className="
            flex items-center gap-2 font-medium text-xs tracking-widest
            text-zinc-500 hover:text-zinc-200 transition-colors duration-300
          "
        >
          <ArrowLeft size={14} strokeWidth={1.5} /> BACK TO HOME
        </Link>
        <h1 className="text-xl md:text-2xl font-medium tracking-tight text-transparent bg-clip-text bg-[linear-gradient(180deg,#ffffff_0%,#ffffff_40%,#8c8c8c_100%)]">
          Lender Dashboard
        </h1>
        <div className="w-20" />
      </div>
      <div className="flex-1 px-4 md:px-6 py-4 md:py-6 overflow-auto flex flex-col">
        <LenderDashboard />
      </div>
    </div>
  );
}
