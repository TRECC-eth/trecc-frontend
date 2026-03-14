'use client';

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Database, Bot } from 'lucide-react';
import Link from 'next/link';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '#' },
    { id: 'vaults', label: 'Vaults', icon: Database, href: '#' },
    { id: 'agents', label: 'Agents', icon: Bot, href: '#' }
  ];

  // Makes the navbar slightly contract when scrolling down
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center w-full pointer-events-none px-4 md:px-8">
      <nav
        className={`
          relative pointer-events-auto flex items-center justify-between w-full max-w-6xl py-2.5 
          bg-slate-900/60 backdrop-blur-2xl 
          border border-white/10 rounded-full 
          shadow-[0_16px_32px_-8px_rgba(0,0,0,0.5)] 
          shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]
          transition-all duration-500 ease-out
          ${isScrolled ? 'px-6' : 'px-6 md:px-8 hover:shadow-[0_20px_40px_-8px_rgba(0,0,0,0.6)]'}
        `}
      >

        {/* Left: Custom Logo + Text */}
        <Link href="/" className="flex items-center gap-3 group z-10">
          <div className="relative group-hover:scale-105 transition-transform drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
            <img src="/logo.png" alt="TREC Logo" className="w-9 h-9 object-contain" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white hidden sm:block">
            TRECC
          </span>
        </Link>

        {/* Center: Nav Links (Fixed Wrapper to prevent shifting) */}
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {/* Inner pill container */}
          <div className="flex items-center bg-black/40 p-1 rounded-full border border-white/5 relative">

            {/* The Sliding 3D Glass Background */}
            <div
              className="absolute left-1 top-1 bottom-1 w-28 bg-gradient-to-b from-white/15 to-white/5 rounded-full border border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.3)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] backdrop-blur-md transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                transform: `translateX(${tabs.findIndex(t => t.id === activeTab) * 100}%)`
              }}
            />

            {/* The Text/Icons (Sitting above the pill) */}
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative z-10 w-28 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${isActive ? 'text-white drop-shadow-md' : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  <Icon size={16} /> <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Wallet Button (Ultra Metallic Gold) */}
        <div className="flex justify-end z-10">
          <div className="relative rounded-full p-[1.5px] bg-gradient-to-b from-yellow-200 via-yellow-600 to-yellow-900 shadow-[0_0_20px_rgba(202,138,4,0.25)] transition-all duration-500 hover:shadow-[0_0_35px_rgba(234,179,8,0.5)] hover:from-yellow-100 hover:via-yellow-500 hover:to-yellow-800">
            <div className="rounded-full overflow-hidden bg-slate-950 flex items-center justify-center relative group">
              {/* Inner glow that reacts when you hover */}
              <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              <appkit-button />
            </div>
          </div>
        </div>

      </nav>
    </div>
  );
}