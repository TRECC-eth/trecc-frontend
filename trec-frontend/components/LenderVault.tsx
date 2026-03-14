'use client';

import React, { useState } from 'react';
import { Wallet, ArrowDownCircle, Loader2 } from 'lucide-react';

interface LenderVaultProps {
  onDepositSuccess?: () => void;
}

export default function LenderVault({ onDepositSuccess }: LenderVaultProps) {
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
      onDepositSuccess?.();
    }, 2000);
  };

  return (
    <div className="max-w-md mx-auto w-full">
      <div className="bg-white/5 p-6 rounded-2xl mb-8 border border-white/10 flex justify-between items-center shadow-inner">
        <div>
          <p className="text-sm text-zinc-500 mb-1 tracking-wide">Protocol TVL</p>
          <p className="text-3xl font-medium text-white tracking-tight">$1,250,000</p>
        </div>
        <div className="bg-white/10 text-zinc-300 border border-white/10 px-3 py-1 rounded-full text-xs font-medium tracking-wide">
          10% APY
        </div>
      </div>

      <form onSubmit={handleDeposit} className="space-y-6">
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-3 tracking-wide uppercase">Deposit Amount (USDC)</label>
          <div className="relative group">
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000" 
              className="
                w-full bg-black/40 border border-white/10 p-4 pl-12 rounded-xl text-white placeholder-zinc-700 
                focus:outline-none focus:border-white/30 focus:bg-black/60 transition-all duration-300
              "
              required
            />
            <Wallet className="absolute left-4 top-4 text-zinc-600 group-focus-within:text-zinc-300 transition-colors duration-300" size={20} />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isDepositing || !amount}
          className="
            w-full bg-white text-black p-4 rounded-xl font-medium tracking-wide
            hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed 
            flex justify-center items-center gap-2 transition-all duration-300
            shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]
          "
        >
          {isDepositing ? (
            <><Loader2 className="animate-spin" size={20} /> Processing...</>
          ) : (
            <><ArrowDownCircle size={20} /> PROVIDE LIQUIDITY</>
          )}
        </button>
      </form>
    </div>
  );
}