'use client';

import React, { useState } from 'react';
import { Bot, Zap, ShieldCheck, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function BorrowerDashboard() {
  const [borrowAmount, setBorrowAmount] = useState<number | ''>(1000);
  const [aiStatus, setAiStatus] = useState<'scanning' | 'opportunity' | 'executing' | 'monitoring'>('scanning');

  // --- The TREC Dynamic Collateral Math ---
  const calculateCollateral = (amount: number) => {
    if (!amount || amount <= 0) return 0;
    if (amount <= 1000) return 110; 
    return amount * 0.12; 
  };

  const collateralRequired = calculateCollateral(Number(borrowAmount));

  // Simulate the AI finding a deal after 3 seconds
  React.useEffect(() => {
    if (aiStatus === 'scanning') {
      const timer = setTimeout(() => setAiStatus('opportunity'), 3000);
      return () => clearTimeout(timer);
    }
  }, [aiStatus]);

  // --- BITGO MPC EXECUTION WIRING ---
  const handleApproveTrade = async () => {
    setAiStatus('executing');
    
    try {
      const response = await fetch('/api/bitgo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD", 
          value: "0",
          data: "0x" 
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log("Boom! Transaction Hash:", data.txHash);
        setAiStatus('monitoring'); 
      } else {
        console.error("Execution Blocked:", data.error);
        alert(`AI Execution Failed: ${data.error}`);
        setAiStatus('opportunity'); 
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Failed to connect to the TREC BitGo Server.");
      setAiStatus('opportunity');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-700">
      
      {/* Top Header Section */}
      <div className="flex items-center justify-between p-6 bg-slate-900/50 border border-white/10 rounded-3xl backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bot className="text-emerald-400" /> Sky's Trading Agent
          </h2>
          <p className="text-slate-400 text-sm mt-1">ERC-8004 Identity Verified • BitGo MPC Vault Active</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Credit Score</p>
          <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            720
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: The Collateral & Borrow Setup */}
        <div className="p-6 bg-slate-900/80 border border-white/10 rounded-3xl shadow-xl">
          <h3 className="text-lg font-bold text-white mb-6">1. Request Capital</h3>
          
          <div className="space-y-6">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Amount to Borrow (USDC)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <input 
                  type="number" 
                  value={borrowAmount}
                  onChange={(e) => setBorrowAmount(Number(e.target.value))}
                  className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-8 pr-4 text-white text-xl font-medium focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Risk Tier</span>
                <span className="text-white font-medium">
                  {Number(borrowAmount) <= 1000 ? 'Standard (Flat Fee)' : 'Whale (12% Dynamic)'}
                </span>
              </div>
              <div className="h-px w-full bg-white/10" />
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-medium">Required Collateral</span>
                <span className="text-xl font-bold text-yellow-400">${collateralRequired.toLocaleString()}</span>
              </div>
            </div>

            <button className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-90 text-white font-bold transition-opacity flex justify-center items-center gap-2">
              <Zap size={18} /> Stake Bond & Fund AI Vault
            </button>
          </div>
        </div>

        {/* Right Column: The Proactive AI Terminal */}
        <div className="flex flex-col h-full bg-black border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
          <div className="p-4 border-b border-white/10 bg-slate-900/50 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-medium text-slate-300">TREC Sentinel Terminal</span>
          </div>
          
          <div className="p-6 flex-1 flex flex-col justify-center space-y-4">
            
            {aiStatus === 'scanning' && (
              <div className="text-center space-y-4 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-white/5 mx-auto flex items-center justify-center">
                  <Bot className="text-slate-500" />
                </div>
                <p className="text-slate-400 text-sm">Scanning verified protocols for optimal yield...</p>
              </div>
            )}

            {aiStatus === 'opportunity' && (
              <div className="bg-slate-900 border border-blue-500/30 p-5 rounded-2xl animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex gap-3 mb-3">
                  <AlertTriangle className="text-blue-400" />
                  <h4 className="font-bold text-white">High Yield Opportunity Detected</h4>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed mb-4">
                  I found an opportunity on the <strong className="text-white">Uniswap V3 USDC/ETH Pool</strong> yielding 12.4% APY. 
                  Target contract is verified by TREC Risk Engine.
                </p>
                <div className="p-3 bg-black/50 rounded-xl mb-4 border border-white/5 text-sm font-mono text-slate-400">
                  Payload: 0x3fC9...FAD<br/>
                  Action: Provide Liquidity<br/>
                  Amount: ${borrowAmount || 0}
                </div>
                <button 
                  onClick={handleApproveTrade}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  Approve Transaction <ArrowRight size={16} />
                </button>
              </div>
            )}

            {aiStatus === 'executing' && (
              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-emerald-500 animate-spin mx-auto" />
                <p className="text-emerald-400 text-sm font-medium">BitGo MPC Wallet Signing Transaction...</p>
              </div>
            )}

            {aiStatus === 'monitoring' && (
              <div className="text-center space-y-3 animate-in zoom-in duration-500">
                <CheckCircle2 className="text-emerald-500 mx-auto w-16 h-16" />
                <h3 className="text-xl font-bold text-white">Capital Deployed</h3>
                <p className="text-slate-400 text-sm">
                  Sentinel Agent is now actively monitoring your position via Chainlink Price Feeds. 
                  Emergency 10% Stop-Loss is active.
                </p>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}