'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { TRECC_VAULT_ADDRESS, USDC_ADDRESS } from '../constants/production-addresses';

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
      setStep('depositing');
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
      setStep('success');
      refetchTvl();
      onDepositSuccess?.();
    }
  }, [txConfirmed, step, address, amount, refetchAllowance, refetchTvl, resetTx, writeContract, onDepositSuccess]);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !address || step !== 'idle') return;

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
    <div className="w-full space-y-4 border border-zinc-800 rounded-2xl p-6">
      {/* TVL bar */}
      <div className="flex items-center justify-between px-1 py-3 rounded-xl">
        <span className="font-bold text-xl text-zinc-300">Protocol TVL</span>
        <span className="text-2xl font-bold text-zinc-300 tabular-nums">
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
      </div>

      <form onSubmit={handleAction} className="space-y-4 pt-2">
        {/* Amount input */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <label className="text-xs text-zinc-500">Amount (USDC)</label>
            {walletBalance && (
              <button
                type="button"
                onClick={() => usdcBalance && setAmount(formatUnits(usdcBalance, 6))}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Balance: {walletBalance}
              </button>
            )}
          </div>
          <div className="relative flex items-center rounded-xl bg-zinc-900 border border-zinc-800 focus-within:border-zinc-600 transition-colors">
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*\.?[0-9]*"
              value={amount}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^\d*\.?\d*$/.test(val)) setAmount(val);
              }}
              placeholder="0.00"
              className="
                flex-1 bg-transparent py-4 px-4 text-xl font-medium text-zinc-100
                placeholder-zinc-700 tabular-nums
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
              <span className="text-sm font-medium text-zinc-400">USDC</span>
            </div>
          </div>
        </div>

        {/* Transaction steps */}
        {isActive && (
          <div className="flex items-center gap-3 px-1 py-2 text-xs">
            <StepDot active={step === 'approving'} done={step === 'depositing' || step === 'success'} />
            <span className={step === 'approving' ? 'text-zinc-300' : 'text-zinc-600'}>Approve</span>
            <div className="flex-1 h-px bg-zinc-800" />
            <StepDot active={step === 'depositing'} done={step === 'success'} />
            <span className={step === 'depositing' ? 'text-zinc-300' : 'text-zinc-600'}>Deposit</span>
            <div className="flex-1 h-px bg-zinc-800" />
            <StepDot active={step === 'success'} done={step === 'success'} />
            <span className={step === 'success' ? 'text-zinc-300' : 'text-zinc-600'}>Done</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="
            w-full py-4 rounded-xl text-sm font-semibold tracking-wide
            bg-zinc-100 text-zinc-900
            hover:bg-white
            active:scale-[0.99]
            disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed
            transition-all duration-150
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
      </form>
    </div>
  );
}

function StepDot({ active, done }: { active: boolean; done: boolean }) {
  return (
    <div
      className={`
        w-2 h-2 rounded-full transition-colors duration-300
        ${done ? 'bg-zinc-300' : active ? 'bg-zinc-400 animate-pulse' : 'bg-zinc-700'}
      `}
    />
  );
}
