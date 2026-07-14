'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { usePrivy } from '@privy-io/react-auth';
import { AtSign, ShieldCheck, Loader2, User, FileText, ArrowRight, Calendar } from 'lucide-react';
import { submitKyc, getKycStatus } from '../lib/kyc';

interface BorrowerGateProps {
  children: React.ReactNode;
}

export default function BorrowerGate({ children }: BorrowerGateProps) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { login: openWalletModal } = usePrivy();
  const [kycVerified, setKycVerified] = useState(false);
  const [kycLoading, setKycLoading] = useState(true);
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [country, setCountry] = useState('');
  const [docType, setDocType] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [email, setEmail] = useState('');

  // 🟢 Toggle this to TRUE for the demo video. 
  // It completely bypasses the gate and renders the dashboard immediately.
  const DEMO_MODE = true; 

  useEffect(() => {
    if (!address) {
      setKycLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const status = await getKycStatus(address);
        if (!cancelled) {
          setKycVerified(status === 'approved' || status === 'pending');
        }
      } catch {
        // fall through — treat as not verified
      } finally {
        if (!cancelled) setKycLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [address]);

  const handleKycSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!address) return;
      setKycSubmitting(true);
      setError(null);
      try {
        await submitKyc({
          wallet_address: address,
          full_name: fullName,
          email,
          date_of_birth: dob,
          country,
          id_type: docType,
          id_number: docNumber,
        });
        setKycVerified(true);
        router.push('/?role=borrower');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
      } finally {
        setKycSubmitting(false);
      }
    },
    [address, fullName, email, dob, country, docType, docNumber, router]
  );

  // If DEMO_MODE is true, skip straight to rendering {children}
  if (!DEMO_MODE && (!isConnected || !address)) {
    return (
      <div className="w-full max-w-md mx-auto py-16 px-4 text-center">
        <div
          className="relative p-10 rounded-[2.5rem] overflow-hidden
            bg-[linear-gradient(160deg,#242429_0%,#0c0c0e_40%,#000000_50%,#0f0f13_60%,#1e1e24_100%)]
            border border-white/[0.1] border-t-white/[0.25] border-b-black
            shadow-[0_30px_60px_-15px_rgba(0,0,0,1),inset_0_2px_4px_rgba(255,255,255,0.2),inset_0_-4px_8px_rgba(0,0,0,0.8)]
          "
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.07] to-transparent h-[45%] pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto bg-black border border-white/[0.05] shadow-[inset_0_2px_8px_rgba(0,0,0,0.8),0_1px_1px_rgba(255,255,255,0.1)]">
              <AtSign className="text-zinc-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" size={24} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-xl font-medium text-transparent bg-clip-text bg-[linear-gradient(180deg,#ffffff_0%,#ffffff_40%,#999999_100%)] tracking-tight">
                Connect your wallet
              </h2>
              <p className="text-zinc-500 text-sm mt-2 leading-relaxed font-light">
                Connect a wallet to set your TRECC subname, complete KYC, and use the app.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openWalletModal?.()}
              className="
                group relative w-full py-3.5 rounded-2xl
                font-bold uppercase text-[11px] tracking-[0.2em]
                text-zinc-800 [text-shadow:0_1px_0_rgba(255,255,255,0.9)]
                bg-[linear-gradient(180deg,#ffffff_0%,#e2e2e2_25%,#999999_45%,#d4d4d4_55%,#737373_100%)]
                border border-black/10 ring-1 ring-inset ring-white/30
                shadow-[0_15px_25px_-5px_rgba(0,0,0,0.6),inset_0_3px_5px_rgba(255,255,255,0.9),inset_0_-3px_6px_rgba(0,0,0,0.25)]
                hover:-translate-y-[1px] hover:shadow-[0_20px_35px_-5px_rgba(0,0,0,0.7),inset_0_4px_6px_rgba(255,255,255,1),inset_0_-3px_6px_rgba(0,0,0,0.2)]
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
      </div>
    );
  }

  if (!DEMO_MODE && kycLoading) {
    return (
      <div className="w-full max-w-md mx-auto py-16 px-4 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!DEMO_MODE && !kycVerified) {
    return (
      <div className="w-full max-w-xl mx-auto py-12 px-4">
        <div
          className="relative p-10 rounded-[2.5rem] overflow-hidden
            bg-[linear-gradient(160deg,#242429_0%,#0c0c0e_40%,#000000_50%,#0f0f13_60%,#1e1e24_100%)]
            border border-white/[0.1] border-t-white/[0.25] border-b-black
            shadow-[0_30px_60px_-15px_rgba(0,0,0,1),inset_0_2px_4px_rgba(255,255,255,0.2),inset_0_-4px_8px_rgba(0,0,0,0.8)]
          "
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.07] to-transparent h-[45%] pointer-events-none" />

          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-3 text-zinc-500 text-sm font-medium tracking-wide">
              <span className="w-8 h-8 rounded-full bg-zinc-800 border border-white/[0.08] flex items-center justify-center font-bold text-zinc-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
                2
              </span>
              <span>KYC</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-black border border-white/[0.05] shadow-[inset_0_2px_8px_rgba(0,0,0,0.8),0_1px_1px_rgba(255,255,255,0.1)]">
                <ShieldCheck className="text-zinc-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" size={28} strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-2xl font-medium mb-1 text-transparent bg-clip-text bg-[linear-gradient(180deg,#ffffff_0%,#ffffff_40%,#999999_100%)] tracking-tight">
                  Complete identity verification
                </h2>
                <p className="text-zinc-500 text-sm leading-relaxed font-light">
                  Required to access borrowing and agent features.
                </p>
              </div>
            </div>

            <form onSubmit={handleKycSubmit} className="space-y-6">
              <div>
                <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <User size={12} className="text-zinc-500" /> Personal information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="kyc-fullName" className="block text-xs text-zinc-500 mb-1.5 font-light">Full legal name</label>
                    <input
                      id="kyc-fullName"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      className="w-full px-4 py-3 rounded-2xl bg-black/50 border border-white/[0.08] text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="kyc-dob" className="block text-xs text-zinc-500 mb-1.5 font-light">Date of birth</label>
                    <div className="relative">
                      <input
                        id="kyc-dob"
                        type="date"
                        required
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full px-4 py-3 pr-10 rounded-2xl bg-black/50 border border-white/[0.08] text-white focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-colors [color-scheme:dark]"
                      />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="kyc-email" className="block text-xs text-zinc-500 mb-1.5 font-light">Email</label>
                    <input
                      id="kyc-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 rounded-2xl bg-black/50 border border-white/[0.08] text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="kyc-country" className="block text-xs text-zinc-500 mb-1.5 font-light">Country of residence</label>
                    <input
                      id="kyc-country"
                      type="text"
                      required
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g. United States"
                      className="w-full px-4 py-3 rounded-2xl bg-black/50 border border-white/[0.08] text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <FileText size={12} className="text-zinc-500" /> Identity document
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="kyc-docType" className="block text-xs text-zinc-500 mb-1.5 font-light">Document type</label>
                    <select
                      id="kyc-docType"
                      required
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 rounded-2xl bg-black/50 border border-white/[0.08] text-white focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-colors appearance-none cursor-pointer [color-scheme:dark]"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23717171'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem' }}
                    >
                      <option value="">Select</option>
                      <option value="passport">Passport</option>
                      <option value="national_id">National ID</option>
                      <option value="drivers_license">Driver&apos;s license</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="kyc-docNumber" className="block text-xs text-zinc-500 mb-1.5 font-light">Document number</label>
                    <input
                      id="kyc-docNumber"
                      type="text"
                      required
                      value={docNumber}
                      onChange={(e) => setDocNumber(e.target.value)}
                      placeholder="Last 4 digits visible"
                      className="w-full px-4 py-3 rounded-2xl bg-black/50 border border-white/[0.08] text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={kycSubmitting}
                className="w-full py-3.5 rounded-2xl font-semibold text-white transition-all flex items-center justify-center gap-2
                  bg-[linear-gradient(180deg,#22c55e_0%,#16a34a_50%,#15803d_100%)]
                  border border-emerald-400/30 shadow-[0_4px_14px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15)]
                  hover:opacity-95 disabled:opacity-70
                "
              >
                {kycSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    Complete KYC <ArrowRight size={18} strokeWidth={1.5} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Will render immediately when DEMO_MODE is true
  return <>{children}</>;
}