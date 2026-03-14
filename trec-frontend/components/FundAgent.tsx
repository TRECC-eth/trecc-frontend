'use client';

import React, { useState } from 'react';
import { Wallet, Loader2, CheckCircle } from 'lucide-react';

const MIN_FUND_USD = 100;

interface FundAgentProps {
  onFundSuccess?: () => void;
}

export default function FundAgent({ onFundSuccess }: FundAgentProps) {
  const [amount, setAmount] = useState('');
  const [isFunding, setIsFunding] = useState(false);

  const numAmount = Number(amount);
  const meetsMinimum = !Number.isNaN(numAmount) && numAmount >= MIN_FUND_USD;

  const handleFund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetsMinimum) return;
    setIsFunding(true);
    // Simulate tx / contract call
    setTimeout(() => {
      setIsFunding(false);
      onFundSuccess?.();
    }, 2000);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative p-8 rounded-2xl bg-gradient-to-b from-slate-800/90 to-slate-900/95 border border-slate-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none rounded-2xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="text-emerald-400" size={24} />
            <h3 className="text-xl font-bold text-white">Fund Your Agent</h3>
          </div>
          <p className="text-slate-400 text-sm mb-6">
            Add at least ${MIN_FUND_USD} USD to your agent wallet to start borrowing and trading.
          </p>

          <form onSubmit={handleFund} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Amount (USD)</label>
              <div className="relative">
                <input
                  type="number"
                  min={MIN_FUND_USD}
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="100"
                  className="w-full bg-black/50 border border-white/10 p-4 pl-12 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all"
                />
                <span className="absolute left-4 top-4 text-slate-500 font-medium">$</span>
              </div>
              {amount && !meetsMinimum && (
                <p className="mt-1.5 text-amber-400 text-sm">Minimum amount is ${MIN_FUND_USD} USD</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isFunding || !meetsMinimum}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-white p-4 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              {isFunding ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  Add ${amount || MIN_FUND_USD} to Agent
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
