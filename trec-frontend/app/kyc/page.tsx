'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useDisconnect, useReadContract } from 'wagmi';
import { usePrivy } from '@privy-io/react-auth';
import { ArrowLeft, ArrowRight, AtSign, Calendar, CheckCircle, FileText, Loader2, Shield, User } from 'lucide-react';
import { submitKyc } from '../../lib/kyc';
import { AGENT_REGISTRY_ADDRESS } from '../../constants/production-addresses';
import { REGISTRY_ABI } from '../../constants/abi/registryAbi';
import EtheralBackground from '../../components/EtheralBackground';

const SEPOLIA_CHAIN_ID = 11155111;

const ID_TYPES = ['Passport', 'National ID', 'Driver\'s License'] as const;
const COUNTRIES = [
  'United States', 'United Kingdom', 'Germany', 'France', 'India',
  'Singapore', 'Japan', 'South Korea', 'Australia', 'Canada',
  'Brazil', 'Nigeria', 'UAE', 'Switzerland', 'Netherlands',
] as const;

interface KycFormData {
  fullName: string;
  email: string;
  dateOfBirth: string;
  country: string;
  idType: string;
  idNumber: string;
}

const fieldClass = 'w-full rounded-2xl border border-white/[0.08] bg-black/45 px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 transition-colors focus:border-white/[0.18] focus:outline-none focus:ring-1 focus:ring-white/[0.08]';
const labelClass = 'mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500';

function shortAddress(address?: string) {
  if (!address) return 'Not connected';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function KycPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { login: openWalletModal, logout } = usePrivy();
  const [mounted, setMounted] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [forcingFreshWallet, setForcingFreshWallet] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<KycFormData>({
    fullName: '',
    email: '',
    dateOfBirth: '',
    country: '',
    idType: '',
    idNumber: '',
  });

  const { data: agentBalance, isLoading: balanceLoading } = useReadContract({
    address: AGENT_REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: SEPOLIA_CHAIN_ID,
    query: { enabled: !!address },
  });

  useEffect(() => {
    setMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimateIn(true));
    });
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const shouldForceFreshWallet = sessionStorage.getItem('trecc:borrower:fresh-wallet') === 'true';
    if (!shouldForceFreshWallet) return;

    sessionStorage.removeItem('trecc:borrower:fresh-wallet');
    if (!isConnected) return;

    setForcingFreshWallet(true);
    disconnect();
    Promise.resolve(logout())
      .catch(() => undefined)
      .finally(() => {
        window.setTimeout(() => setForcingFreshWallet(false), 250);
      });
  }, [disconnect, isConnected, logout, mounted]);

  useEffect(() => {
    if (!balanceLoading && agentBalance && Number(agentBalance) > 0) {
      router.replace('/create-agent');
    }
  }, [agentBalance, balanceLoading, router]);

  const isComplete =
    form.fullName.trim() !== '' &&
    form.email.trim() !== '' &&
    form.dateOfBirth !== '' &&
    form.country !== '' &&
    form.idType !== '' &&
    form.idNumber.trim() !== '';

  function update(field: keyof KycFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isComplete || !address || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      // Mock successful KYC
      await new Promise((resolve) => setTimeout(resolve, 1200));
    
      localStorage.setItem(
        `trecc:zk-kyc:${address.toLowerCase()}`,
        'submitted'
      );
    
      setSubmitted(true);
    
      router.push('/create-agent');
    } catch (err) {
      setError('Unable to submit KYC.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!mounted) return null;

  if (forcingFreshWallet || (balanceLoading && isConnected)) {
    return (
      <>
        <EtheralBackground />
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center bg-black/20 px-4 py-16">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
        </div>
      </>
    );
  }

  if (!isConnected) {
    return (
      <>
        <EtheralBackground />
        <div className="relative z-10 flex min-h-screen items-center justify-center bg-black/20 px-4 pt-28 pb-10 md:px-8">
        <div className="w-full max-w-lg rounded-[2rem] border border-white/[0.08] bg-[#030303]/95 p-8 text-center shadow-[0_24px_60px_-18px_rgba(0,0,0,1),inset_0_1px_0_rgba(255,255,255,0.03)]">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-black shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
            <AtSign className="text-zinc-300" size={24} strokeWidth={1.5} />
          </div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-600">Autonomous Agent</p>
          <h1 className="mb-3 bg-[linear-gradient(180deg,#ffffff_0%,#ffffff_42%,#8c8c8c_100%)] bg-clip-text text-3xl font-medium tracking-tight text-transparent">
            Connect Wallet
          </h1>
          <p className="mx-auto mb-7 max-w-sm text-sm leading-relaxed text-zinc-500">
            Connect a borrower wallet to generate a private ZK identity proof.
          </p>
          <button
            type="button"
            onClick={() => openWalletModal?.()}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl border border-black/10 bg-[linear-gradient(180deg,#ffffff_0%,#e2e2e2_25%,#999999_45%,#d4d4d4_55%,#737373_100%)] px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-800 shadow-[0_15px_25px_-5px_rgba(0,0,0,0.6),inset_0_3px_5px_rgba(255,255,255,0.9),inset_0_-3px_6px_rgba(0,0,0,0.25)] ring-1 ring-inset ring-white/30 transition-all duration-300 hover:-translate-y-[1px]"
          >
            <span className="absolute top-0 -left-[100%] h-full w-[50%] skew-x-[-45deg] bg-gradient-to-r from-transparent via-white/80 to-transparent transition-all duration-1000 ease-in-out group-hover:left-[200%]" />
            <span className="relative z-10">Connect Wallet</span>
          </button>
        </div>
      </div>
      </>
    );
  }

  if (submitted) {
    return (
      <>
        <EtheralBackground />
        <div
          className={`relative z-10 flex min-h-screen flex-col items-center justify-center bg-black/20 px-4 pt-28 pb-10 transition-opacity duration-500 ${animateIn ? 'opacity-100' : 'opacity-0'}`}
        >
        <div className="w-full max-w-lg rounded-[2rem] border border-white/[0.08] bg-[#030303]/95 p-8 text-center shadow-[0_24px_60px_-18px_rgba(0,0,0,1)]">
          <CheckCircle className="mx-auto mb-5 h-12 w-12 text-emerald-400" />
          <h1 className="mb-2 text-2xl font-semibold text-zinc-100">
            ZK Proof Submitted
          </h1>
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-zinc-500">
            Your wallet-linked eligibility proof is under review. Raw identity
            data is not published on-chain.
          </p>
          <p className="mt-4 font-mono text-xs text-zinc-600">
            {shortAddress(address)}
          </p>
        </div>
      </div>
      </>
    );
  }

  return (
    <>
      <EtheralBackground />
    <div
      className={`relative z-10 min-h-screen bg-black/20 px-4 pt-36 pb-10 transition-all duration-500 md:px-8 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <div className="mx-auto w-full max-w-5xl">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="mb-10 flex items-center gap-2 text-xs font-medium tracking-[0.1em] text-zinc-500 transition-colors duration-300 hover:text-zinc-200"
        >
          <ArrowLeft size={14} strokeWidth={1.5} /> TERMINATE SESSION
        </button>

        <section className="rounded-[2rem] border border-white/[0.08] bg-[#030303]/95 p-7 shadow-[0_20px_50px_-10px_rgba(0,0,0,1),inset_0_1px_0_rgba(255,255,255,0.02)] md:p-10">
          <div className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-600">Zero-Knowledge KYC</p>
              <h1 className="bg-[linear-gradient(180deg,#ffffff_0%,#ffffff_42%,#8c8c8c_100%)] bg-clip-text text-3xl font-medium tracking-tight text-transparent">
                Generate Identity Proof
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-500">
                Prove borrower eligibility without exposing raw identity data to
                the protocol.
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-black/45 px-4 py-3">
              <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-600">Borrower Wallet</p>
              <p className="truncate font-mono text-sm text-zinc-300">{shortAddress(address)}</p>
            </div>
          </div>

          <div className="mb-5 grid gap-3 md:grid-cols-3">
            {[
              ['1', 'Connect borrower wallet'],
              ['2', 'Create private proof'],
              ['3', 'Unlock agent creation'],
            ].map(([step, label]) => (
              <div key={step} className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-black/30 px-4 py-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] font-mono text-[11px] text-zinc-400">
                  {step}
                </span>
                <span className="text-xs font-medium text-zinc-500">{label}</span>
              </div>
            ))}
          </div>

        <form
          onSubmit={handleSubmit}
          className={`relative w-full rounded-2xl border border-white/[0.08] bg-[linear-gradient(160deg,#151517_0%,#050505_55%,#101014_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-500 delay-150 md:p-5 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.06] bg-black/25 p-4">
              <div className="mb-5 flex items-center gap-2">
                <User size={15} className="text-zinc-500" />
                <h2 className="text-sm font-medium text-zinc-200">Private Identity Inputs</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Full Legal Name</label>
                  <input type="text" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder="As it appears on your ID" className={fieldClass} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Email</label>
                  <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" className={fieldClass} />
                </div>
                <div>
                  <label className={labelClass}>Date of Birth</label>
                  <div className="relative">
                    <input type="date" value={form.dateOfBirth} onChange={(e) => update('dateOfBirth', e.target.value)} className={`${fieldClass} pr-10 [color-scheme:dark]`} />
                    <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Country</label>
                  <select value={form.country} onChange={(e) => update('country', e.target.value)} className={`${fieldClass} cursor-pointer appearance-none`}>
                    <option value="" disabled className="bg-zinc-900 text-zinc-500">Select country</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c} className="bg-zinc-900 text-zinc-200">{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-black/25 p-4">
              <div className="mb-5 flex items-center gap-2">
                <FileText size={15} className="text-zinc-500" />
                <h2 className="text-sm font-medium text-zinc-200">Proof Parameters</h2>
              </div>
              <div className="grid gap-4">
                <div>
                  <label className={labelClass}>ID Type</label>
                  <select value={form.idType} onChange={(e) => update('idType', e.target.value)} className={`${fieldClass} cursor-pointer appearance-none`}>
                    <option value="" disabled className="bg-zinc-900 text-zinc-500">Select document</option>
                    {ID_TYPES.map((t) => (
                      <option key={t} value={t} className="bg-zinc-900 text-zinc-200">{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>ID Number</label>
                  <input type="text" value={form.idNumber} onChange={(e) => update('idNumber', e.target.value)} placeholder="Document number" className={fieldClass} />
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-black/35 px-4 py-3">
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Shield size={14} />
                    <span>ZK eligibility proof</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-600">
                    Only proof status and wallet binding move forward. Document
                    details remain off-chain.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="relative z-10 mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!isComplete || submitting}
            className="
              relative z-10 mt-5 flex w-full items-center justify-center gap-2 rounded-2xl
              border border-white/10 bg-zinc-100 px-6 py-3.5 text-sm font-semibold tracking-normal text-zinc-950
              shadow-[0_14px_30px_-18px_rgba(255,255,255,0.5)]
              transition-all duration-200 hover:bg-white active:scale-[0.99]
              disabled:cursor-not-allowed disabled:border-white/[0.06] disabled:bg-zinc-800/70 disabled:text-zinc-500 disabled:shadow-none
            "
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Generating proof…</span>
              </>
            ) : (
              <>
                <span>Generate ZK Proof</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
        </section>
      </div>
    </div>
    </>
  );
}
