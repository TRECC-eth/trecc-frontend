'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Network, LogOut, ChevronDown, Copy, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { formatUnits } from 'viem';
import { namehash } from 'viem/ens';
import { useAccount, useBalance, useChainId, useDisconnect, useEnsName, useEnsAvatar, useReadContract } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { usePrivy } from '@privy-io/react-auth';
import {
  TRECC_ENS_PARENT,
  ENS_SEPOLIA,
  SEPOLIA_CHAIN_ID,
} from '../constants/ens';
import { NAME_WRAPPER_ABI } from '../constants/abi/nameWrapperAbi';
import { getStoredTreccUsername } from '../lib/ens-storage';

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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isScrolled, setIsScrolled] = useState(false);
  const [chainIconError, setChainIconError] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: balance } = useBalance({ address });
  const { login: openWalletModal, logout } = usePrivy();
  const { disconnect } = useDisconnect();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
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
  }, []);


  const { data: realEnsName } = useEnsName({ address, chainId: mainnet.id });
  const { data: realEnsAvatar } = useEnsAvatar({ name: realEnsName || undefined, chainId: mainnet.id });

  const isDemo = address?.toLowerCase() === DEMO_ADDRESS.toLowerCase();
  const treccSubname = isSubnameVerifiedOnChain ? `${treccLabel}.${TRECC_ENS_PARENT}` : null;
  const displayId = treccSubname ?? (isDemo ? DEMO_NAME : (realEnsName || `${address?.slice(0, 4)}...${address?.slice(-4)}`));

  const randomAvatar = useMemo(() => {
    if (!address) return null;
    const seed = address.slice(2, 10);
    const styles = ['adventurer', 'adventurer-neutral', 'avataaars', 'big-ears', 'bottts', 'fun-emoji', 'lorelei', 'notionists', 'open-peeps', 'pixel-art', 'thumbs'] as const;
    const styleIndex = parseInt(seed.slice(0, 2), 16) % styles.length;
    return `https://api.dicebear.com/9.x/${styles[styleIndex]}/svg?seed=${seed}`;
  }, [address]);

  const displayAvatar = isDemo ? DEMO_AVATAR : (realEnsAvatar || randomAvatar);
  const roleParam = searchParams.get('role');
  const showWalletControls = pathname !== '/' || roleParam === 'lender' || roleParam === 'borrower';

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => setChainIconError(false), [chainId]);

  if (!mounted) return null;

  return (
    <div className="fixed top-7 left-0 right-0 z-50 flex justify-center w-full pointer-events-none px-4 md:px-8">
      <nav
        className={`
          relative pointer-events-auto flex items-center justify-between w-full max-w-6xl
          bg-zinc-900/40 backdrop-blur-[32px] saturate-150
          border border-white/[0.08] rounded-full
          shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)]
          transition-all duration-500 ease-out
          ${isScrolled ? 'px-6 py-3 bg-zinc-900/60' : 'px-6 py-3 md:px-8'}
        `}
      >
        {/* Left: Logo Only */}
        <Link href="/" className="flex items-center gap-3 group z-10">
          <div className="relative group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]">
            <div className="absolute inset-0 bg-white/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <img
              src="/logo.png"
              alt="Logo"
              className="relative w-20 h-11 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            />
          </div>
        </Link>

        {/* Center: Simple Text Links */}
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 gap-10 items-center">
          <Link
            href="https://docs.trecc.finance/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-zinc-300 hover:text-white transition-colors tracking-wide drop-shadow-md"
          >
            Docs
          </Link>
          <Link
            href="https://trecc.finance/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-zinc-300 hover:text-white transition-colors tracking-wide drop-shadow-md"
          >
            Contact
          </Link>
        </div>

        {/* Right Area: Connected State OR Metallic Connect Button */}
        <div className="flex items-center gap-3 z-10">
          {showWalletControls && isConnected ? (
            <>
              {/* Balance Pill - Softened Borders */}
              <div
                className="relative flex items-center gap-2.5 pl-3 pr-4 py-2 rounded-full bg-gradient-to-b from-zinc-800 to-zinc-950 border border-white/[0.05] text-zinc-200 font-black text-[11px] uppercase tracking-[0.15em] shadow-[inset_0_1px_4px_rgba(0,0,0,0.8),0_1px_1px_rgba(255,255,255,0.05)]"
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

              {/* Connected Wallet Pill with Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="
                    group relative flex items-center gap-2.5 pl-1.5 pr-4 py-2 rounded-full
                    font-black uppercase text-[11px] tracking-[0.15em]
                    text-zinc-800 [text-shadow:0_1px_0_rgba(255,255,255,0.9),0_-1px_0_rgba(0,0,0,0.1)]
                    bg-[linear-gradient(180deg,#ffffff_0%,#e2e2e2_25%,#999999_45%,#d4d4d4_55%,#737373_100%)]
                    border border-black/10 ring-1 ring-inset ring-white/30
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
                  <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/80 to-transparent skew-x-[-45deg] group-hover:left-[200%] transition-all duration-1000 ease-in-out pointer-events-none" />
                  {displayAvatar ? (
                    <img src={displayAvatar} alt="" className="relative z-10 w-7 h-7 rounded-full object-cover border border-zinc-400/60 shadow-[0_1px_3px_rgba(0,0,0,0.4)] bg-white" />
                  ) : (
                    <div className="relative z-10 w-7 h-7 rounded-full bg-zinc-800 border border-zinc-500 shadow-inner" />
                  )}
                  <span className="relative z-10">
                    {displayId}
                  </span>
                  <ChevronDown size={12} className={`relative z-10 text-zinc-600 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="
                    absolute right-0 top-full mt-3 w-64 rounded-2xl overflow-hidden
                    bg-zinc-900/95 backdrop-blur-xl border border-white/[0.08]
                    shadow-[0_20px_50px_-10px_rgba(0,0,0,1),0_0_0_1px_rgba(0,0,0,0.5)]
                    animate-dropdown-in
                    z-50
                  ">
                    <div className="p-4 border-b border-white/[0.06] flex items-center gap-3">
                      {displayAvatar ? (
                        <img src={displayAvatar} alt="" className="w-10 h-10 rounded-full object-cover border border-white/10 bg-white" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-200 truncate">{displayId}</p>
                        <p className="text-[11px] text-zinc-500 font-mono truncate">{address}</p>
                      </div>
                    </div>

                    <div className="p-1.5">
                      <button
                        onClick={() => {
                          if (address) navigator.clipboard.writeText(address);
                          setDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] transition-colors duration-150"
                      >
                        <Copy size={14} />
                        Copy Address
                      </button>

                      <button
                        onClick={() => {
                          if (address) window.open(`https://etherscan.io/address/${address}`, '_blank');
                          setDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] transition-colors duration-150"
                      >
                        <ExternalLink size={14} />
                        View on Explorer
                      </button>

                      <div className="my-1 border-t border-white/[0.05]" />

                      <button
                        onClick={async () => {
                          setDropdownOpen(false);
                          disconnect();
                          try { await logout(); } catch {}
                          router.push('/');
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/[0.08] transition-colors duration-150"
                      >
                        <LogOut size={14} />
                        Disconnect
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : showWalletControls ? (

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

          ) : null}
        </div>
      </nav>

    </div>
  );
}
