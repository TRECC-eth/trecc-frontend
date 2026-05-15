'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { TRECC_VAULT_ADDRESS, USDC_ADDRESS } from '../constants/production-addresses';
import { setLenderDashboardAccess } from '../lib/lender-dashboard-storage';

const SEPOLIA_CHAIN_ID = 11155111;

const VAULT_ABI = [
  { inputs: [], name: 'totalAssets', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: 'assets', type: 'uint256' }, { name: 'receiver', type: 'address' }], name: 'deposit', outputs: [{ type: 'uint256' }], stateMutability: 'nonpayable', type: 'function' },
] as const;

const ERC20_ABI = [
  { inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'approve', outputs: [{ type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], name: 'allowance', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: 'account', type: 'address' }], name: 'balanceOf', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
] as const;

interface LenderVaultProps {
  onDepositSuccess?: () => void;
}

export default function LenderVault({ onDepositSuccess }: LenderVaultProps) {
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'idle' | 'approving' | 'depositing' | 'success'>('idle');
  const [walletMessage, setWalletMessage] = useState('');
  const { address } = useAccount();

  const { data: tvlRaw, isLoading: tvlLoading, refetch: refetchTvl } = useReadContract({
    address: TRECC_VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'totalAssets',
    chainId: SEPOLIA_CHAIN_ID,
  });

  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: SEPOLIA_CHAIN_ID,
    query: { enabled: !!address },
  });

  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, TRECC_VAULT_ADDRESS] : undefined,
    chainId: SEPOLIA_CHAIN_ID,
    query: { enabled: !!address },
  });

  const { writeContract, data: txHash, reset: resetTx } = useWriteContract();

  const { isSuccess: txConfirmed, isLoading: txPending } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (!txConfirmed) return;

    if (step === 'approving') {
      refetchAllowance();
      resetTx();
      queueMicrotask(() => setStep('depositing'));
      if (!address) return;
      const rawAmount = parseUnits(amount, 6);
      writeContract({
        address: TRECC_VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'deposit',
        args: [rawAmount, address],
        chainId: SEPOLIA_CHAIN_ID,
      });
    } else if (step === 'depositing') {
      queueMicrotask(() => setStep('success'));
      setLenderDashboardAccess(address);
      refetchTvl();
      onDepositSuccess?.();
    }
  }, [txConfirmed, step, address, amount, refetchAllowance, refetchTvl, resetTx, writeContract, onDepositSuccess]);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || step !== 'idle') return;

    if (!address) {
      setWalletMessage('Connect wallet to provide liquidity.');
      return;
    }

    setWalletMessage('');

    const rawAmount = parseUnits(amount, 6);
    const needsApproval = !currentAllowance || currentAllowance < rawAmount;

    if (needsApproval) {
      setStep('approving');
      writeContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [TRECC_VAULT_ADDRESS, rawAmount],
        chainId: SEPOLIA_CHAIN_ID,
      });
    } else {
      setStep('depositing');
      writeContract({
        address: TRECC_VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'deposit',
        args: [rawAmount, address],
        chainId: SEPOLIA_CHAIN_ID,
      });
    }
  };

  const tvl = tvlRaw !== undefined
    ? Number(formatUnits(tvlRaw, 6)).toLocaleString(undefined, { maximumFractionDigits: 2 })
    : '0';

  const walletBalance = usdcBalance !== undefined
    ? Number(formatUnits(usdcBalance, 6)).toLocaleString(undefined, { maximumFractionDigits: 2 })
    : null;

  const canSubmit = step === 'idle' && !!amount && Number(amount) > 0;
  const isActive = step !== 'idle';

  return (
    <form
      onSubmit={handleAction}
      className="
        w-full rounded-2xl border border-white/[0.08]
        bg-[linear-gradient(160deg,#151517_0%,#050505_55%,#101014_100%)]
        p-4 md:p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_20px_45px_-24px_rgba(0,0,0,1)]
      "
    >
      <div className="flex flex-col gap-4">
        {/* TVL stat */}
        <div className="
          w-full md:w-fit min-w-[220px] rounded-2xl border border-white/[0.08]
          bg-black/45 px-5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]
        ">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Protocol TVL
          </span>
          <span className="mt-2 block text-2xl font-semibold tracking-tight text-zinc-100 tabular-nums">
            {tvlLoading ? (
              <span className="inline-flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </span>
            ) : `$${tvl}`}
          </span>
          <span className="mt-1 block text-xs text-zinc-600">
            Total USDC supplied
          </span>
        </div>

        {/* Amount input */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2 px-1">
            <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Amount</label>
            {walletBalance && (
              <button
                type="button"
                onClick={() => usdcBalance && setAmount(formatUnits(usdcBalance, 6))}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Balance {walletBalance} USDC
              </button>
            )}
          </div>
          <div className="relative flex items-center rounded-2xl bg-black/50 border border-white/[0.08] focus-within:border-zinc-500/70 focus-within:bg-black/70 transition-colors">
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*\.?[0-9]*"
              value={amount}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                  setAmount(val);
                  setWalletMessage('');
                }
              }}
              placeholder="0.00"
              className="
                flex-1 min-w-0 bg-transparent py-4 px-5 text-2xl font-medium text-zinc-100
                placeholder-zinc-700 tabular-nums tracking-tight
                focus:outline-none
              "
              required
            />
            <div className="pr-4 flex items-center gap-2">
              <img
                src="https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png"
                alt="USDC"
                className="w-5 h-5 rounded-full"
              />
              <span className="text-sm font-semibold text-zinc-400">USDC</span>
            </div>
          </div>
        </div>

        {walletMessage && (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-300">
            {walletMessage}
          </div>
        )}

        {isActive && <TransactionProgress step={step} />}

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="
            w-full py-3.5 rounded-2xl text-sm font-semibold tracking-normal
            bg-zinc-100 text-zinc-950
            border border-white/10
            shadow-[0_14px_30px_-18px_rgba(255,255,255,0.5)]
            hover:bg-white
            active:scale-[0.99]
            disabled:bg-zinc-800/70 disabled:text-zinc-500 disabled:border-white/[0.06] disabled:shadow-none disabled:cursor-not-allowed
            transition-all duration-200
            flex items-center justify-center gap-2
          "
        >
          {step === 'approving' && <><Loader2 className="animate-spin" size={16} /> {txPending ? 'Confirming approval…' : 'Approve in wallet…'}</>}
          {step === 'depositing' && <><Loader2 className="animate-spin" size={16} /> {txPending ? 'Confirming deposit…' : 'Confirm in wallet…'}</>}
          {step === 'success' && <><CheckCircle2 size={16} /> Deposit successful</>}
          {step === 'idle' && (
            <>
              Provide Liquidity
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function TransactionProgress({ step }: { step: 'approving' | 'depositing' | 'success' }) {
  const stages = [
    { key: 'approving', label: 'Approve' },
    { key: 'depositing', label: 'Deposit' },
    { key: 'success', label: 'Done' },
  ] as const;
  const currentIndex = stages.findIndex((stage) => stage.key === step);
  const progressRatio = step === 'success' ? 1 : currentIndex === 1 ? 0.5 : 0;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-black/35 px-4 py-4">
      <div className="relative">
        <div className="absolute left-5 right-5 top-4 h-px bg-zinc-800" />
        <div
          className="absolute left-5 top-4 h-px bg-zinc-300 transition-all duration-700 ease-out"
          style={{ width: `calc((100% - 2.5rem) * ${progressRatio})` }}
        />

        <div className="relative z-10 grid grid-cols-3">
          {stages.map((stage, index) => {
            const done = index < currentIndex || step === 'success';
            const active = index === currentIndex && step !== 'success';

            return (
              <div
                key={stage.key}
                className={`flex flex-col gap-2 ${index === 0 ? 'items-start' : index === 1 ? 'items-center' : 'items-end'}`}
              >
                <div
                  className={`
                    flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-all duration-300
                    ${done
                      ? 'border-zinc-200 bg-zinc-100 text-zinc-950'
                      : active
                        ? 'border-zinc-300 bg-zinc-900 text-zinc-100 shadow-[0_0_20px_rgba(255,255,255,0.12)]'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-600'}
                  `}
                >
                  {done ? <CheckCircle2 size={15} /> : index + 1}
                </div>
                <span
                  className={`
                    text-[11px] font-medium transition-colors duration-300
                    ${done || active ? 'text-zinc-300' : 'text-zinc-600'}
                  `}
                >
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
