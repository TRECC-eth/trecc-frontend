'use client';

import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { ShieldCheck, UserPlus, Loader2, CreditCard, Zap } from 'lucide-react';
import { REGISTRY_ABI } from '../constants/abi/registryAbi';
import { TREC_REGISTRY_ADDRESS } from '../constants/addresses';

export default function AgentRegistry() {
  const [ensName, setEnsName] = useState('');
  const { address, isConnected } = useAccount();

  // 1. Hook to Mint the Agent NFT
  const { writeContract, data: hash, isPending: isMinting } = useWriteContract();

  // 2. Wait for the transaction to actually hit the block
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // 3. Read the Agent Profile back from the blockchain once minted
  const { data: profile } = useReadContract({
    address: TREC_REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'agentProfiles',
    args: [BigInt(0)], // For the demo, we'll fetch ID 0
    query: { enabled: isSuccess }
  });

  const handleRegister = () => {
    if (!ensName) return;
    setIsMinting(true);

    // We will plug in the wagmi writeContract hook here later
    setTimeout(() => {
      setIsMinting(false);
      console.log("Simulated Minting for:", ensName);
    }, 2000);
  };

  // STATE: Not Connected
  if (!isConnected) {
    return (
      <div className="text-center p-8 bg-black/40 rounded-3xl border border-dashed border-white/10 backdrop-blur-sm">
        <p className="text-slate-400">Connect your wallet to begin Agent Onboarding.</p>
      </div>
    );
  }

  // STATE: Success (The "Identity Card" view)
  if (isSuccess) {
    return (
      <div className="w-full max-w-md animate-in zoom-in-95 duration-500">
        <div className="relative p-8 rounded-[2rem] bg-gradient-to-br from-neutral-900 to-black border border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.05)] overflow-hidden">
          {/* Holographic effect */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/5 rounded-full blur-[80px]" />
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-12">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                <ShieldCheck className="text-slate-200" size={28} />
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">ERC-8004 Certified</p>
                <p className="text-xs text-slate-600 font-mono">ID: #0001</p>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-white mb-1">{ensName || "Anonymous Agent"}</h3>
            <p className="text-slate-500 text-xs font-mono mb-8">{address?.slice(0, 12)}...{address?.slice(-8)}</p>

            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Reputation Score</p>
                <p className="text-xl font-bold text-white flex items-center gap-2">
                  500 <Zap size={16} className="text-yellow-400 fill-yellow-400" />
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">KYC Status</p>
                <p className="text-emerald-400 text-sm font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.8)]"></span> Verified
                </p>
              </div>
            </div>
          </div>
        </div>
        <p className="text-center text-slate-600 text-xs mt-4">This identity is Soulbound and non-transferable.</p>
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
    </div >
  );
  }