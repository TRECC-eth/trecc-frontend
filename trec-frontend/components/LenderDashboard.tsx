'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { LivelinePoint } from 'liveline';
import { formatUnits } from 'viem';
import { useAccount, useReadContract } from 'wagmi';
import { Activity, Database, Landmark } from 'lucide-react';
import { TRECC_VAULT_ADDRESS } from '../constants/production-addresses';
import PortfolioChart from './PortfolioChart';

const SEPOLIA_CHAIN_ID = 11155111;
const USDC_DECIMALS = 6;
const SERIES_STORAGE_PREFIX = 'trecc:lender-series:';

const DASHBOARD_VAULT_ABI = [
  { inputs: [], name: 'totalAssets', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'totalPoolLiquidity', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: 'account', type: 'address' }], name: 'balanceOf', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: 'lender', type: 'address' }], name: 'lenderDeposits', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: 'borrower', type: 'address' }], name: 'activeLoans', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
] as const;

function formatUSDC(value?: bigint | null) {
  if (value === undefined || value === null) return '—';
  return `$${Number(formatUnits(value, USDC_DECIMALS)).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function toNumber(value?: bigint | null) {
  if (value === undefined || value === null) return 0;
  return Number(formatUnits(value, USDC_DECIMALS));
}

function shortAddress(address?: string) {
  if (!address) return 'Not connected';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function readStoredSeries(address?: string): LivelinePoint[] {
  if (typeof window === 'undefined' || !address) return [];
  try {
    const raw = localStorage.getItem(`${SERIES_STORAGE_PREFIX}${address.toLowerCase()}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LivelinePoint[];
    return Array.isArray(parsed) ? parsed.filter((point) => Number.isFinite(point.time) && Number.isFinite(point.value)) : [];
  } catch {
    return [];
  }
}

function writeStoredSeries(address: string | undefined, series: LivelinePoint[]) {
  if (typeof window === 'undefined' || !address) return;
  localStorage.setItem(`${SERIES_STORAGE_PREFIX}${address.toLowerCase()}`, JSON.stringify(series.slice(-240)));
}

export default function LenderDashboard() {
  const { address } = useAccount();
  const [series, setSeries] = useState<LivelinePoint[]>([]);
  const [fallbackPoint, setFallbackPoint] = useState<LivelinePoint | null>(null);

  const { data: totalAssets } = useReadContract({
    address: TRECC_VAULT_ADDRESS,
    abi: DASHBOARD_VAULT_ABI,
    functionName: 'totalAssets',
    chainId: SEPOLIA_CHAIN_ID,
  });

  const { data: totalPoolLiquidity } = useReadContract({
    address: TRECC_VAULT_ADDRESS,
    abi: DASHBOARD_VAULT_ABI,
    functionName: 'totalPoolLiquidity',
    chainId: SEPOLIA_CHAIN_ID,
    query: { retry: false },
  });

  const { data: vaultShares } = useReadContract({
    address: TRECC_VAULT_ADDRESS,
    abi: DASHBOARD_VAULT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: SEPOLIA_CHAIN_ID,
    query: { enabled: !!address, retry: false },
  });

  const { data: lenderDeposit } = useReadContract({
    address: TRECC_VAULT_ADDRESS,
    abi: DASHBOARD_VAULT_ABI,
    functionName: 'lenderDeposits',
    args: address ? [address] : undefined,
    chainId: SEPOLIA_CHAIN_ID,
    query: { enabled: !!address, retry: false },
  });

  const { data: activeLoanExposure } = useReadContract({
    address: TRECC_VAULT_ADDRESS,
    abi: DASHBOARD_VAULT_ABI,
    functionName: 'activeLoans',
    args: address ? [address] : undefined,
    chainId: SEPOLIA_CHAIN_ID,
    query: { enabled: !!address, retry: false },
  });

  const vaultTvl = totalAssets ?? totalPoolLiquidity;
  const suppliedPosition = vaultShares ?? lenderDeposit;
  const suppliedValue = toNumber(suppliedPosition);
  const chartValue = suppliedValue > 0 ? suppliedValue : toNumber(vaultTvl);

  const netProfit = useMemo(() => {
    if (vaultShares === undefined || lenderDeposit === undefined) return null;
    const profit = toNumber(vaultShares) - toNumber(lenderDeposit);
    return Math.max(0, profit);
  }, [vaultShares, lenderDeposit]);

  useEffect(() => {
    setSeries(readStoredSeries(address));
  }, [address]);

  useEffect(() => {
    if (!address || chartValue <= 0) return;
    const nextPoint = { time: Date.now() / 1000, value: chartValue };
    setFallbackPoint(nextPoint);
    setSeries((prev) => {
      const last = prev[prev.length - 1];
      const next = last && Math.abs(last.value - nextPoint.value) < 0.000001
        ? [...prev.slice(0, -1), nextPoint]
        : [...prev, nextPoint];
      const trimmed = next.slice(-240);
      writeStoredSeries(address, trimmed);
      return trimmed;
    });
  }, [address, chartValue]);

  const chartSeries = series.length ? series : (fallbackPoint ? [fallbackPoint] : []);

  return (
    <div className="flex min-h-[calc(100vh-11rem)] w-full flex-col gap-4">
      <div className="flex flex-col gap-4 border-b border-white/[0.06] pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-600">Capital Provider</p>
          <h1 className="mt-2 text-3xl font-medium tracking-tight text-transparent bg-clip-text bg-[linear-gradient(180deg,#ffffff_0%,#ffffff_42%,#8c8c8c_100%)]">
            Lender Dashboard
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4 lg:min-w-[680px]">
          <MarketStat label="Wallet" value={shortAddress(address)} />
          <MarketStat label="Supplied" value={formatUSDC(suppliedPosition)} />
          <MarketStat label="Vault TVL" value={formatUSDC(vaultTvl)} />
          <MarketStat label="Net Profit" value={netProfit === null ? '—' : `$${netProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-h-[560px] overflow-hidden rounded-xl border border-white/[0.06] bg-black">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <div className="flex items-center gap-2">
              <Activity size={15} className="text-zinc-500" />
              <span className="text-sm font-medium text-zinc-200">Live Position</span>
              <span className="text-xs text-zinc-600">USDC</span>
            </div>
            <span className="font-mono text-sm text-zinc-400">
              {chartValue > 0 ? `$${chartValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : 'No position'}
            </span>
          </div>
          <div className="h-[calc(100%-45px)] min-h-[515px]">
            <PortfolioChart data={chartSeries} value={chartValue} />
          </div>
        </section>

        <aside className="grid grid-cols-1 gap-4 lg:grid-rows-2">
          <InfoPanel
            icon={<Database size={15} className="text-zinc-500" />}
            title="Vault"
            rows={[
              ['Contract', shortAddress(TRECC_VAULT_ADDRESS)],
              ['Network', 'Ethereum Sepolia'],
              ['TVL', formatUSDC(vaultTvl)],
            ]}
          />
          <InfoPanel
            icon={<Landmark size={15} className="text-zinc-500" />}
            title="Position"
            rows={[
              ['Wallet', shortAddress(address)],
              ['Supplied', formatUSDC(suppliedPosition)],
              ['Active Exposure', formatUSDC(activeLoanExposure)],
            ]}
          />
        </aside>
      </div>
    </div>
  );
}

function MarketStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l border-white/[0.08] pl-4">
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-600">{label}</p>
      <p className="mt-1 truncate font-mono text-sm text-zinc-100">{value}</p>
    </div>
  );
}

function InfoPanel({
  icon,
  title,
  rows,
}: {
  icon: React.ReactNode;
  title: string;
  rows: Array<[string, string]>;
}) {
  return (
    <section className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
        {icon}
        <h2 className="text-sm font-medium text-zinc-200">{title}</h2>
      </div>
      <div className="divide-y divide-white/[0.05]">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-4 py-3 text-sm">
            <p className="text-zinc-600">{label}</p>
            <p className="max-w-[150px] truncate font-mono text-xs text-zinc-400">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
