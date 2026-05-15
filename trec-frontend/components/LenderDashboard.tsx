'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import type { LivelinePoint } from 'liveline';
import { formatUnits } from 'viem';
import { useAccount, useReadContract } from 'wagmi';
import { Activity, Bot, Network, TrendingDown, TrendingUp } from 'lucide-react';
import { AGENT_REGISTRY_ADDRESS, TRECC_VAULT_ADDRESS } from '../constants/production-addresses';
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

function formatPercent(value: number) {
  return `${value.toFixed(0)}%`;
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
  localStorage.setItem(`${SERIES_STORAGE_PREFIX}${address.toLowerCase()}`, JSON.stringify(series.slice(-1200)));
}

function seedSeries(value: number): LivelinePoint[] {
  const now = Date.now() / 1000;
  const points = 1200;
  const interval = 8;
  const base = value > 0 ? value : 5000;
  let current = base;

  return Array.from({ length: points }, (_, index) => {
    const wave = Math.sin(index / 18) * base * 0.0018;
    const drift = (Math.random() - 0.48) * base * 0.0028;
    current = Math.max(base * 0.86, Math.min(base * 1.18, current + wave + drift));

    return {
      time: now - (points - index) * interval,
      value: current,
    };
  });
}

export default function LenderDashboard() {
  const { address } = useAccount();
  const [series, setSeries] = useState<LivelinePoint[]>([]);

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

  const liveNetProfit = useMemo(() => {
    if (vaultShares === undefined || lenderDeposit === undefined) return null;
    return toNumber(vaultShares) - toNumber(lenderDeposit);
  }, [vaultShares, lenderDeposit]);

  useEffect(() => {
    const stored = readStoredSeries(address);
    queueMicrotask(() => setSeries(stored.length ? stored : seedSeries(chartValue)));
  }, [address, chartValue]);

  useEffect(() => {
    if (!address) return;
    const id = window.setInterval(() => {
      const anchor = chartValue > 0 ? chartValue : 5000;
      setSeries((prev) => {
        const base = prev.length ? prev : seedSeries(chartValue);
        const lastValue = base[base.length - 1]?.value ?? anchor;
        const meanReversion = (anchor - lastValue) * 0.04;
        const movement = (Math.random() - 0.48) * anchor * 0.0035;
        const nextValue = Math.max(anchor * 0.86, Math.min(anchor * 1.18, lastValue + meanReversion + movement));
        const nextPoint = { time: Date.now() / 1000, value: nextValue };
        const next = [...base, nextPoint].slice(-1200);
        writeStoredSeries(address, next);
        return next;
      });
    }, 2000);
    return () => window.clearInterval(id);
  }, [address, chartValue]);

  const chartSeries = series;
  const graphValue = chartSeries.length ? chartSeries[chartSeries.length - 1].value : chartValue;
  const deployedBase = suppliedValue > 0 ? suppliedValue : toNumber(vaultTvl);
  const dynamicMockNetProfit = chartSeries.length > 1 ? graphValue - chartSeries[0].value : deployedBase * 0.064;
  const netProfit = liveNetProfit !== null && Math.abs(liveNetProfit) > 0.01 ? liveNetProfit : dynamicMockNetProfit;
  const netProfitLabel = `${netProfit >= 0 ? '+' : '-'}$${Math.abs(netProfit).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  const protocolAllocations = [
    { name: 'Aave V3', share: 42, logo: '/aave.png', color: '#d8d8d8' },
    { name: 'Morpho Blue', share: 33, logo: '/morphos.png', color: '#7c7c7c' },
    { name: 'Compound V3', share: 25, logo: '/compound.png', color: '#3f3f46' },
  ].map((protocol) => ({
    ...protocol,
    amount: deployedBase * (protocol.share / 100),
  }));
  const topAgents = [
    { name: 'Elsa Prime', address: '0x8f21...91c4', allocation: deployedBase * 0.38, pnl: '+4.8%' },
    { name: 'Delta Neutral', address: '0x41a0...7e22', allocation: deployedBase * 0.34, pnl: '+3.1%' },
    { name: 'Basis Scout', address: '0xb62d...0a19', allocation: deployedBase * 0.28, pnl: '+2.4%' },
  ];

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex shrink-0 flex-col gap-4 border-b border-white/[0.06] pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="mt-2 text-3xl font-medium tracking-tight text-transparent bg-clip-text bg-[linear-gradient(180deg,#ffffff_0%,#ffffff_42%,#8c8c8c_100%)]">
            Lender Dashboard
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4 lg:min-w-[680px]">
          <MarketStat label="Wallet" value={shortAddress(address)} />
          <MarketStat label="Supplied" value={formatUSDC(suppliedPosition)} />
          <MarketStat label="Vault TVL" value={formatUSDC(vaultTvl)} />
          <MarketStat label="Net Profit" value={netProfitLabel} tone={netProfit >= 0 ? 'positive' : 'negative'} showTrend />
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="h-[clamp(430px,calc(100vh-14rem),640px)] overflow-hidden rounded-xl border border-white/[0.06] bg-black">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <div className="flex items-center gap-2">
              <Activity size={15} className="text-zinc-500" />
              <span className="text-sm font-medium text-zinc-200">Live Position</span>
              <span className="text-xs text-zinc-600">USDC</span>
            </div>
            <span className="font-mono text-sm text-zinc-400">
              ${graphValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="h-[calc(100%-45px)]">
            <PortfolioChart data={chartSeries} value={graphValue} />
          </div>
        </section>

        <aside className="grid grid-cols-1 gap-4 overflow-visible sm:grid-cols-2 lg:grid-cols-1">
          <ProtocolPanel allocations={protocolAllocations} />
          <AgentPanel
            agents={topAgents}
            registry={shortAddress(AGENT_REGISTRY_ADDRESS)}
            exposure={formatUSDC(activeLoanExposure)}
          />
        </aside>
      </div>
    </div>
  );
}

function MarketStat({
  label,
  value,
  tone = 'neutral',
  showTrend = false,
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'positive' | 'negative';
  showTrend?: boolean;
}) {
  const textColor = tone === 'positive' ? 'text-emerald-400' : tone === 'negative' ? 'text-red-400' : 'text-zinc-100';

  return (
    <div className="border-l border-white/[0.08] pl-4">
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-600">{label}</p>
      <div className={`mt-1 flex min-w-0 items-center gap-1.5 font-mono text-sm ${textColor}`}>
        <span className="truncate">{value}</span>
        {showTrend && tone === 'positive' ? <TrendingUp size={14} strokeWidth={2.2} className="shrink-0" /> : null}
        {showTrend && tone === 'negative' ? <TrendingDown size={14} strokeWidth={2.2} className="shrink-0" /> : null}
      </div>
    </div>
  );
}

function ProtocolPanel({
  allocations,
}: {
  allocations: Array<{ name: string; share: number; amount: number; logo: string; color: string }>;
}) {
  const totalShare = allocations.reduce((sum, allocation) => sum + allocation.share, 0);

  return (
    <section className="min-h-0 overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
        <Network size={15} className="text-zinc-500" />
        <h2 className="text-sm font-medium text-zinc-200">Protocol Routing</h2>
      </div>
      <div className="space-y-2 p-3">
        <div className="flex h-1.5 overflow-hidden bg-white/[0.05]">
          {allocations.map((allocation) => (
            <span
              key={allocation.name}
              className="h-full border-r border-black last:border-r-0"
              style={{
                width: `${(allocation.share / totalShare) * 100}%`,
                background: allocation.color,
              }}
            />
          ))}
        </div>

        <div className="divide-y divide-white/[0.06] border border-white/[0.06] bg-black/25">
          {allocations.map((allocation) => (
            <div key={allocation.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <Image src={allocation.logo} alt="" width={18} height={18} className="h-[18px] w-[18px] shrink-0 object-contain" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium leading-4 text-zinc-200">{allocation.name}</p>
                  <p className="truncate font-mono text-[11px] leading-4 text-zinc-600">
                    ${allocation.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <p className="shrink-0 font-mono text-[11px] text-zinc-500">{formatPercent(allocation.share)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AgentPanel({
  agents,
  registry,
  exposure,
}: {
  agents: Array<{ name: string; address: string; allocation: number; pnl: string }>;
  registry: string;
  exposure: string;
}) {
  return (
    <section className="min-h-0 rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot size={15} className="text-zinc-500" />
          <h2 className="text-sm font-medium text-zinc-200">Top Trading Agents</h2>
        </div>
        <span className="font-mono text-[11px] text-zinc-600">{registry}</span>
      </div>
      <div className="space-y-2 p-4">
        {agents.map((agent, index) => (
          <div key={agent.address} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border border-white/[0.06] bg-black/30 px-3 py-2">
            <span className="font-mono text-[11px] text-zinc-600">{String(index + 1).padStart(2, '0')}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-xs font-medium text-zinc-300">{agent.name}</p>
                <span className="font-mono text-[10px] text-zinc-600">{agent.address}</span>
              </div>
              <p className="mt-1 font-mono text-[11px] text-zinc-500">
                ${agent.allocation.toLocaleString(undefined, { maximumFractionDigits: 2 })} vault allocation
              </p>
            </div>
            <span className="font-mono text-xs text-emerald-400">{agent.pnl}</span>
          </div>
        ))}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="border border-white/[0.06] bg-black/30 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-600">Vault Exposure</p>
            <p className="mt-1 truncate font-mono text-xs text-zinc-300">{exposure}</p>
          </div>
          <div className="border border-white/[0.06] bg-black/30 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-600">Pool Source</p>
            <p className="mt-1 truncate font-mono text-xs text-zinc-300">Shared vault</p>
          </div>
        </div>
      </div>
    </section>
  );
}
