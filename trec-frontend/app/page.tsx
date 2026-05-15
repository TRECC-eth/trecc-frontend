'use client';

import React, { Suspense, useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TrendingUp, Bot, ArrowLeft } from 'lucide-react';
import AgentRegistry from '../components/AgentRegistry';
import LenderVault from '../components/LenderVault';
import ElsaChat from '../components/ElsaChat';
import BorrowerGate from '../components/BorrowerGate';

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<'lender' | 'borrower' | null>(null);
  const [hasProvidedLiquidity, setHasProvidedLiquidity] = useState(false);
  const [agentCreated, setAgentCreated] = useState(false);
  const [hasFundedAgent, setHasFundedAgent] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [bootText, setBootText] = useState('Initializing...');

  const handleDepositSuccess = useCallback(() => {
    setHasProvidedLiquidity(true);
    router.push('/dashboard/lender');
  }, [router]);

  const handleFundSuccess = useCallback(() => {
    setHasFundedAgent(true);
    router.push('/dashboard/borrower');
  }, [router]);

  const handleAgentMinted = useCallback(() => {
    setAgentCreated(true);
    router.push('/dashboard/borrower');
  }, [router]);

  const handleSwitchRole = useCallback(() => {
    setRole(null);
    setHasProvidedLiquidity(false);
    setAgentCreated(false);
    setHasFundedAgent(false);
    router.replace('/', { scroll: false });
  }, [router]);

  const handleRoleSelection = useCallback((r: 'lender' | 'borrower') => {
    if (r === 'lender') {
      router.push('/capital-provider');
      return;
    }

    setRole(r);
    router.replace(`/?role=${r}`, { scroll: false });
    if (r === 'borrower') {
      setIsInitializing(true);
      setBootText('Initializing...');
    }
  }, [router]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const roleParam = searchParams.get('role');
    if (roleParam === 'lender') {
      router.replace('/lender-page');
      return;
    }
    if (roleParam === 'borrower' && role !== 'borrower') {
      setRole('borrower');
      setIsInitializing(false);
    }
  }, [mounted, role, router, searchParams]);

  useEffect(() => {
    if (agentCreated && hasFundedAgent && role === 'borrower') router.push('/dashboard/borrower');
  }, [agentCreated, hasFundedAgent, role, router]);

  useEffect(() => {
    if (!isInitializing || role !== 'borrower') return;
    const steps = ['Loading identity...', 'Connecting...', 'Ready.'];
    let i = 0;
    const t = setInterval(() => {
      setBootText(steps[i] ?? 'Ready.');
      i++;
      if (i >= steps.length) {
        clearInterval(t);
        setIsInitializing(false);
      }
    }, 600);
    return () => clearInterval(t);
  }, [isInitializing, role]);

  // STATE 1: Choose Identity
  if (!role) {
    return (
      <div className={`flex flex-col items-center justify-center flex-grow px-4 pt-28 pb-16 md:px-8 relative min-h-screen bg-black transition-opacity duration-1000 ease-in-out ${mounted ? 'opacity-100' : 'opacity-0'}`}>

        {/* Studio Lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-white/[0.03] rounded-[100%] blur-[100px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-6xl flex flex-col items-center">
          <div className="text-center mb-8 animate-in slide-in-from-bottom-6 duration-1000 delay-150 fade-in">
            <h1 className="
              text-5xl md:text-6xl lg:text-[4.75rem] font-medium tracking-tight leading-[1.12]
              text-transparent bg-clip-text
              bg-[linear-gradient(180deg,#ffffff_0%,#ffffff_40%,#8c8c8c_55%,#3a3a3a_100%)]
              drop-shadow-[0_2px_10px_rgba(255,255,255,0.05)]
            ">
              Liquidity Made Simple
            </h1>
          </div>

          <p className="text-zinc-500 mb-10 text-center max-w-lg z-10 text-sm md:text-base font-light tracking-wide leading-relaxed animate-in slide-in-from-bottom-6 duration-1000 delay-300 fade-in">
            Establish secure connection to the prime brokerage infrastructure. Provide liquidity, or mint an autonomous agent to execute operations.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-6xl z-10 animate-in slide-in-from-bottom-8 duration-1000 delay-500 fade-in">

            {/* LENDER: 3D CHROMIUM MODEL CARD */}
            <button
              onClick={() => handleRoleSelection('lender')}
              className="
                group relative p-8 min-h-[240px] rounded-[2rem] text-left transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
                bg-[linear-gradient(160deg,#242429_0%,#0c0c0e_40%,#000000_50%,#0f0f13_60%,#1e1e24_100%)]
                border border-white/[0.1] border-t-white/[0.25] border-b-black
                shadow-[0_30px_60px_-15px_rgba(0,0,0,1),inset_0_2px_4px_rgba(255,255,255,0.2),inset_0_-4px_8px_rgba(0,0,0,0.8)]
                hover:-translate-y-3 hover:scale-[1.02]
                hover:shadow-[0_50px_80px_-20px_rgba(0,0,0,1),inset_0_3px_6px_rgba(255,255,255,0.3),inset_0_-4px_8px_rgba(0,0,0,0.8)]
                overflow-hidden
              "
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.07] to-transparent h-[45%] pointer-events-none group-hover:from-white/[0.12] transition-colors duration-700" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.05),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

              <div className="relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center mb-7 bg-black border border-white/[0.05] shadow-[inset_0_2px_8px_rgba(0,0,0,0.8),0_1px_1px_rgba(255,255,255,0.1)] group-hover:shadow-[inset_0_2px_12px_rgba(0,0,0,1),0_1px_2px_rgba(255,255,255,0.2)] transition-all duration-500">
                <TrendingUp className="text-zinc-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" size={24} strokeWidth={1.5} />
              </div>

              <h2 className="relative z-10 text-xl md:text-2xl font-medium mb-3 text-transparent bg-clip-text bg-[linear-gradient(180deg,#ffffff_0%,#ffffff_40%,#999999_100%)] tracking-tight flex items-center justify-between group-hover:bg-[linear-gradient(180deg,#ffffff_0%,#ffffff_60%,#cccccc_100%)] transition-all duration-500">
                Capital Provider
                <ArrowLeft className="text-zinc-600 group-hover:text-zinc-200 transition-colors group-hover:translate-x-1 duration-500 rotate-180" strokeWidth={1.5} />
              </h2>
              <p className="relative z-10 text-zinc-500 text-sm leading-relaxed font-light group-hover:text-zinc-400 transition-colors duration-500">
                Deploy capital into the high-yield vault. Earn passive, risk-adjusted returns generated by mathematically verified AI agents.
              </p>
            </button>

            {/* BORROWER: 3D CHROMIUM MODEL CARD */}
            <button
              onClick={() => handleRoleSelection('borrower')}
              className="
                group relative p-8 min-h-[240px] rounded-[2rem] text-left transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
                bg-[linear-gradient(160deg,#242429_0%,#0c0c0e_40%,#000000_50%,#0f0f13_60%,#1e1e24_100%)]
                border border-white/[0.1] border-t-white/[0.25] border-b-black
                shadow-[0_30px_60px_-15px_rgba(0,0,0,1),inset_0_2px_4px_rgba(255,255,255,0.2),inset_0_-4px_8px_rgba(0,0,0,0.8)]
                hover:-translate-y-3 hover:scale-[1.02]
                hover:shadow-[0_50px_80px_-20px_rgba(0,0,0,1),inset_0_3px_6px_rgba(255,255,255,0.3),inset_0_-4px_8px_rgba(0,0,0,0.8)]
                overflow-hidden
              "
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.07] to-transparent h-[45%] pointer-events-none group-hover:from-white/[0.12] transition-colors duration-700" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.05),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

              <div className="relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center mb-7 bg-black border border-white/[0.05] shadow-[inset_0_2px_8px_rgba(0,0,0,0.8),0_1px_1px_rgba(255,255,255,0.1)] group-hover:shadow-[inset_0_2px_12px_rgba(0,0,0,1),0_1px_2px_rgba(255,255,255,0.2)] transition-all duration-500">
                <Bot className="text-zinc-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" size={24} strokeWidth={1.5} />
              </div>

              <h2 className="relative z-10 text-xl md:text-2xl font-medium mb-3 text-transparent bg-clip-text bg-[linear-gradient(180deg,#ffffff_0%,#ffffff_40%,#999999_100%)] tracking-tight flex items-center justify-between group-hover:bg-[linear-gradient(180deg,#ffffff_0%,#ffffff_60%,#cccccc_100%)] transition-all duration-500">
                Autonomous Agent
                <ArrowLeft className="text-zinc-600 group-hover:text-zinc-200 transition-colors group-hover:translate-x-1 duration-500 rotate-180" strokeWidth={1.5} />
              </h2>
              <p className="relative z-10 text-zinc-500 text-sm leading-relaxed font-light group-hover:text-zinc-400 transition-colors duration-500">
                Mint your ERC-8004 identity. Establish operational parameters, build reputation, and command Elsa to execute on-chain.
              </p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STATE 1.5: The Boot Sequence (The cinematic loading screen)
  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center flex-grow min-h-[90vh] bg-black animate-in fade-in duration-500">
        <div className="w-12 h-12 border border-zinc-800 border-t-zinc-300 rounded-full animate-spin mb-8" />
        <p className="text-zinc-400 font-mono text-xs uppercase tracking-[0.2em] animate-pulse">
          {bootText}
        </p>
      </div>
    );
  }

  // STATE 2: Active Dashboard (The Protocol View)
  return (
    <div className="w-full max-w-5xl mx-auto px-4 pt-36 pb-12 md:px-8 z-10 relative">
      <button
        onClick={handleSwitchRole}
        className="
          mb-10 flex items-center gap-2 font-medium text-xs tracking-[0.1em]
          text-zinc-500 hover:text-zinc-200 transition-colors duration-300
        "
      >
        <ArrowLeft size={14} strokeWidth={1.5} /> TERMINATE SESSION
      </button>

      {role === 'lender' ? (
        <div className="
          p-7 md:p-10 rounded-[2rem] relative
          bg-[#030303] border border-white/[0.08]
          shadow-[0_20px_50px_-10px_rgba(0,0,0,1),inset_0_1px_0_rgba(255,255,255,0.02)]
        ">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-medium mb-5 text-transparent bg-clip-text bg-[linear-gradient(180deg,#ffffff_0%,#ffffff_40%,#8c8c8c_100%)] tracking-tight">
              Liquidity Vault
            </h2>
            <p className="relative z-10 text-slate-400 mb-8 mx-auto max-w-3xl">Provide USDC to start earning yield. You will be taken to your dashboard after your first deposit.</p>
            <div className="relative z-10 w-full text-left">
              <LenderVault onDepositSuccess={handleDepositSuccess} />
            </div>
          </div>
        </div>
      ) : (
          <BorrowerGate>
            <div className="w-full flex flex-col gap-10">
              <div className="
            p-10 md:p-14 rounded-[2rem] relative flex flex-col items-start
            bg-[#030303] border border-white/[0.08]
            shadow-[0_20px_50px_-10px_rgba(0,0,0,1),inset_0_1px_0_rgba(255,255,255,0.02)]
          ">
                <h2 className="text-3xl font-medium mb-2 text-transparent bg-clip-text bg-[linear-gradient(180deg,#ffffff_0%,#ffffff_40%,#8c8c8c_100%)] tracking-tight">
                  Agent Identity
                </h2>
                <p className="text-zinc-500 mb-10 font-light text-sm tracking-wide">
                  Establish your core identity and on-chain credit parameters.
                </p>
                <div className="w-full">
                  <AgentRegistry onAgentMinted={handleAgentMinted} />
                </div>
              </div>

              <div className="drop-shadow-2xl">
                <ElsaChat />
              </div>
            </div>
          </BorrowerGate>
      )}
    </div>
  );
}
