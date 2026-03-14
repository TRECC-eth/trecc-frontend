'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import LenderDashboard from '../../../components/LenderDashboard';

export default function LenderDashboardPage() {
  return (
    <div className="w-full min-h-[calc(100vh-5rem)] flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b-2 border-white/40">
        <Link
          href="/"
          className="text-white/70 hover:text-white inline-flex items-center gap-2 transition-colors font-medium px-4 py-2 rounded-full border-2 border-white/50 hover:bg-white/5 w-fit"
        >
          <ArrowLeft size={18} /> Back
        </Link>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-white">
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
