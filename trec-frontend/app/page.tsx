'use client';

import React, { useState } from 'react';
import { TrendingUp, Bot, ArrowLeft } from 'lucide-react';
import AgentRegistry from '../components/AgentRegistry';
import LenderVault from '../components/LenderVault';

export default function Home() {
  const [role, setRole] = useState<'lender' | 'borrower' | null>(null);

  if (!role) {
    return (
      <div className="flex flex-col items-center justify-center flex-grow p-8 mt-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">Select Your Identity</h1>
        <p className="text-slate-400 mb-12 text-center max-w-lg">
          Are you depositing liquidity to earn yield, or minting an ERC-8004 Agent to execute trades?
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          <button 
            onClick={() => setRole('lender')}
            className="group p-8 rounded-3xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:border-blue-500 transition-all text-left shadow-lg"
          >
            <TrendingUp className="text-blue-500 mb-4 group-hover:scale-110 transition-transform" size={48} />
            <h2 className="text-2xl font-bold mb-2">I am Rahul (Lender)</h2>
            <p className="text-slate-400">Provide USDC capital to verified AI agents and earn passive yield.</p>
          </button>

          <button 
            onClick={() => setRole('borrower')}
            className="group p-8 rounded-3xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:border-green-500 transition-all text-left shadow-lg"
          >
            <Bot className="text-green-500 mb-4 group-hover:scale-110 transition-transform" size={48} />
            <h2 className="text-2xl font-bold mb-2">I am Sky (Borrower)</h2>
            <p className="text-slate-400">Mint your Soulbound ID, build reputation, and access undercollateralized loans.</p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto w-full mt-8">
      <button 
        onClick={() => setRole(null)} 
        className="text-slate-500 hover:text-white mb-8 flex items-center gap-2 transition-colors font-medium"
      >
        <ArrowLeft size={18} /> Switch Role
      </button>

      <div className="p-8 border border-slate-800 rounded-3xl bg-slate-900 shadow-2xl flex flex-col items-center">
        {role === 'lender' ? (
          <>
            <h2 className="text-3xl font-bold mb-8 text-center text-blue-500">Liquidity Vault</h2>
            <LenderVault />
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold mb-8 text-center text-green-500">Agent Registration</h2>
            <AgentRegistry />
          </>
        )}
      </div>
    </div>
  );
}