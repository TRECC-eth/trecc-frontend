'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Network } from 'lucide-react';
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
const DEMO_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg?seed=Sky";

const CHAIN_ICON_URLS: Record<number, string> = {
  84532: 'https://base.org/images/logo.svg',
  11155111: 'https://ethereum.org/favicon.ico',
};
function getChainIconUrl(chainId: number): string {
  return CHAIN_ICON_URLS[chainId] ?? `https://ethereum.org/favicon.ico`;
}

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTab, setActivateTab] = useState('dashboard');
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [chainIconError, setChainIconError] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: balance } = useBalance({ address });
  const { open: openWalletModal } = useAppKit();
  const treccLabel = getStoredTreccUsername(address);

  const subnameTokenId = useMemo(() => {
    if (!treccLabel) return undefined;
    const node = namehash(`${treccLabel}.${TRECC_ENS_PARENT}`);
    return BigInt(node as `0x${string}`);
  }, [treccLabel]);

  const { data: onChainOwner } = useReadContract({
    address: ENS_SEPOLIA.nameWrapper,
    abi: NAME_WRAPPER_ABI,
    functionName: 'ownerOf',
    args: subnameTokenId !== undefined ? [subnameTokenId] : undefined,
    chainId: SEPOLIA_CHAIN_ID,
    query: { enabled: !!address && subnameTokenId !== undefined },
  });

  const isSubnameVerifiedOnChain = !!address && !!treccLabel && onChainOwner?.toLowerCase() === address.toLowerCase();

  useEffect(() => {
    setMounted(true);
    if (isConnected && address && !isSubnameVerifiedOnChain && !treccLabel) {
      setShowUsernameModal(true);
    }
  }, [isConnected, address, isSubnameVerifiedOnChain, treccLabel]);

  const handleUsernameSuccess = useCallback(() => {
    setShowUsernameModal(false);
  }, []);

  const { data: realEnsName } = useEnsName({ address, chainId: mainnet.id });
  const { data: realEnsAvatar } = useEnsAvatar({ name: realEnsName || undefined, chainId: mainnet.id });

  const isDemo = address?.toLowerCase() === DEMO_ADDRESS.toLowerCase();
  const treccSubname = isSubnameVerifiedOnChain ? `${treccLabel}.${TRECC_ENS_PARENT}` : null;
  const displayId = treccSubname ?? (isDemo ? DEMO_NAME : (realEnsName || `${address?.slice(0, 4)}...${address?.slice(-4)}`));
  const displayAvatar = isDemo ? DEMO_AVATAR : (realEnsAvatar || null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => setChainIconError(false), [chainId]);

  if (!mounted) return null;

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center w-full pointer-events-none px-4 md:px-8">
      <nav
        className={`
          relative pointer-events-auto flex items-center justify-between w-full max-w-6xl py-3 
          bg-[#0a0a0a]/80 backdrop-blur-2xl 
          border border-white/5 rounded-full 
          shadow-[0_16px_32px_-8px_rgba(0,0,0,0.8)] 
          transition-all duration-500 ease-out
          ${isScrolled
            ? 'bg-black/60 backdrop-blur-xl md:backdrop-blur-2xl px-6'
            : 'bg-black/40 backdrop-blur-sm px-6 md:px-8 hover:shadow-[0_20px_40px_-8px_rgba(0,0,0,0.9)]'}
        `}
      >
        {/* Left: Logo Only */}
        <Link href="/" className="flex items-center gap-3 group z-10">
          <div className="relative group-hover:scale-105 transition-transform">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-10 h-10 object-contain grayscale group-hover:grayscale-0 transition-all duration-500 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]"
            />
          </div>
        </Link>

        {/* Center: Simple Text Links */}
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 gap-10 items-center">
          <Link href="#how-it-works" className="text-sm font-semibold text-zinc-500 hover:text-zinc-200 transition-colors tracking-wide">
            How it works
          </Link>
          <Link href="#docs" className="text-sm font-semibold text-zinc-500 hover:text-zinc-200 transition-colors tracking-wide">
            Docs
          </Link>
        </div>

        {/* Right Area: Connected State OR Metallic Connect Button */}
        <div className="flex items-center gap-3 z-10">
          {isConnected ? (
            <>
              {/* Balance Pill */}
              <div
                className="relative flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300 font-bold text-sm shadow-inner"
                title={balance ? `${formatUnits(balance.value, balance.decimals)} ${balance.symbol}` : undefined}
              >
                {chainIconError ? (
                  <span className="relative z-10 flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800 shrink-0">
                    <Network className="w-3.5 h-3.5 text-zinc-400" />
                  </span>
                ) : (
                  <img
                    src={getChainIconUrl(chainId)}
                    alt=""
                    className="relative z-10 w-6 h-6 rounded-full object-cover shrink-0 grayscale opacity-80"
                    onError={() => setChainIconError(true)}
                  />
                )}
                <span className="relative z-10 tracking-wide tabular-nums">
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

              {/* Connected Wallet Pill */}
              <button
                type="button"
                onClick={() => openWalletModal?.()}
                className="flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-600 text-white font-bold hover:bg-zinc-800 transition-colors shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
              >
                {displayAvatar ? (
                  <img src={displayAvatar} alt="" className="w-6 h-6 rounded-full object-cover border border-zinc-700" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-zinc-700" />
                )}
                <span className="text-sm tracking-wide">
                  {displayId}
                </span>
              </button>
            </>
          ) : (

            /* --- PURE TAILWIND 3D METALLIC BUTTON (NO DEPENDENCIES) --- */
            <button
              onClick={() => openWalletModal?.()}
              className="
                relative px-7 py-3 rounded-full font-extrabold uppercase text-[11px] tracking-[0.15em]
                text-zinc-800 [text-shadow:0_1px_0_rgba(255,255,255,0.8)]
                bg-gradient-to-b from-zinc-200 via-zinc-400 to-zinc-500
                border-t border-t-zinc-100 border-b border-b-zinc-700 border-l border-l-zinc-300 border-r border-r-zinc-300
                shadow-[0_10px_20px_-5px_rgba(0,0,0,0.9),inset_0_3px_4px_rgba(255,255,255,0.9),inset_0_-4px_6px_rgba(0,0,0,0.4)]
                hover:from-zinc-100 hover:via-zinc-300 hover:to-zinc-400
                hover:-translate-y-[1px]
                hover:shadow-[0_15px_25px_-5px_rgba(0,0,0,0.9),inset_0_3px_5px_rgba(255,255,255,1),inset_0_-4px_6px_rgba(0,0,0,0.3)]
                active:translate-y-[2px] 
                active:shadow-[0_2px_5px_-2px_rgba(0,0,0,0.9),inset_0_4px_8px_rgba(0,0,0,0.5)]
                transition-all duration-200 ease-out
              "
            >
              Connect Wallet
            </button>

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