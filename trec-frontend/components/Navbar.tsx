'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LayoutDashboard, Database, Bot, Network } from 'lucide-react';
import Link from 'next/link';
import { formatUnits } from 'viem';
import { namehash } from 'viem/ens';
import { useAccount, useBalance, useChainId, useEnsName, useEnsAvatar, useReadContract } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { useAppKit } from '@reown/appkit/react';
import {
  TRECC_ENS_PARENT,
  ENS_SEPOLIA,
  SEPOLIA_CHAIN_ID,
} from '../constants/ens';
import { NAME_WRAPPER_ABI } from '../constants/abi/nameWrapperAbi';
import { getStoredTreccUsername } from '../lib/ens-storage';
import SetUsernameModal from './SetUsernameModal';

// --- CONFIG: PASTE YOUR WALLET ADDRESS HERE FOR THE DEMO ---
const DEMO_ADDRESS = "0x29d637b793c29372ab93cd4f401f1db639835097";
const DEMO_NAME = "sky.eth";
const DEMO_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg?seed=Sky"; // A cool AI-style avatar

// Chain logo URL by chainId — use known CDNs; fallback to Network icon if image fails
const CHAIN_ICON_URLS: Record<number, string> = {
  84532: 'https://base.org/images/logo.svg', // Base Sepolia (same as Base)
  11155111: 'https://ethereum.org/favicon.ico', // Sepolia
};
function getChainIconUrl(chainId: number): string {
  return CHAIN_ICON_URLS[chainId] ?? `https://ethereum.org/favicon.ico`;
}

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [chainIconError, setChainIconError] = useState(false);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: balance } = useBalance({ address });
  const { open: openWalletModal } = useAppKit();
  const treccLabel = getStoredTreccUsername(address);

  // TokenId for Name Wrapper ownerOf (uint256 of namehash)
  const subnameTokenId = useMemo(() => {
    if (!treccLabel) return undefined;
    const node = namehash(`${treccLabel}.${TRECC_ENS_PARENT}`);
    return BigInt(node as `0x${string}`);
  }, [treccLabel]);

  // Verify subname ownership on Sepolia so we only show on-chain registered names
  const { data: onChainOwner } = useReadContract({
    address: ENS_SEPOLIA.nameWrapper,
    abi: NAME_WRAPPER_ABI,
    functionName: 'ownerOf',
    args: subnameTokenId !== undefined ? [subnameTokenId] : undefined,
    chainId: SEPOLIA_CHAIN_ID,
    query: { enabled: !!address && subnameTokenId !== undefined },
  });

  const isSubnameVerifiedOnChain =
    !!address && !!treccLabel && onChainOwner?.toLowerCase() === address.toLowerCase();

  // Show Set Username modal when connected and no verified TRECC subname
  useEffect(() => {
    if (isConnected && address && !isSubnameVerifiedOnChain && !treccLabel) {
      setShowUsernameModal(true);
    }
  }, [isConnected, address, isSubnameVerifiedOnChain, treccLabel]);

  const handleUsernameSuccess = useCallback(() => {
    setShowUsernameModal(false);
  }, []);

  // 1. Fetch real ENS data
  const { data: realEnsName } = useEnsName({
    address,
    chainId: mainnet.id,
  });

  const { data: realEnsAvatar } = useEnsAvatar({
    name: realEnsName || undefined,
    chainId: mainnet.id,
  });

  // 2. Prefer TRECC subname only when verified on-chain, then demo identity, then ENS, then truncated address
  const isDemo = address?.toLowerCase() === DEMO_ADDRESS.toLowerCase();
  const treccSubname = isSubnameVerifiedOnChain ? `${treccLabel}.${TRECC_ENS_PARENT}` : null;
  const displayId = treccSubname ?? (isDemo ? DEMO_NAME : (realEnsName || `${address?.slice(0, 4)}...${address?.slice(-4)}`));
  const displayAvatar = isDemo ? DEMO_AVATAR : (realEnsAvatar || null);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '#' },
    { id: 'vaults', label: 'Vaults', icon: Database, href: '#' },
    { id: 'agents', label: 'Agents', icon: Bot, href: '#' }
  ];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => setChainIconError(false), [chainId]);

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center w-full pointer-events-none px-4 md:px-8">
      <nav
        className={`
          relative pointer-events-auto flex items-center justify-between w-full max-w-6xl py-2.5 
          bg-black/80 backdrop-blur-2xl 
          border border-white/10 rounded-full 
          shadow-[0_16px_32px_-8px_rgba(0,0,0,0.8)] 
          shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]
          transition-all duration-500 ease-out
          ${isScrolled ? 'px-6' : 'px-6 md:px-8 hover:shadow-[0_20px_40px_-8px_rgba(0,0,0,0.9)]'}
        `}
      >

        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-3 group z-10">
          <div className="relative group-hover:scale-105 transition-transform drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]">
            <img src="/logo.png" alt="TREC Logo" className="w-9 h-9 object-contain grayscale group-hover:grayscale-0 transition-all duration-500" />
          </div>
          <span className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 hidden sm:block">
            TRECC
          </span>
        </Link>

        {/* Center: Sliding Tabs */}
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="flex items-center bg-neutral-900/80 p-1 rounded-full border border-white/5 relative shadow-inner">
            <div
              className="absolute left-1 top-1 bottom-1 w-28 bg-gradient-to-b from-slate-700 to-slate-900 rounded-full border border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.5)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-md transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                transform: `translateX(${tabs.findIndex(t => t.id === activeTab) * 100}%)`
              }}
            />

            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative z-10 w-28 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${isActive ? 'text-white drop-shadow-sm' : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                  <Icon size={16} /> <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Area: Balance + pill (ENS name when set) or wallet button */}
        <div className="flex items-center gap-2 z-10">
          {isConnected && treccSubname ? (
            <>
              {/* Wallet balance pill — same look as ENS pill: height, border, glow, shine */}
              <div
                className="relative flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-full bg-gradient-to-b from-slate-800 to-black border border-slate-500/40 text-slate-200 font-bold text-sm shadow-[0_4px_6px_-1px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1),0_0_12px_rgba(16,185,129,0.2)]"
                title={balance ? `${formatUnits(balance.value, balance.decimals)} ${balance.symbol}` : undefined}
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                {chainIconError ? (
                  <span className="relative z-10 flex items-center justify-center w-7 h-7 rounded-full bg-white/10 shrink-0 ring-2 ring-slate-700">
                    <Network className="w-3.5 h-3.5 text-slate-400" />
                  </span>
                ) : (
                  <img
                    src={getChainIconUrl(chainId)}
                    alt=""
                    className="relative z-10 w-7 h-7 rounded-full object-cover shrink-0 ring-2 ring-slate-700"
                    onError={() => setChainIconError(true)}
                  />
                )}
                <span className="relative z-10 tracking-wide tabular-nums drop-shadow-md">
                  {balance
                    ? (() => {
                      const num = Number(formatUnits(balance.value, balance.decimals));
                      return num < 0.0001 && num > 0
                        ? `< 0.0001 ${balance.symbol}`
                        : `${num.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${balance.symbol}`;
                    })()
                    : '—'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => openWalletModal?.()}
                className="group relative flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-full bg-gradient-to-b from-slate-800 to-black border border-slate-700 text-slate-200 font-bold shadow-[0_4px_6px_-1px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] hover:-translate-y-0.5 hover:shadow-[0_10px_20px_-5px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.15)] hover:border-slate-500 transition-all duration-300 active:translate-y-0 active:shadow-inner"
              >
                {/* Metallic shine reflection */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                <div className="relative z-10">
                  {displayAvatar ? (
                    <img src={displayAvatar} alt="" className="w-7 h-7 rounded-full border-2 border-slate-700 shadow-sm object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 border-2 border-slate-700 shadow-sm" />
                  )}
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-black shadow-[0_0_5px_rgba(16,185,129,0.8)]"></div>
                </div>
                <span className="text-sm z-10 tracking-wide drop-shadow-md">
                  {treccSubname}
                </span>
              </button>
            </>
          ) : (
            <div className="relative rounded-full p-[1px] bg-gradient-to-b from-slate-400 via-slate-600 to-slate-800 shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_10px_20px_-5px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.15)] hover:border-slate-500 transition-all duration-300 active:translate-y-0 active:shadow-inner">
              <div className="rounded-full overflow-hidden bg-black flex items-center justify-center relative group">
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <appkit-button />
              </div>
            </div>
          )}
        </div>

      </nav>

      <SetUsernameModal
        isOpen={showUsernameModal}
        onClose={() => setShowUsernameModal(false)}
        onSuccess={handleUsernameSuccess}
      />
    </div>
  );
}