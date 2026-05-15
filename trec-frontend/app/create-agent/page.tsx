'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { usePrivy } from '@privy-io/react-auth';
import {
  Sparkles,
  Wand2,
  Send,
  Coins,
  Shield,
  Fingerprint,
} from 'lucide-react';

const SUGGESTED_PROMPT = `You are a DeFi yield optimization agent operating within the TRECC protocol. Your objective is to maximize risk-adjusted returns while maintaining strict capital preservation.

Strategy parameters:
- Target yield: 8-15% APY
- Max drawdown tolerance: 5%
- Preferred protocols: Aave, Compound, Morpho Blue
- Rebalancing frequency: Every 4 hours
- Risk tier: Conservative

Behavioral rules:
1. Never allocate more than 30% of capital to a single protocol
2. Exit positions if protocol TVL drops below $50M
3. Prioritize stablecoin pairs for lower volatility
4. Report all trades with reasoning to the operator`;

export default function CreateAgentPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { login: openWalletModal } = usePrivy();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [mounted, setMounted] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [collateralAmount, setCollateralAmount] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [creationPhase, setCreationPhase] = useState('');
  const [templateApplied, setTemplateApplied] = useState(false);

  useEffect(() => {
    setMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimateIn(true));
    });
  }, []);

  const autoResizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 320)}px`;
  }, []);

  useEffect(() => {
    autoResizeTextarea();
  }, [prompt, autoResizeTextarea]);

  const handleApplyTemplate = () => {
    setPrompt(SUGGESTED_PROMPT);
    setTemplateApplied(true);
    setTimeout(() => setTemplateApplied(false), 2000);
  };

  const handleCreate = async () => {
    if (!prompt.trim() || !borrowAmount || !collateralAmount || !address) return;

    setIsCreating(true);
    const phases = [
      'Generating Turnkey signer...',
      'Deploying Safe smart account...',
      'Installing TRECC guardrails...',
      'Registering ERC-8004 identity...',
      'Finalizing on-chain agent...',
    ];

    for (let i = 0; i < phases.length; i++) {
      setCreationPhase(phases[i]);
      await new Promise((r) => setTimeout(r, 1400 + Math.random() * 800));
    }

    try {
      const res = await fetch('/api/create-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operator: address,
          prompt: prompt.trim(),
          borrowAmount: parseFloat(borrowAmount),
          collateralAmount: parseFloat(collateralAmount),
        }),
      });

      if (!res.ok) {
        throw new Error('Agent creation failed');
      }

      setCreationPhase('Agent deployed successfully.');
      await new Promise((r) => setTimeout(r, 1200));
      router.push('/dashboard/borrower');
    } catch {
      setCreationPhase('Creation failed — please try again.');
      setTimeout(() => {
        setIsCreating(false);
        setCreationPhase('');
      }, 2500);
    }
  };

  if (!mounted) return null;

  if (isCreating) {
    return (
      <div className="flex flex-col items-center justify-center flex-grow min-h-[85vh] relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center gap-8">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center bg-black shadow-[0_0_60px_rgba(255,255,255,0.05)]">
              <Fingerprint className="w-8 h-8 text-zinc-300 animate-pulse" strokeWidth={1} />
            </div>
            <div className="absolute inset-0 w-20 h-20 rounded-full border border-white/[0.06] animate-spin" style={{ animationDuration: '8s' }} />
            <div className="absolute -inset-3 w-[104px] h-[104px] rounded-full border border-dashed border-white/[0.04] animate-spin" style={{ animationDuration: '20s', animationDirection: 'reverse' }} />
          </div>

          <div className="text-center space-y-3">
            <p className="text-white/90 text-sm font-medium tracking-wide">{creationPhase}</p>
            <div className="flex items-center justify-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1 h-1 rounded-full bg-zinc-500 animate-pulse"
                  style={{ animationDelay: `${i * 200}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected || !address) {
    return (
      <div className={`flex flex-col items-center justify-center flex-grow min-h-[85vh] transition-opacity duration-500 ${animateIn ? 'opacity-100' : 'opacity-0'}`}>
        <div className="relative z-10 text-center space-y-8 max-w-md px-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto bg-black border border-white/[0.06] shadow-[inset_0_2px_8px_rgba(0,0,0,0.8),0_1px_1px_rgba(255,255,255,0.08)]">
            <Fingerprint className="text-zinc-400" size={28} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-xl font-medium text-zinc-100 tracking-tight">
              Connect to create your agent
            </h2>
            <p className="text-zinc-500 text-sm mt-3 leading-relaxed font-light">
              A connected wallet is required to deploy your autonomous identity.
            </p>
          </div>
          <button
            onClick={() => openWalletModal?.()}
            className="
              group relative w-full py-3.5 rounded-2xl
              font-bold uppercase text-[11px] tracking-[0.2em]
              text-zinc-800 [text-shadow:0_1px_0_rgba(255,255,255,0.9)]
              bg-[linear-gradient(180deg,#ffffff_0%,#e2e2e2_25%,#999999_45%,#d4d4d4_55%,#737373_100%)]
              border border-black/10 ring-1 ring-inset ring-white/30
              shadow-[0_15px_25px_-5px_rgba(0,0,0,0.6),inset_0_3px_5px_rgba(255,255,255,0.9),inset_0_-3px_6px_rgba(0,0,0,0.25)]
              hover:-translate-y-[1px] hover:shadow-[0_20px_35px_-5px_rgba(0,0,0,0.7),inset_0_4px_6px_rgba(255,255,255,1)]
              active:translate-y-[1px] active:scale-[0.98]
              transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]
              overflow-hidden
            "
          >
            <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/80 to-transparent skew-x-[-45deg] group-hover:left-[200%] transition-all duration-1000 ease-in-out pointer-events-none" />
            <span className="relative z-10">Connect Wallet</span>
          </button>
        </div>
      </div>
    );
  }

  const isFormValid = prompt.trim().length > 0 && borrowAmount && collateralAmount;

  return (
    <div
      className={`flex flex-col items-center justify-start flex-grow px-4 md:px-8 py-8 md:py-16 transition-all duration-500 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >

      <div className="relative w-full max-w-lg bg-zinc-950/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 md:p-8">
        <div className="relative z-10">
          {/* Page header — matching capital-provider */}
          <div className="w-full mb-10">
            <p className="text-xs font-medium tracking-widest uppercase text-zinc-500 mb-2">
              Autonomous Agent
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold text-zinc-100 tracking-tight leading-tight">
              Create Your Agent
            </h1>
            <p className="text-sm text-zinc-500 mt-2 leading-relaxed max-w-sm">
              Define the operational mandate for your ERC-8004 identity. This prompt governs how your agent deploys capital on-chain.
            </p>
          </div>

          {/* Form content */}
          <div
            className={`w-full bg-zinc-950/40 border border-zinc-800 rounded-2xl p-5 md:p-6 transition-all duration-500 delay-150 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
          >
            {/* Prompt Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-widest">
                  Agent Directive
                </label>
                <button
                  type="button"
                  onClick={handleApplyTemplate}
                  className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest
                transition-all duration-500
                ${templateApplied
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'bg-white/[0.03] text-zinc-500 border border-white/[0.06] hover:bg-white/[0.06] hover:text-zinc-300 hover:border-white/10'
                    }
              `}
                >
                  <Wand2 size={10} />
                  {templateApplied ? 'Applied' : 'Use template'}
                </button>
              </div>

              <div className="
            relative rounded-2xl overflow-hidden
            bg-[#080808] border border-zinc-800
            shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]
            focus-within:border-zinc-700
            transition-all duration-500
          ">
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your agent's strategy, risk tolerance, preferred protocols, and behavioral constraints..."
                  rows={4}
                  className="
                w-full bg-transparent text-white/90 placeholder-zinc-700 text-sm leading-relaxed font-light
                px-5 pt-5 pb-14 resize-none overflow-y-auto
                focus:outline-none
              "
                  style={{ minHeight: '140px', maxHeight: '320px' }}
                />

                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-gradient-to-t from-[#080808] via-[#080808]/95 to-transparent">
                  <span className="text-[10px] text-zinc-700 tabular-nums tracking-wide">
                    {prompt.length > 0 ? `${prompt.length} chars` : ''}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={10} className="text-zinc-600" />
                    <span className="text-[10px] text-zinc-600">AI-powered agent</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Amount Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-500 uppercase tracking-widest mb-2">
                  <Coins size={12} className="text-zinc-600" />
                  Borrow Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={borrowAmount}
                    onChange={(e) => setBorrowAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="any"
                    className="
                  w-full bg-[#080808] border border-white/[0.06] rounded-2xl
                  px-5 py-4 pr-20 text-white placeholder-zinc-700 text-sm font-light
                  focus:outline-none focus:border-white/[0.12]
                  shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]
                  transition-all duration-300
                "
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                    USDC
                  </span>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-500 uppercase tracking-widest mb-2">
                  <Shield size={12} className="text-zinc-600" />
                  Collateral Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={collateralAmount}
                    onChange={(e) => setCollateralAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="any"
                    className="
                  w-full bg-[#080808] border border-white/[0.06] rounded-2xl
                  px-5 py-4 pr-20 text-white placeholder-zinc-700 text-sm font-light
                  focus:outline-none focus:border-white/[0.12]
                  shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]
                  transition-all duration-300
                "
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                    USDC
                  </span>
                </div>
              </div>
            </div>

            {/* Collateral ratio indicator */}
            {borrowAmount && collateralAmount && parseFloat(borrowAmount) > 0 && (
              <div className="mb-6 flex items-center gap-3 px-1">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
                <span className="text-[10px] text-zinc-600 uppercase tracking-widest tabular-nums">
                  {((parseFloat(collateralAmount) / parseFloat(borrowAmount)) * 100).toFixed(0)}% collateral ratio
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
              </div>
            )}

            {/* Create Button */}
            <button
              onClick={handleCreate}
              disabled={!isFormValid}
              className="
            group relative w-full py-5 rounded-2xl
            font-bold uppercase text-[12px] tracking-[0.25em]
            overflow-hidden
            transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]
            disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:scale-100
            text-zinc-800 [text-shadow:0_1px_0_rgba(255,255,255,0.9),0_-1px_0_rgba(0,0,0,0.1)]
            bg-[linear-gradient(180deg,#ffffff_0%,#e2e2e2_25%,#999999_45%,#d4d4d4_55%,#737373_100%)]
            border border-black/10 ring-1 ring-inset ring-white/30
            shadow-[0_20px_40px_-5px_rgba(0,0,0,0.7),inset_0_3px_5px_rgba(255,255,255,0.9),inset_0_-3px_6px_rgba(0,0,0,0.25)]
            hover:-translate-y-[2px] hover:scale-[1.005]
            hover:bg-[linear-gradient(180deg,#ffffff_0%,#f5f5f5_25%,#a3a3a3_45%,#e5e5e5_55%,#808080_100%)]
            hover:shadow-[0_30px_50px_-5px_rgba(0,0,0,0.8),inset_0_4px_6px_rgba(255,255,255,1),inset_0_-3px_6px_rgba(0,0,0,0.2)]
            active:translate-y-[1px] active:scale-[0.99]
            active:bg-[linear-gradient(180deg,#e2e2e2_0%,#cccccc_25%,#808080_45%,#b3b3b3_55%,#595959_100%)]
            active:shadow-[0_5px_10px_-2px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(0,0,0,0.3),inset_0_-2px_4px_rgba(255,255,255,0.3)]
          "
            >
              <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/80 to-transparent skew-x-[-45deg] group-hover:left-[200%] transition-all duration-1000 ease-in-out pointer-events-none" />

              <span className="relative z-10 flex items-center justify-center gap-3">
                <Fingerprint size={18} strokeWidth={1.5} />
                Create Your Identity
                <Send size={14} strokeWidth={2} />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
