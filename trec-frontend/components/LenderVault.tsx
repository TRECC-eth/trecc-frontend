'use client';

import React, { useState } from 'react';
import { Wallet, ArrowDownCircle, Loader2, CheckCircle2, ChevronDown } from 'lucide-react';
import { useReadContract, useWriteContract, useAccount } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';

// --- CONFIG ---
const VAULT_ADDRESS = "0x64d02fa756D452B3022e8637aA3fe47b914Bd31c";
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

const VAULT_ABI = [
  { "inputs": [], "name": "totalPoolLiquidity", "outputs": [{ "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "name": "_amount", "type": "uint256" }], "name": "depositLiquidity", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "name": "stakeBond", "outputs": [], "stateMutability": "payable", "type": "function" }
] as const;

const ERC20_ABI = [
  { "inputs": [{ "name": "spender", "type": "address" }, { "name": "amount", "type": "uint256" }], "name": "approve", "outputs": [{ "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }
] as const;

// Token definitions with high-res icons
type Token = { symbol: string; icon: string; isNative: boolean; decimals: number; color: string };
const TOKENS: Token[] = [
  {
    symbol: 'USDC',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
    isNative: false,
    decimals: 6,
    color: 'blue'
  },
  {
    symbol: 'ETH',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
    isNative: true,
    decimals: 18,
    color: 'white'
  },
];

interface LenderVaultProps {
  onDepositSuccess?: () => void;
}

export default function LenderVault({ onDepositSuccess }: LenderVaultProps) {
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<Token>(TOKENS[0]);
  const [showSelector, setShowSelector] = useState(false);
  const [step, setStep] = useState<'idle' | 'approving' | 'processing' | 'success'>('idle');

  const { address } = useAccount();

  const { data: vaultBalanceData, isLoading, isError, refetch } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'totalPoolLiquidity',
  });

  const { writeContract: write } = useWriteContract();

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !address) return;

    const rawAmount = parseUnits(amount, selectedToken.decimals);

    if (selectedToken.symbol === 'USDC') {
      setStep('approving');
      write({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [VAULT_ADDRESS, rawAmount],
      }, {
        onSuccess: () => {
          setStep('processing');
          setTimeout(() => {
            write({
              address: VAULT_ADDRESS,
              abi: VAULT_ABI,
              functionName: 'depositLiquidity',
              args: [rawAmount],
            }, {
              onSuccess: () => { setStep('success'); refetch(); onDepositSuccess?.(); },
              onError: () => setStep('idle')
            });
          }, 2000);
        },
        onError: () => setStep('idle')
      });
    } else {
      setStep('processing');
      write({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'stakeBond',
        value: rawAmount,
      }, {
        onSuccess: () => { setStep('success'); onDepositSuccess?.(); },
        onError: () => setStep('idle')
      });
    }
  };

  return (
    <div className="max-w-md mx-auto w-full space-y-4">

      {/* TVL Display */}
      <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-white/5 flex justify-between items-center">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Protocol TVL</p>
          <p className="text-3xl font-mono font-bold text-white tracking-tighter">
            {isLoading ? "..." : `$${vaultBalanceData !== undefined ? Number(formatUnits(vaultBalanceData, 6)).toLocaleString() : '0'}`}
          </p>
        </div>
        <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-black tracking-tighter">
          10% APY
        </div>
      </div>

      <form onSubmit={handleAction} className="space-y-4">
        <div className="relative group">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-[#050505] border border-white/10 p-5 pl-12 pr-36 rounded-2xl text-white text-2xl placeholder-zinc-800 focus:outline-none focus:border-white/20 transition-all"
            required
          />
          <Wallet className="absolute left-4 top-6 text-zinc-700" size={20} />

          {/* Token Selector UI */}
          <div className="absolute right-2 top-2 bottom-2 flex items-center">
            <button
              type="button"
              onClick={() => setShowSelector(!showSelector)}
              className="flex items-center gap-2 bg-zinc-900 border border-white/5 py-2 px-3 rounded-xl hover:bg-zinc-800 transition-colors"
            >
              <div className="relative w-6 h-6">
                <div className={`absolute inset-0 bg-${selectedToken.color === 'blue' ? 'blue-500' : 'white'}/20 blur-sm rounded-full`} />
                <img src={selectedToken.icon} alt={selectedToken.symbol} className="relative w-6 h-6 rounded-full object-contain" />
              </div>
              <span className="text-sm font-bold text-white">{selectedToken.symbol}</span>
              <ChevronDown size={14} className={`text-zinc-600 transition-transform ${showSelector ? 'rotate-180' : ''}`} />
            </button>

            {showSelector && (
              <div className="absolute top-full right-0 mt-2 w-40 bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
                {TOKENS.map((t) => (
                  <button
                    key={t.symbol}
                    type="button"
                    className={`w-full flex items-center gap-3 p-4 hover:bg-white/5 text-sm transition-colors ${selectedToken.symbol === t.symbol ? 'bg-white/5 text-white' : 'text-zinc-500'}`}
                    onClick={() => { setSelectedToken(t); setShowSelector(false); }}
                  >
                    <img src={t.icon} alt="" className="w-5 h-5 rounded-full" />
                    <span className="font-bold">{t.symbol}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={step !== 'idle' || !amount}
          className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex justify-center items-center gap-2 hover:bg-zinc-200 disabled:opacity-30 transition-all active:scale-[0.98]"
        >
          {step === 'approving' && <><Loader2 className="animate-spin" size={16} /> Approving...</>}
          {step === 'processing' && <><Loader2 className="animate-spin" size={16} /> Confirming...</>}
          {step === 'success' && <><CheckCircle2 size={16} /> Success</>}
          {step === 'idle' && (
            selectedToken.symbol === 'USDC' ? <><ArrowDownCircle size={16} /> Provide Liquidity</> : <><ArrowDownCircle size={16} /> Stake Bond</>
          )}
        </button>
      </form>

      <p className="text-[9px] text-center text-zinc-700 font-mono tracking-widest uppercase">
        Verified On-Chain Interaction
      </p>
    </div>
  );
}