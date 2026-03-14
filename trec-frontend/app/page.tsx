'use client';

import React, { useState } from 'react';
import { TrendingUp, Bot, ArrowLeft } from 'lucide-react';
import AgentRegistry from '../components/AgentRegistry';
import LenderVault from '../components/LenderVault';
import ElsaChat from '../components/ElsaChat'; // <-- Imported our new Brain!

export default function Home() {
  const [role, setRole] = useState<'lender' | 'borrower' | null>(null);

  // STATE 1: Choose Identity
  if (!role) {
    return (
      <div className="flex flex-col items-center justify-center flex-grow p-8 relative">
        {/* Background glow for the premium feel */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-600/10 rounded-full blur-[120px] pointer-events-none" />

        <h1 className="text-4xl md:text-6xl font-extrabold mb-4 text-center tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 z-10">
          Select Your Identity
        </h1>
        <p className="text-slate-400 mb-12 text-center max-w-lg z-10 text-lg">
          Are you depositing liquidity to earn yield, or minting an ERC-8004 Agent to execute trades?
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl z-10">
          {/* LENDER BUTTON */}
          <button 
            onClick={() => setRole('lender')}
            className="group p-8 rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-md hover:bg-slate-800/80 hover:border-blue-500/50 transition-all text-left shadow-2xl"
          >
            <div className="bg-blue-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-blue-500/30">
              <TrendingUp className="text-blue-400" size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-white">I am Rahul (Lender)</h2>
            <p className="text-slate-400">Provide USDC capital to verified AI agents and earn passive yield.</p>
          </button>

          {/* BORROWER BUTTON */}
          <button 
            onClick={() => setRole('borrower')}
            className="group p-8 rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-md hover:bg-slate-800/80 hover:border-green-500/50 transition-all text-left shadow-2xl"
          >
            <div className="bg-green-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-green-500/30">
              <Bot className="text-green-400" size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-white">I am Sky (Borrower)</h2>
            <p className="text-slate-400">Mint your Soulbound ID, build reputation, and command Elsa to trade.</p>
          </button>
        </div>
      </div>
    );
  }

  // STATE 2: Active Dashboard
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full z-10 relative">
      <button 
        onClick={() => setRole(null)} 
        className="text-slate-400 hover:text-white mb-8 flex items-center gap-2 transition-colors font-medium bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:bg-white/10 w-fit"
      >
        <ArrowLeft size={18} /> Switch Role
      </button>

      {role === 'lender' ? (
        // RAHUL'S VIEW: Just the Vault
        <div className="p-8 border border-white/10 rounded-3xl bg-slate-900/80 backdrop-blur-xl shadow-2xl flex flex-col items-center">
          <h2 className="text-3xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
            Liquidity Vault
          </h2>
          <LenderVault />
        </div>
      ) : (
        // SKY'S VIEW: Registry + Elsa Chat Terminal
        <div className="w-full flex flex-col gap-8">
          {/* Identity Section */}
          <div className="p-8 border border-white/10 rounded-3xl bg-slate-900/80 backdrop-blur-xl shadow-2xl flex flex-col items-center">
            <h2 className="text-3xl font-bold mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
              Agent Identity
            </h2>
            <p className="text-slate-400 mb-8">Mint your ERC-8004 Soulbound NFT to establish your on-chain credit score.</p>
            <AgentRegistry />
          </div>

          {/* Action Section (The Brain) */}
          <ElsaChat />
        </div>
      )}
    </div>
  );
}