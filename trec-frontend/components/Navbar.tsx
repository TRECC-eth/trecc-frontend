'use client';

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Database, Bot } from 'lucide-react';
import Link from 'next/link';
import { useAccount, useEnsName, useEnsAvatar } from 'wagmi';
import { mainnet } from 'wagmi/chains';

// --- CONFIG: PASTE YOUR WALLET ADDRESS HERE FOR THE DEMO ---
const DEMO_ADDRESS = "0x29d637b793c29372ab93cd4f401f1db639835097";
const DEMO_NAME = "sky.eth";
const DEMO_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg?seed=Sky"; // A cool AI-style avatar

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const { address, isConnected } = useAccount();

  // 1. Fetch real ENS data
  const { data: realEnsName } = useEnsName({
    address,
    chainId: mainnet.id,
  });

  const { data: realEnsAvatar } = useEnsAvatar({
    name: realEnsName || undefined,
    chainId: mainnet.id,
  });

  // 2. Logic: If it's your wallet, use the Demo Identity. Otherwise, use real ENS or fallback.
  const isDemo = address?.toLowerCase() === DEMO_ADDRESS.toLowerCase();
  const displayId = isDemo ? DEMO_NAME : (realEnsName || `${address?.slice(0, 4)}...${address?.slice(-4)}`);
  const displayAvatar = isDemo ? DEMO_AVATAR : (realEnsAvatar || null);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '#' },
    { id: 'vaults', label: 'Vaults', icon: Database, href: '#' },
    { id: 'agents', label: 'Agents', icon: Bot, href: '#' }
  ];

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

        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-3 group z-10">
          <div className="relative group-hover:scale-105 transition-transform drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
            <img src="/logo.png" alt="TREC Logo" className="w-9 h-9 object-contain" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white hidden sm:block">
            TRECC
          </span>
        </Link>

        {/* Center: Sliding Tabs */}
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="flex items-center bg-black/40 p-1 rounded-full border border-white/5 relative">
            <div
              className="absolute left-1 top-1 bottom-1 w-28 bg-gradient-to-b from-white/15 to-white/5 rounded-full border border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.3)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] backdrop-blur-md transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                transform: `translateX(${tabs.findIndex(t => t.id === activeTab) * 100}%)`
              }}
            />

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

        {/* Right Area: ENS Identity + AppKit */}
        <div className="flex items-center gap-3 z-10">

          {/* THE ENS MAGIC PILL */}
          {isConnected && (
            <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 rounded-full pl-1.5 pr-3 py-1 animate-in fade-in slide-in-from-right-4 duration-500">
              {displayAvatar ? (
                <img src={displayAvatar} alt="ENS" className="w-6 h-6 rounded-full border border-white/20" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 border border-white/20" />
              )}
              <span className="text-xs font-semibold text-white">
                {displayId}
              </span>
            </div>
          )}

          {/* Wallet Button Container */}
          <div className="relative rounded-full p-[1.5px] bg-gradient-to-b from-yellow-200 via-yellow-600 to-yellow-900 shadow-[0_0_20px_rgba(202,138,4,0.25)] transition-all duration-500 hover:shadow-[0_0_35px_rgba(234,179,8,0.5)]">
            <div className="rounded-full overflow-hidden bg-slate-950 flex items-center justify-center relative group">
              <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              <appkit-button />
            </div>
          </div>
        </div>

      </nav>
    </div>
  );
}