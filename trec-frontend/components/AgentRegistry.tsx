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
    writeContract({
      address: TREC_REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: 'registerAgent',
      args: [ensName],
    });
  };

  // STATE: Not Connected
  if (!isConnected) {
    return (
      <div className="text-center p-8 bg-white/5 rounded-3xl border border-dashed border-white/20">
        <p className="text-slate-400">Connect your wallet to begin Agent Onboarding.</p>
      </div>
    );
  }

  // STATE: Success (The "Identity Card" view)
  if (isSuccess) {
    return (
      <div className="w-full max-w-md animate-in zoom-in-95 duration-500">
        <div className="relative p-8 rounded-[2rem] bg-gradient-to-br from-slate-900 to-black border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.1)] overflow-hidden">
          {/* Holographic effect */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-[80px]" />
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-12">
              <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
                <ShieldCheck className="text-emerald-400" size={28} />
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold">ERC-8004 Certified</p>
                <p className="text-xs text-slate-500 font-mono">ID: #0001</p>
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
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Verified
                </p>
              </div>
            </div>
          </div>
        </div>
        <p className="text-center text-slate-500 text-xs mt-4">This identity is Soulbound and non-transferable.</p>
      </div>
    );
  }

  // STATE: Default (Registration form)
  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300 ml-1">Preferred Agent Name</label>
        <div className="relative">
          <input 
            type="text" 
            placeholder="e.g. sky.eth"
            value={ensName}
            onChange={(e) => setEnsName(e.target.value)}
            disabled={isMinting || isConfirming}
            className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
          />
        </div>
      </div>

      <button 
        onClick={handleRegister}
        disabled={!ensName || isMinting || isConfirming}
        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-green-900/20 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
      >
        {isMinting || isConfirming ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            {isMinting ? "Checking Reputation..." : "Minting Soulbound ID..."}
          </>
        ) : (
          <>
            <UserPlus size={20} />
            Mint Agent Identity
          </>
        )}
      </button>

      {hash && (
        <a 
          href={`https://sepolia.basescan.org/tx/${hash}`} 
          target="_blank" 
          className="block text-center text-xs text-blue-400 hover:underline"
        >
          View Transaction on Basescan
        </a>
      )}
    </div>
  );
}