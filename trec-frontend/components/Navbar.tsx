'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
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
    router.push('/dashboard/borrower');
  }, [router]);

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
          /* SOFTENED FROSTED GLASS BACKGROUND */
          bg-zinc-900/40 backdrop-blur-[32px] saturate-150
          border border-white/[0.08] rounded-full 
          shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] 
          transition-all duration-500 ease-out
          ${isScrolled ? 'px-6 bg-zinc-900/60' : 'px-6 md:px-8'}
        `}
      >
        {/* Left: Logo Only */}
        <Link href="/" className="flex items-center gap-3 group z-10">
          <div className="relative group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]">
            <div className="absolute inset-0 bg-white/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <img
              src="/logo.png"
              alt="Logo"
              className="relative w-10 h-10 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            />
          </div>
        </Link>

        {/* Center: Simple Text Links */}
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 gap-10 items-center">
          <Link href="#how-it-works" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors tracking-wide drop-shadow-md">
            How it works
          </Link>
          <Link href="#docs" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors tracking-wide drop-shadow-md">
            Docs
          </Link>
        </div>

        {/* Right Area: Connected State OR Metallic Connect Button */}
        <div className="flex items-center gap-3 z-10">
          {isConnected ? (
            <>
              {/* Balance Pill - Softened Borders */}
              <div
                className="relative flex items-center gap-2.5 pl-2 pr-4 py-1.5 rounded-full bg-gradient-to-b from-zinc-800 to-zinc-950 border border-white/[0.05] text-zinc-200 font-medium text-sm shadow-[inset_0_1px_4px_rgba(0,0,0,0.8),0_1px_1px_rgba(255,255,255,0.05)]"
                title={balance ? `${formatUnits(balance.value, balance.decimals)} ${balance.symbol}` : undefined}
              >
                {chainIconError ? (
                  <span className="relative z-10 flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800 shrink-0 border border-zinc-700 shadow-inner">
                    <Network className="w-3 h-3 text-zinc-400" />
                  </span>
                ) : (
                  <img
                    src={getChainIconUrl(chainId)}
                    alt=""
                    className="relative z-10 w-5 h-5 rounded-full object-cover shrink-0 grayscale opacity-90 border border-zinc-700 shadow-sm"
                    onError={() => setChainIconError(true)}
                  />
                )}
                <span className="relative z-10 tracking-widest tabular-nums text-[11px] uppercase">
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

              {/* Connected Wallet Pill - Soft Machined Transition */}
              <button
                type="button"
                onClick={() => openWalletModal?.()}
                className="
                  group flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-full 
                  bg-gradient-to-b from-zinc-200 via-zinc-400 to-zinc-500
                  border border-zinc-400/50 ring-1 ring-black/10
                  text-zinc-900 font-bold hover:from-white hover:via-zinc-300 hover:to-zinc-400 
                  transition-all duration-300 shadow-[0_4px_10px_rgba(0,0,0,0.4),inset_0_2px_3px_rgba(255,255,255,0.8)]
                "
              >
                {displayAvatar ? (
                  <img src={displayAvatar} alt="" className="w-6 h-6 rounded-full object-cover border border-zinc-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-500 shadow-inner" />
                )}
                <span className="text-xs tracking-wider uppercase [text-shadow:0_1px_0_rgba(255,255,255,0.6)]">
                  {displayId}
                </span>
              </button>
            </>
          ) : (

            /* --- SOFTENED 3D CHROMIUM BUTTON --- */
            <button
              onClick={() => openWalletModal?.()}
              className="
                group relative px-8 py-3 rounded-full font-black uppercase text-[11px] tracking-[0.2em]
                text-zinc-800 [text-shadow:0_1px_0_rgba(255,255,255,0.9),0_-1px_0_rgba(0,0,0,0.1)]
                bg-[linear-gradient(180deg,#ffffff_0%,#e2e2e2_25%,#999999_45%,#d4d4d4_55%,#737373_100%)]
                
                /* Replaced harsh borders with subtle rings and translucent borders for anti-aliasing */
                border border-black/10 ring-1 ring-inset ring-white/30
                
                /* Softer, more blended shadows */
                shadow-[0_15px_25px_-5px_rgba(0,0,0,0.6),inset_0_3px_5px_rgba(255,255,255,0.9),inset_0_-3px_6px_rgba(0,0,0,0.25)]
                
                hover:-translate-y-[2px] hover:scale-[1.02]
                hover:bg-[linear-gradient(180deg,#ffffff_0%,#f5f5f5_25%,#a3a3a3_45%,#e5e5e5_55%,#808080_100%)]
                hover:shadow-[0_20px_35px_-5px_rgba(0,0,0,0.7),inset_0_4px_6px_rgba(255,255,255,1),inset_0_-3px_6px_rgba(0,0,0,0.2)]
                
                active:translate-y-[1px] active:scale-[0.98]
                active:bg-[linear-gradient(180deg,#e2e2e2_0%,#cccccc_25%,#808080_45%,#b3b3b3_55%,#595959_100%)]
                active:shadow-[0_5px_10px_-2px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(0,0,0,0.3),inset_0_-2px_4px_rgba(255,255,255,0.3)]
                
                transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]
                overflow-hidden
              "
            >
              {/* Sweeping Light Glare Effect on Hover */}
              <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/80 to-transparent skew-x-[-45deg] group-hover:left-[200%] transition-all duration-1000 ease-in-out pointer-events-none" />

              <span className="relative z-10">Connect Wallet</span>
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