'use client';

import React, { useState } from 'react';
import { Wallet, ArrowDownCircle, Loader2 } from 'lucide-react';

export default function LenderVault() {
  const [amount, setAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    setIsDepositing(true);
    
    // We will plug in the wagmi writeContract hook here later
    setTimeout(() => {
      setIsDepositing(false);
      console.log("Simulated Deposit for:", amount, "USDC");
    }, 2000);
  };

  return (
    <div className="max-w-md mx-auto w-full">
      <div className="bg-neutral-900/50 p-6 rounded-2xl mb-8 border border-white/10 flex justify-between items-center shadow-inner">
        <div>
          <p className="text-sm text-slate-400 mb-1">Protocol TVL</p>
          <p className="text-3xl font-mono font-bold text-white">$1,250,000</p>
        </div>
        <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-sm font-semibold shadow-[0_0_10px_rgba(16,185,129,0.2)]">
          10% APY
        </div>
      </div>

      <form onSubmit={handleDeposit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Deposit Amount (USDC)</label>
          <div className="relative">
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000" 
              className="w-full bg-black/50 border border-white/10 p-4 pl-12 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all"
              required
            />
            <Wallet className="absolute left-4 top-4 text-slate-500" size={20} />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isDepositing || !amount}
          className="w-full bg-white text-black p-4 rounded-xl font-bold hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        >
          {isDepositing ? (
            <><Loader2 className="animate-spin" size={20} /> Processing...</>
          ) : (
            <><ArrowDownCircle size={20} /> Provide Liquidity</>
          )}
        </button>
      </form>
    </div>
  );
}