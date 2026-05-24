'use client';

import Image from 'next/image';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { usePrivy } from '@privy-io/react-auth';
import {
  ArrowRight,
  Fingerprint,
} from 'lucide-react';
import { setAgentDashboardAccess } from '../../lib/agent-dashboard-storage';

const COLLATERAL_BASE_FEE_USD = 110;
const COLLATERAL_THRESHOLD_USD = 1500;
const COLLATERAL_MARGINAL_TAX = 0.135;

const APPROVED_PROTOCOLS = [
  { id: 'aave-v3', label: 'Aave v3', logo: '/aave.png' },
  { id: 'compound-v3', label: 'Compound v3', logo: '/compound.png' },
  { id: 'morpho-blue', label: 'Morpho Blue', logo: '/morphos.png' },
];

const RISK_PROFILES = ['Conservative', 'Balanced', 'Aggressive'];

const SUGGESTED_PROMPT = `Maximize risk-adjusted USDC yield inside TRECC guardrails.

Strategy:
- Prefer stablecoin lending markets with deep liquidity.
- Split exposure across approved protocols when rates are comparable.
- Rebalance only when APY improvement justifies gas and execution risk.
- Preserve capital first; avoid abnormal utilization or unstable liquidity.
- Explain each allocation and exit decision before execution.`;

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function calculateRequiredCollateralUsd(limitUsd: number) {
  if (!Number.isFinite(limitUsd) || limitUsd <= 0) return 0;
  if (limitUsd <= COLLATERAL_THRESHOLD_USD) return COLLATERAL_BASE_FEE_USD;
  return COLLATERAL_BASE_FEE_USD + (limitUsd - COLLATERAL_THRESHOLD_USD) * COLLATERAL_MARGINAL_TAX;
}

export default function CreateAgentPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { login: openWalletModal } = usePrivy();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [mounted, setMounted] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [borrowLimit, setBorrowLimit] = useState('');
  const [loanDurationDays, setLoanDurationDays] = useState('30');
  const [riskProfile, setRiskProfile] = useState('Balanced');
  const [targetProtocols, setTargetProtocols] = useState<string[]>(['aave-v3', 'morpho-blue']);
  const [stopLossPercentage, setStopLossPercentage] = useState('5');
  const [userPrompt, setUserPrompt] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [creationPhase, setCreationPhase] = useState('');
  const [templateApplied, setTemplateApplied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const borrowLimitValue = Number.parseFloat(borrowLimit);
  const durationValue = Number.parseInt(loanDurationDays, 10);
  const stopLossValue = Number.parseFloat(stopLossPercentage);
  const requiredCollateral = useMemo(() => calculateRequiredCollateralUsd(borrowLimitValue), [borrowLimitValue]);
  const portfolioFloor = Math.max(0, borrowLimitValue - requiredCollateral);

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
    el.style.height = `${Math.min(el.scrollHeight, 230)}px`;
  }, []);

  useEffect(() => {
    autoResizeTextarea();
  }, [userPrompt, autoResizeTextarea]);

  const handleApplyTemplate = () => {
    setUserPrompt(SUGGESTED_PROMPT);
    setTemplateApplied(true);
    setTimeout(() => setTemplateApplied(false), 1800);
  };

  const toggleProtocol = (protocolId: string) => {
    setTargetProtocols((current) => {
      if (current.includes(protocolId)) {
        return current.filter((id) => id !== protocolId);
      }
      return [...current, protocolId];
    });
  };

  const isFormValid =
    Boolean(address) &&
    agentName.trim().length >= 2 &&
    userPrompt.trim().length >= 20 &&
    Number.isFinite(borrowLimitValue) &&
    borrowLimitValue > 0 &&
    Number.isFinite(durationValue) &&
    durationValue > 0 &&
    Number.isFinite(stopLossValue) &&
    stopLossValue > 0 &&
    stopLossValue <= 100 &&
    targetProtocols.length > 0;

  const handleCreate = async () => {
    if (!isFormValid || !address) return;

    setErrorMessage('');
    setIsCreating(true);
    const phases = [
      'Preparing agent configuration...',
      'Calculating RiskEngine collateral...',
      'Deploying Safe smart account...',
      'Installing TRECC guardrails...',
      'Registering ERC-8004 identity...',
      'Provisioning Letta agent memory...',
    ];

    try {
      for (const phase of phases) {
        setCreationPhase(phase);
        await new Promise((resolve) => setTimeout(resolve, 650));
      }

      const payload = {
        borrower_id: address,
        agent_name: agentName.trim(),
        base_asset: 'USDC',
        borrowed_amount_usd: borrowLimitValue,
        collateral_amount_usd: requiredCollateral,
        loan_duration_days: durationValue,
        risk_profile: riskProfile,
        target_protocols: targetProtocols,
        stop_loss_percentage: stopLossValue,
        user_prompt: userPrompt.trim(),
      };

      const res = await fetch('/api/create-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(result?.details || result?.error || 'Agent creation failed');
      }

      setCreationPhase('Agent deployed successfully.');
      setAgentDashboardAccess(address);
      await new Promise((resolve) => setTimeout(resolve, 900));
      router.push('/dashboard/borrower');
    } catch (error) {
      setCreationPhase('');
      setErrorMessage(error instanceof Error ? error.message : 'Agent creation failed. Please try again.');
      setIsCreating(false);
    }
  };

  if (!mounted) return null;

  if (isCreating) {
    return (
      <div className="flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-4">
        <div className="relative z-10 flex flex-col items-center gap-8">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-black shadow-[0_0_60px_rgba(255,255,255,0.05)]">
              <Fingerprint className="h-8 w-8 animate-pulse text-zinc-300" strokeWidth={1} />
            </div>
            <div className="absolute inset-0 h-20 w-20 animate-spin rounded-full border border-white/[0.06]" style={{ animationDuration: '8s' }} />
            <div className="absolute -inset-3 h-[104px] w-[104px] animate-spin rounded-full border border-dashed border-white/[0.04]" style={{ animationDuration: '20s', animationDirection: 'reverse' }} />
          </div>

          <div className="space-y-3 text-center">
            <p className="text-sm font-medium tracking-wide text-white/90">{creationPhase}</p>
            <div className="flex items-center justify-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-1 w-1 animate-pulse rounded-full bg-zinc-500"
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
      <div className={`flex min-h-[85vh] flex-grow flex-col items-center justify-center transition-opacity duration-500 ${animateIn ? 'opacity-100' : 'opacity-0'}`}>
        <div className="relative z-10 max-w-md space-y-8 px-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.08] bg-black shadow-[inset_0_2px_8px_rgba(0,0,0,0.8),0_1px_1px_rgba(255,255,255,0.08)]">
            <Fingerprint className="text-zinc-300" size={28} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-xl font-medium tracking-tight text-zinc-100">Connect to create your agent</h2>
            <p className="mt-3 text-sm font-light leading-relaxed text-zinc-500">
              A fresh connected wallet is required before deploying your autonomous identity.
            </p>
          </div>
          <button
            onClick={() => openWalletModal?.()}
            className="group relative w-full overflow-hidden rounded-2xl border border-black/10 bg-white py-4 text-sm font-semibold text-black shadow-[0_18px_36px_-16px_rgba(255,255,255,0.45)] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-px"
          >
            <span className="relative z-10">Connect Wallet</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen flex-grow flex-col items-center justify-start bg-[#050505] px-4 pb-8 pt-32 transition-all duration-500 md:px-8 ${animateIn ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
      <section className="relative w-full max-w-5xl overflow-hidden rounded-[22px] border border-white/[0.08] bg-[linear-gradient(180deg,#17181c_0%,#09090b_42%,#050505_100%)] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.62),inset_0_1px_0_rgba(255,255,255,0.1)]">
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        <div className="mb-5 flex flex-col gap-4 border-b border-white/[0.06] pb-5 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Create autonomous agent</h1>
            <p className="mt-1 text-xs text-zinc-500">Configure capital, risk, protocols, and strategy.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-full border border-white/[0.08] bg-black/35 px-3 py-2">
              <span className="mr-2 text-xs text-zinc-600">Wallet</span>
              <span className="font-mono text-xs text-zinc-300">{address.slice(0, 6)}...{address.slice(-4)}</span>
            </div>
            <div className="rounded-full border border-white/[0.08] bg-black/35 px-3 py-2">
              <span className="mr-2 text-xs text-zinc-600">Collateral</span>
              <span className="text-xs font-semibold text-zinc-100">{formatMoney(requiredCollateral)}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-4">
            <div className="rounded-[18px] border border-white/[0.07] bg-black/35 p-4">
              <SectionTitle title="Basic setup" />
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Field label="Agent name">
                  <input
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="e.g. Elsa Prime"
                    className="agent-input"
                  />
                </Field>

                <Field label="Borrow limit">
                  <div className="relative">
                    <input
                      type="number"
                      value={borrowLimit}
                      onChange={(e) => setBorrowLimit(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="any"
                      className="agent-input pr-20"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5 text-[11px] font-semibold text-zinc-300">
                      <UsdcIcon className="h-4 w-4" />
                      USDC
                    </span>
                  </div>
                </Field>

                <Field label="Loan duration">
                  <div className="relative">
                    <input
                      type="number"
                      value={loanDurationDays}
                      onChange={(e) => setLoanDurationDays(e.target.value)}
                      min="1"
                      step="1"
                      className="agent-input pr-20"
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-500">days</span>
                  </div>
                </Field>

                <Field label="Stop loss">
                  <div className="relative">
                    <input
                      type="number"
                      value={stopLossPercentage}
                      onChange={(e) => setStopLossPercentage(e.target.value)}
                      min="0.1"
                      max="100"
                      step="0.1"
                      className="agent-input pr-14"
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-500">%</span>
                  </div>
                </Field>
              </div>
            </div>

            <div className="rounded-[18px] border border-white/[0.07] bg-black/35 p-4">
              <SectionTitle title="Risk profile" />
              <div className="mt-4 grid grid-cols-3 gap-2.5">
                {RISK_PROFILES.map((profile) => (
                  <button
                    key={profile}
                    type="button"
                    onClick={() => setRiskProfile(profile)}
                    className={`h-10 rounded-xl border text-xs font-semibold transition-all duration-200 ${riskProfile === profile
                      ? 'border-white bg-white text-black shadow-[0_16px_34px_rgba(255,255,255,0.12)]'
                      : 'border-white/[0.08] bg-black/50 text-zinc-500 hover:border-white/[0.18] hover:text-zinc-200'
                    }`}
                  >
                    {profile}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[18px] border border-white/[0.07] bg-black/35 p-4">
              <SectionTitle title="Target protocols" />
              <div className="mt-4 grid gap-2.5 md:grid-cols-3">
                {APPROVED_PROTOCOLS.map((protocol) => {
                  const selected = targetProtocols.includes(protocol.id);
                  return (
                    <button
                      key={protocol.id}
                      type="button"
                      onClick={() => toggleProtocol(protocol.id)}
                      className={`flex min-h-14 items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 ${selected
                        ? 'border-white/70 bg-white text-black'
                        : 'border-white/[0.08] bg-black/50 text-zinc-400 hover:border-white/[0.18] hover:text-zinc-100'
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Image src={protocol.logo} alt={protocol.label} width={22} height={22} className="h-5 w-5 object-contain" />
                        <span className="truncate text-xs font-semibold">{protocol.label}</span>
                      </span>
                      <span className={`h-2 w-2 shrink-0 rounded-full ${selected ? 'bg-black/45' : 'bg-zinc-800'}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-[18px] border border-white/[0.07] bg-black/35 p-4">
            <SectionTitle title="Agent directive" />
            <div>
              <div className="mb-2.5 flex items-center justify-between gap-3">
                <span className="text-xs text-zinc-500">Strategy prompt</span>
                <button
                  type="button"
                  onClick={handleApplyTemplate}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-300 ${templateApplied
                    ? 'border-white/20 bg-white/10 text-white'
                    : 'border-white/[0.08] bg-white/[0.04] text-zinc-500 hover:bg-white/[0.07] hover:text-zinc-300'
                  }`}
                >
                  {templateApplied ? 'Applied' : 'Template'}
                </button>
              </div>
              <textarea
                ref={textareaRef}
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="Describe strategy, risk limits, allocation behavior, rebalancing rules, and protocol preferences..."
                rows={8}
                className="min-h-[150px] w-full resize-none rounded-2xl border border-white/[0.08] bg-[#030303] px-4 py-3.5 text-sm font-light leading-relaxed text-white/90 placeholder-zinc-700 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] focus:border-white/[0.16] focus:outline-none"
                style={{ maxHeight: '190px' }}
              />
              <div className="mt-2.5 flex items-center justify-between px-1 text-[10px] text-zinc-600">
                <span>{userPrompt ? `${userPrompt.length} chars` : 'Minimum 20 chars'}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-[#050505]/80 p-3">
              <p className="mb-2.5 text-sm font-medium text-zinc-400">Deployment preview</p>
              <div className="grid grid-cols-2 gap-2">
                <SummaryItem label="Borrow limit" value={formatMoney(borrowLimitValue)} />
                <SummaryItem label="Collateral due" value={formatMoney(requiredCollateral)} />
                <SummaryItem label="Portfolio floor" value={formatMoney(portfolioFloor)} />
                <SummaryItem label="Stop loss" value={`${Number.isFinite(stopLossValue) ? stopLossValue : 0}%`} />
              </div>
              <p className="mt-2.5 text-[10px] leading-relaxed text-zinc-600">
                Collateral follows the deployed contract formula: $110 up to $1,500, then 13.5% on the amount above $1,500.
              </p>
            </div>

            {errorMessage && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {errorMessage}
              </div>
            )}

            <button
              onClick={handleCreate}
              disabled={!isFormValid}
              className="group relative w-full overflow-hidden rounded-2xl border border-emerald-300/25 bg-[linear-gradient(180deg,#23d66c_0%,#15a652_55%,#0d7f3e_100%)] py-3.5 text-sm font-semibold text-white shadow-[0_16px_30px_-18px_rgba(34,197,94,0.9),inset_0_1px_0_rgba(255,255,255,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                Create agent
                <ArrowRight size={20} strokeWidth={2} />
              </span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div>
      <h2 className="text-sm font-medium text-zinc-300">{title}</h2>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs text-zinc-500">{label}</label>
      {children}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#050505] p-3">
      <p className="text-xs text-zinc-600">{label}</p>
      <p className="mt-1.5 text-sm font-semibold text-zinc-100">{value}</p>
    </div>
  );
}

function UsdcIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="#2775CA" />
      <circle cx="32" cy="32" r="23" fill="none" stroke="white" strokeWidth="4" />
      <path d="M32 15v34" stroke="white" strokeWidth="4" strokeLinecap="round" />
      <path
        d="M39.5 24.5c-1.4-2.6-4.1-3.9-7.2-3.9-4.4 0-7.6 2.3-7.6 6 0 4 3.4 5.2 7.5 6.1 3.2.7 5 1.4 5 3.6 0 2.1-1.9 3.4-4.9 3.4-3.2 0-5.5-1.4-6.8-3.9"
        fill="none"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
