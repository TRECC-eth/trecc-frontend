'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, Bot, ArrowLeft } from 'lucide-react';
import AgentRegistry from '../components/AgentRegistry';
import LenderVault from '../components/LenderVault';
import FundAgent from '../components/FundAgent';

export default function Home() {
  const router = useRouter();
  const [role, setRole] = useState<'lender' | 'borrower' | null>(null);
  const [hasProvidedLiquidity, setHasProvidedLiquidity] = useState(false);
  const [agentCreated, setAgentCreated] = useState(false);
  const [hasFundedAgent, setHasFundedAgent] = useState(false);

  const handleDepositSuccess = useCallback(() => {
    setHasProvidedLiquidity(true);
    router.push('/dashboard/lender');
  }, [router]);

  const handleFundSuccess = useCallback(() => {
    setHasFundedAgent(true);
    router.push('/dashboard/borrower');
  }, [router]);

  const handleSwitchRole = useCallback(() => {
    setRole(null);
    setHasProvidedLiquidity(false);
    setAgentCreated(false);
    setHasFundedAgent(false);
  }, []);

  useEffect(() => {
    if (agentCreated && hasFundedAgent && role === 'borrower') router.push('/dashboard/borrower');
  }, [agentCreated, hasFundedAgent, role, router]);

  // STATE 1: Choose Identity
  if (!role) {
    return (
      <div className="flex flex-col items-center justify-center flex-grow p-8 relative">
        {/* Background glow for the premium feel - Metallic/Neutral */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-slate-500/10 rounded-full blur-[120px] pointer-events-none" />

        <h1 className="text-4xl md:text-6xl font-extrabold mb-4 text-center tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500 z-10 drop-shadow-sm">
          Select Your Identity
        </h1>
        <p className="text-slate-400 mb-12 text-center max-w-lg z-10 text-lg">
          Are you depositing liquidity to earn yield, or minting an ERC-8004 Agent to execute trades?
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl z-10">
          {/* LENDER BUTTON */}
          <button 
            onClick={() => setRole('lender')}
            className="group relative p-8 rounded-3xl border border-white/10 bg-gradient-to-b from-neutral-900 to-black backdrop-blur-md hover:border-white/20 hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.1)] transition-all duration-300 text-left shadow-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10 bg-neutral-800/50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-white/5 group-hover:border-white/20 shadow-inner">
              <TrendingUp className="text-slate-200" size={32} />
            </div>
            <h2 className="relative z-10 text-2xl font-bold mb-2 text-white group-hover:text-slate-200 transition-colors">I am Rahul (Lender)</h2>
            <p className="relative z-10 text-slate-500 group-hover:text-slate-400 transition-colors">Provide USDC capital to verified AI agents and earn passive yield.</p>
          </button>

          {/* BORROWER BUTTON */}
          <button 
            onClick={() => setRole('borrower')}
            className="group relative p-8 rounded-3xl border border-white/10 bg-gradient-to-b from-neutral-900 to-black backdrop-blur-md hover:border-white/20 hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.1)] transition-all duration-300 text-left shadow-2xl overflow-hidden"
          >
             <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10 bg-neutral-800/50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-white/5 group-hover:border-white/20 shadow-inner">
              <Bot className="text-slate-200" size={32} />
            </div>
            <h2 className="relative z-10 text-2xl font-bold mb-2 text-white group-hover:text-slate-200 transition-colors">I am Sky (Borrower)</h2>
            <p className="relative z-10 text-slate-500 group-hover:text-slate-400 transition-colors">Mint your Soulbound ID, build reputation, and command Elsa to trade.</p>
          </button>
        </div>
      </div>
    );
  }

  // STATE 2: Active Dashboard
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full z-10 relative">
      <button 
        onClick={handleSwitchRole} 
        className="text-slate-400 hover:text-white mb-8 flex items-center gap-2 transition-colors font-medium bg-neutral-900/50 px-4 py-2 rounded-full border border-white/10 hover:bg-neutral-800 hover:border-white/20 w-fit"
      >
        <ArrowLeft size={18} /> Switch Role
      </button>

      {role === 'lender' ? (
        // LENDER: Provide liquidity then redirect to /dashboard/lender
        <div className="p-8 border border-white/10 rounded-3xl bg-black/40 backdrop-blur-xl shadow-2xl flex flex-col items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          <h2 className="relative z-10 text-3xl font-bold mb-2 text-center text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
            Liquidity Vault
          </h2>
          <p className="relative z-10 text-slate-400 mb-8">Provide USDC to start earning yield. You will be taken to your dashboard after your first deposit.</p>
          <div className="relative z-10 w-full">
            <LenderVault onDepositSuccess={handleDepositSuccess} />
          </div>
        </div>
      ) : (
        // BORROWER: Step 1 → Agent, Step 2 → Fund $100+, Step 3 → Dashboard + Elsa
        <div className="w-full flex flex-col gap-8">
          {!agentCreated ? (
            <>
              <div className="p-8 border border-white/10 rounded-3xl bg-black/40 backdrop-blur-xl shadow-2xl flex flex-col items-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                <h2 className="relative z-10 text-3xl font-bold mb-2 text-center text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
                  Agent Identity
                </h2>
                <p className="relative z-10 text-slate-400 mb-8">Mint your ERC-8004 Soulbound NFT. Then fund your agent with at least $100 to access your dashboard.</p>
                <div className="relative z-10 w-full">
                  <AgentRegistry onAgentMinted={() => setAgentCreated(true)} />
                </div>
              </div>
            </>
          ) : !hasFundedAgent ? (
            <>
              <div className="p-8 border border-white/10 rounded-3xl bg-black/40 backdrop-blur-xl shadow-2xl flex flex-col items-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                <h2 className="relative z-10 text-3xl font-bold mb-2 text-center text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
                  Fund Your Agent
                </h2>
                <p className="relative z-10 text-slate-400 mb-8">Add at least $100 USD to your agent. You will be taken to your dashboard after funding.</p>
                <div className="relative z-10 w-full">
                  <FundAgent onFundSuccess={handleFundSuccess} />
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}