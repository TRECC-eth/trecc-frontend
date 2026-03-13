'use client';

import React, { useState } from 'react';
import { ShieldCheck, Bot, Loader2 } from 'lucide-react';

export default function AgentRegistry() {
  const [ensName, setEnsName] = useState('');
  const [isMinting, setIsMinting] = useState(false);

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ensName) return;
    setIsMinting(true);
    
    // We will plug in the wagmi writeContract hook here later
    setTimeout(() => {
      setIsMinting(false);
      console.log("Simulated Minting for:", ensName);
    }, 2000);
  };

  return (
    <div className="max-w-md mx-auto w-full">
      <div className="flex items-center gap-4 bg-slate-950 p-6 rounded-2xl mb-8 border border-slate-800">
        <div className="bg-green-500/20 p-3 rounded-full text-green-500">
          <Bot size={24} />
        </div>
        <div>
          <h3 className="font-bold text-lg">Mint Soulbound ID</h3>
          <p className="text-sm text-slate-400">ERC-8004 Agent Standard</p>
        </div>
      </div>

      <form onSubmit={handleMint} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Agent Name (ENS)</label>
          <input 
            type="text" 
            value={ensName}
            onChange={(e) => setEnsName(e.target.value)}
            placeholder="e.g. tradingbot.eth" 
            className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl focus:outline-none focus:border-green-500 transition-colors"
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={isMinting || !ensName}
          className="w-full bg-green-600 text-white p-4 rounded-xl font-bold hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 transition-colors"
        >
          {isMinting ? (
            <><Loader2 className="animate-spin" size={20} /> Minting NFT...</>
          ) : (
            <><ShieldCheck size={20} /> Register Agent</>
          )}
        </button>
      </form>
    </div>
  );
}