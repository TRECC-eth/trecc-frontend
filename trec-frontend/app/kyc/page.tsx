'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useReadContract } from 'wagmi';
import { Shield, ChevronRight, CheckCircle, Loader2 } from 'lucide-react';
import { submitKyc } from '../../lib/kyc';
import { AGENT_REGISTRY_ADDRESS } from '../../constants/production-addresses';
import { REGISTRY_ABI } from '../../constants/abi/registryAbi';

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

export default function KycPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
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
      await submitKyc({
        wallet_address: address,
        full_name: form.fullName,
        email: form.email,
        date_of_birth: form.dateOfBirth,
        country: form.country,
        id_type: form.idType,
        id_number: form.idNumber,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!mounted) return null;

  if (balanceLoading && isConnected) {
    return (
      <div className="flex flex-col items-center justify-center flex-grow px-4 py-16">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center flex-grow px-4 py-16">
        <div className="w-full max-w-lg text-center">
          <Shield className="w-10 h-10 text-zinc-600 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-zinc-200 mb-2">
            Connect Wallet
          </h1>
          <p className="text-sm text-zinc-500">
            Please connect your wallet to begin identity verification.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div
        className={`flex flex-col items-center justify-center flex-grow px-4 py-16 transition-opacity duration-500 ${animateIn ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="w-full max-w-lg text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-5" />
          <h1 className="text-2xl font-semibold text-zinc-100 mb-2">
            Verification Submitted
          </h1>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-sm mx-auto">
            Your identity verification is under review. You&apos;ll be notified
            once approved.
          </p>
          <p className="text-xs text-zinc-600 mt-4 font-mono">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-start flex-grow px-4 md:px-8 py-8 md:py-16 transition-all duration-500 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <div className="w-full max-w-lg bg-zinc-950/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 md:p-8">
        {/* Header */}
        <div className="w-full mb-10">
          <p className="text-xs font-medium tracking-widest uppercase text-zinc-500 mb-2">
            Identity Verification
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold text-zinc-100 tracking-tight leading-tight">
            Complete KYC
          </h1>
          <p className="text-sm text-zinc-500 mt-2 leading-relaxed max-w-sm">
            Verify your identity to access borrowing. Your data is encrypted and
            never stored on-chain.
          </p>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className={`relative w-full transition-all duration-500 delay-150 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
        >
          <div className="relative z-10 space-y-5">
          {/* Wallet */}
          <div>
            <label className="block text-[11px] font-medium tracking-widest uppercase text-zinc-500 mb-1.5">
              Wallet
            </label>
            <div className="px-4 py-3 rounded-xl bg-zinc-800/60 border border-white/[0.04] text-sm font-mono text-zinc-400">
              {address}
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-[11px] font-medium tracking-widest uppercase text-zinc-500 mb-1.5">
              Full Legal Name
            </label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => update('fullName', e.target.value)}
              placeholder="As it appears on your ID"
              className="w-full px-4 py-3 rounded-xl bg-zinc-800/60 border border-white/[0.06] text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-white/[0.15] focus:ring-1 focus:ring-white/[0.08] transition-colors"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-[11px] font-medium tracking-widest uppercase text-zinc-500 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl bg-zinc-800/60 border border-white/[0.06] text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-white/[0.15] focus:ring-1 focus:ring-white/[0.08] transition-colors"
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-[11px] font-medium tracking-widest uppercase text-zinc-500 mb-1.5">
              Date of Birth
            </label>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => update('dateOfBirth', e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-800/60 border border-white/[0.06] text-sm text-zinc-200 focus:outline-none focus:border-white/[0.15] focus:ring-1 focus:ring-white/[0.08] transition-colors [color-scheme:dark]"
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-[11px] font-medium tracking-widest uppercase text-zinc-500 mb-1.5">
              Country of Residence
            </label>
            <select
              value={form.country}
              onChange={(e) => update('country', e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-800/60 border border-white/[0.06] text-sm text-zinc-200 focus:outline-none focus:border-white/[0.15] focus:ring-1 focus:ring-white/[0.08] transition-colors appearance-none cursor-pointer"
            >
              <option value="" disabled className="bg-zinc-900 text-zinc-500">
                Select country
              </option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c} className="bg-zinc-900 text-zinc-200">
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* ID Type & Number — side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium tracking-widest uppercase text-zinc-500 mb-1.5">
                ID Type
              </label>
              <select
                value={form.idType}
                onChange={(e) => update('idType', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-zinc-800/60 border border-white/[0.06] text-sm text-zinc-200 focus:outline-none focus:border-white/[0.15] focus:ring-1 focus:ring-white/[0.08] transition-colors appearance-none cursor-pointer"
              >
                <option value="" disabled className="bg-zinc-900 text-zinc-500">
                  Select
                </option>
                {ID_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-zinc-900 text-zinc-200">
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium tracking-widest uppercase text-zinc-500 mb-1.5">
                ID Number
              </label>
              <input
                type="text"
                value={form.idNumber}
                onChange={(e) => update('idNumber', e.target.value)}
                placeholder="Document number"
                className="w-full px-4 py-3 rounded-xl bg-zinc-800/60 border border-white/[0.06] text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-white/[0.15] focus:ring-1 focus:ring-white/[0.08] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="relative z-10 mt-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isComplete || submitting}
          className={`
            group relative z-10 w-full mt-5 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl
            font-bold uppercase text-[11px] tracking-[0.2em]
            transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]
            overflow-hidden
            ${
              isComplete && !submitting
                ? 'text-zinc-800 [text-shadow:0_1px_0_rgba(255,255,255,0.9)] bg-[linear-gradient(180deg,#ffffff_0%,#e2e2e2_25%,#999999_45%,#d4d4d4_55%,#737373_100%)] border border-black/10 ring-1 ring-inset ring-white/30 shadow-[0_15px_25px_-5px_rgba(0,0,0,0.6),inset_0_3px_5px_rgba(255,255,255,0.9),inset_0_-3px_6px_rgba(0,0,0,0.25)] hover:-translate-y-[1px] hover:shadow-[0_20px_35px_-5px_rgba(0,0,0,0.7),inset_0_4px_6px_rgba(255,255,255,1),inset_0_-3px_6px_rgba(0,0,0,0.2)] active:translate-y-[1px] active:scale-[0.98]'
                : 'text-zinc-600 bg-zinc-800/60 border border-white/[0.04] cursor-not-allowed'
            }
          `}
        >
          {isComplete && !submitting && (
            <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/80 to-transparent skew-x-[-45deg] group-hover:left-[200%] transition-all duration-1000 ease-in-out pointer-events-none" />
          )}
          {submitting ? (
            <>
              <Loader2 size={14} className="relative z-10 animate-spin" />
              <span className="relative z-10">Submitting…</span>
            </>
          ) : (
            <>
              <span className="relative z-10">Submit Verification</span>
              <ChevronRight size={14} className="relative z-10" />
            </>
          )}
        </button>
      </form>
      </div>
    </div>
  );
}
