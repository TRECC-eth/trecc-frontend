'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useSendTransaction, useChainId, useSwitchChain } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { parseEther } from 'viem';
import { baseSepolia } from 'viem/chains';
import { AtSign, ShieldCheck, Loader2, User, FileText, ArrowRight, CheckCircle2, Calendar, DollarSign, Lock, AlertCircle } from 'lucide-react';
import { getStoredTreccUsername } from '../lib/ens-storage';
import { isKycVerified, setStoredKycStatus } from '../lib/kyc-storage';
import { TRECC_ENS_PARENT } from '../constants/ens';
import { KYC_COLLATERAL_RECEIVER } from '../constants/addresses';
import SetUsernameModal from './SetUsernameModal';

const BASE_SEPOLIA_CHAIN_ID = baseSepolia.id;
/** Collateral is sent to this address on Base Sepolia. */
const COLLATERAL_RECEIVER = KYC_COLLATERAL_RECEIVER as `0x${string}`;
const COLLATERAL_ETH = process.env.NEXT_PUBLIC_KYC_COLLATERAL_ETH || '0.01';

interface BorrowerGateProps {
  children: React.ReactNode;
}

export default function BorrowerGate({ children }: BorrowerGateProps) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { sendTransactionAsync, data: txHash } = useSendTransaction();
  const { open: openWalletModal } = useAppKit();
  const [showSubnameModal, setShowSubnameModal] = useState(false);
  const [completedSubnameLabel, setCompletedSubnameLabel] = useState<string | null>(null);
  const [kycVerified, setKycVerified] = useState(false);
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [collateralPaid, setCollateralPaid] = useState(false);
  const [collateralPaying, setCollateralPaying] = useState(false);
  const [collateralError, setCollateralError] = useState<string | null>(null);

  const COLLATERAL_USD = 110;
  const isBaseSepolia = chainId === BASE_SEPOLIA_CHAIN_ID;

  const treccLabel = typeof window !== 'undefined' ? getStoredTreccUsername(address ?? undefined) : null;
  const kycDone = typeof window !== 'undefined' && isKycVerified(address ?? undefined);

  useEffect(() => {
    setKycVerified(kycDone);
  }, [kycDone]);

  const hasSubname = !!(treccLabel || completedSubnameLabel);
  const needsSubname = isConnected && !!address && !hasSubname;
  const needsKyc = isConnected && !!address && hasSubname && !kycVerified;

  useEffect(() => {
    if (needsSubname) setShowSubnameModal(true);
  }, [needsSubname]);

  const handleSubnameSuccess = useCallback((label?: string) => {
    if (label) setCompletedSubnameLabel(label);
    setShowSubnameModal(false);
  }, []);

  const handlePayCollateral = useCallback(async () => {
    if (!address) return;
    setCollateralError(null);
    setCollateralPaying(true);
    try {
      if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
        await switchChainAsync?.({ chainId: BASE_SEPOLIA_CHAIN_ID });
      }
      await sendTransactionAsync({
        to: COLLATERAL_RECEIVER,
        value: parseEther(COLLATERAL_ETH),
        chainId: BASE_SEPOLIA_CHAIN_ID,
        gas: BigInt(150000),
      });
    } catch {
      // Mock: ignore reject/failure; we still show collateral as paid below
    } finally {
      setCollateralPaid(true);
      setCollateralPaying(false);
      setCollateralError(null);
    }
  }, [address, chainId, switchChainAsync, sendTransactionAsync]);

  const handleKycSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!address || !collateralPaid) return;
      setKycSubmitting(true);
      setCollateralError(null);
      try {
        if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
          await switchChainAsync?.({ chainId: BASE_SEPOLIA_CHAIN_ID });
        }
        await sendTransactionAsync({
          to: COLLATERAL_RECEIVER,
          value: BigInt(0),
          chainId: BASE_SEPOLIA_CHAIN_ID,
          gas: BigInt(150000),
        });
        setStoredKycStatus(address, 'verified');
        setKycVerified(true);
        router.push('/?role=borrower');
      } catch {
        setCollateralError('Transaction was not confirmed. Please try again.');
      } finally {
        setKycSubmitting(false);
      }
    },
    [address, collateralPaid, chainId, switchChainAsync, sendTransactionAsync, router]
  );

  if (!isConnected || !address) {
    return (
      <div className="w-full max-w-md mx-auto py-16 px-4 text-center">
        <div className="p-8 rounded-3xl bg-slate-900/80 border border-white/10 space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto">
            <AtSign className="text-slate-400" size={28} />
          </div>
          <h2 className="text-xl font-bold text-white">Connect your wallet</h2>
          <p className="text-slate-400 text-sm">
            Connect a wallet to set your TRECC subname, complete KYC, and use the app.
          </p>
          <button
            type="button"
            onClick={() => openWalletModal?.()}
            className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-medium transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (needsSubname) {
    return (
      <>
        <div className="w-full max-w-md mx-auto py-16 px-4">
          <div className="p-8 rounded-3xl bg-slate-900/80 border border-white/10 space-y-6">
            <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
              <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">1</span>
              <span>Subname</span>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto">
              <AtSign className="text-emerald-400" size={28} />
            </div>
            <h2 className="text-xl font-bold text-white text-center">Set your TRECC subname</h2>
            <p className="text-slate-400 text-sm text-center">
              Claim a free subname under <span className="text-white font-medium">{TRECC_ENS_PARENT}</span> (e.g. <span className="font-mono text-slate-300">you.trecc.eth</span>). Required to continue.
            </p>
            <button
              type="button"
              onClick={() => setShowSubnameModal(true)}
              className="w-full py-3.5 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 font-medium transition-colors flex items-center justify-center gap-2"
            >
              Set subname <ArrowRight size={18} />
            </button>
          </div>
        </div>
        <SetUsernameModal
          isOpen={showSubnameModal}
          onClose={() => setShowSubnameModal(false)}
          onSuccess={handleSubnameSuccess}
        />
      </>
    );
  }

  if (needsKyc) {
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
                        className="w-full px-4 py-3 pr-10 rounded-2xl bg-black/50 border border-white/[0.08] text-white focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-colors [color-scheme:dark]"
                      />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="kyc-country" className="block text-xs text-zinc-500 mb-1.5 font-light">Country of residence</label>
                    <input
                      id="kyc-country"
                      type="text"
                      required
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
                      placeholder="Last 4 digits visible"
                      className="w-full px-4 py-3 rounded-2xl bg-black/50 border border-white/[0.08] text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-2xl bg-black/40 border border-white/[0.08]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/[0.08] flex items-center justify-center">
                      <DollarSign className="text-zinc-400" size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Collateral required (≈${COLLATERAL_USD} USD)</p>
                      <p className="text-xs text-zinc-500 font-light">
                        Pay {COLLATERAL_ETH} ETH on Base Sepolia via MetaMask to complete this step.
                      </p>
                    </div>
                  </div>
                  {collateralPaid ? (
                    <div className="flex items-center gap-2 text-emerald-500 text-sm font-medium">
                      <Lock className="size-4" />
                      Collateral paid
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePayCollateral}
                      disabled={collateralPaying}
                      className="shrink-0 px-5 py-2.5 rounded-2xl font-medium text-white bg-zinc-700 hover:bg-zinc-600 border border-white/[0.08] disabled:opacity-70 transition-colors flex items-center justify-center gap-2"
                    >
                      {collateralPaying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {txHash ? 'Confirming…' : 'Check MetaMask…'}
                        </>
                      ) : !isBaseSepolia ? (
                        <>Switch to Base Sepolia</>
                      ) : (
                        <>Pay {COLLATERAL_ETH} ETH</>
                      )}
                    </button>
                  )}
                </div>
                {collateralError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <AlertCircle className="shrink-0" size={16} />
                    {collateralError}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={kycSubmitting || !collateralPaid}
                className="w-full py-3.5 rounded-2xl font-semibold text-white transition-all flex items-center justify-center gap-2
                  bg-[linear-gradient(180deg,#22c55e_0%,#16a34a_50%,#15803d_100%)]
                  border border-emerald-400/30 shadow-[0_4px_14px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15)]
                  hover:opacity-95 disabled:opacity-70
                "
              >
                {kycSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying…
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

  return <>{children}</>;
}
