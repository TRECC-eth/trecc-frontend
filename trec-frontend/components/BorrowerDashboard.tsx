'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { LivelinePoint } from 'liveline';
import { formatUnits } from 'viem';
import type { Address } from 'viem';
import { useAccount, usePublicClient, useReadContract } from 'wagmi';
import { Activity, Bot, ChevronDown, Network, PieChart, TrendingDown, TrendingUp, X } from 'lucide-react';
import { AGENT_REGISTRY_ADDRESS, TRECC_VAULT_ADDRESS } from '../constants/production-addresses';
import PortfolioChart from './PortfolioChart';

const SEPOLIA_CHAIN_ID = 11155111;
const USDC_DECIMALS = 6;
const SERIES_STORAGE_PREFIX = 'trecc:agent-series:v2:';

const DASHBOARD_VAULT_ABI = [
  { inputs: [], name: 'totalAssets', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'totalPoolLiquidity', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: 'borrower', type: 'address' }], name: 'activeLoans', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
] as const;

const DASHBOARD_REGISTRY_ABI = [
  {
    type: 'event',
    name: 'AgentRegistered',
    inputs: [
      { indexed: true, name: 'agentId', type: 'uint256' },
      { indexed: true, name: 'operator', type: 'address' },
      { indexed: false, name: 'safeAddress', type: 'address' },
      { indexed: false, name: 'turnkeySigner', type: 'address' },
    ],
  },
  {
    inputs: [{ name: '', type: 'uint256' }],
    name: 'agentProfiles',
    outputs: [
      { name: 'operator', type: 'address' },
      { name: 'safeAddress', type: 'address' },
      { name: 'turnkeySigner', type: 'address' },
      { name: 'erc8004Score', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
      { name: 'totalBorrowed', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

type ProtocolAllocation = {
  name: string;
  share: number;
  logo: string;
  color: string;
  apy: string;
  status: string;
};

type AgentNft = {
  id: string;
  name: string;
  tokenId: string;
  safeAddress: string;
  turnkeySigner?: string;
  score?: number;
  isActive?: boolean;
  borrowed: number;
  collateral: number;
  pnlPercent: string;
  protocols: ProtocolAllocation[];
};

type AgentProfileTuple = readonly [Address, Address, Address, bigint, boolean, bigint];

const AGENT_NFTS: AgentNft[] = [
  {
    id: 'agent-742',
    name: 'Elsa Prime',
    tokenId: '#742',
    safeAddress: '0xc1b5...ff41',
    borrowed: 10000,
    collateral: 3000,
    pnlPercent: '+4.8%',
    protocols: [
      { name: 'Aave V3', share: 45, logo: '/aave.png', color: '#d8d8d8', apy: '5.2%', status: 'Active' },
      { name: 'Morpho Blue', share: 30, logo: '/morphos.png', color: '#7c7c7c', apy: '4.8%', status: 'Active' },
      { name: 'Compound V3', share: 25, logo: '/compound.png', color: '#3f3f46', apy: '3.9%', status: 'Watching' },
    ],
  },
  {
    id: 'agent-815',
    name: 'Delta Neutral',
    tokenId: '#815',
    safeAddress: '0x8f21...91c4',
    borrowed: 7200,
    collateral: 2400,
    pnlPercent: '+3.1%',
    protocols: [
      { name: 'Aave V3', share: 25, logo: '/aave.png', color: '#d8d8d8', apy: '5.2%', status: 'Watching' },
      { name: 'Morpho Blue', share: 50, logo: '/morphos.png', color: '#7c7c7c', apy: '4.8%', status: 'Active' },
      { name: 'Compound V3', share: 25, logo: '/compound.png', color: '#3f3f46', apy: '3.9%', status: 'Active' },
    ],
  },
  {
    id: 'agent-903',
    name: 'Basis Scout',
    tokenId: '#903',
    safeAddress: '0xb62d...0a19',
    borrowed: 12800,
    collateral: 4100,
    pnlPercent: '+2.4%',
    protocols: [
      { name: 'Aave V3', share: 35, logo: '/aave.png', color: '#d8d8d8', apy: '5.2%', status: 'Active' },
      { name: 'Morpho Blue', share: 20, logo: '/morphos.png', color: '#7c7c7c', apy: '4.8%', status: 'Watching' },
      { name: 'Compound V3', share: 45, logo: '/compound.png', color: '#3f3f46', apy: '3.9%', status: 'Active' },
    ],
  },
];

function formatUSDC(value?: bigint | null) {
  if (value === undefined || value === null) return '-';
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

function readStoredSeries(address: string | undefined, agentId: string): LivelinePoint[] {
  if (typeof window === 'undefined' || !address) return [];
  try {
    const raw = localStorage.getItem(`${SERIES_STORAGE_PREFIX}${address.toLowerCase()}:${agentId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LivelinePoint[];
    return Array.isArray(parsed) ? parsed.filter((point) => Number.isFinite(point.time) && Number.isFinite(point.value)) : [];
  } catch {
    return [];
  }
}

function writeStoredSeries(address: string | undefined, agentId: string, series: LivelinePoint[]) {
  if (typeof window === 'undefined' || !address) return;
  localStorage.setItem(`${SERIES_STORAGE_PREFIX}${address.toLowerCase()}:${agentId}`, JSON.stringify(series.slice(-1200)));
}

function randomNormal() {
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function seedSeries(value: number): LivelinePoint[] {
  const now = Date.now() / 1000;
  const points = 1200;
  const interval = 8;
  const base = value > 0 ? value : 10000;
  let current = base;
  let driftBias = 0;
  let volatility = base * 0.0014;

  return Array.from({ length: points }, (_, index) => {
    if (index % (45 + Math.floor(Math.random() * 55)) === 0) {
      driftBias = randomNormal() * base * 0.00038;
      volatility = base * (0.0009 + Math.random() * 0.0022);
    }

    const meanReversion = (base - current) * 0.006;
    const shock = randomNormal() * volatility;
    const jump = Math.random() < 0.018 ? randomNormal() * base * 0.008 : 0;
    current = Math.max(base * 0.78, Math.min(base * 1.24, current + driftBias + meanReversion + shock + jump));

    return {
      time: now - (points - index) * interval,
      value: current,
    };
  });
}

function buildProtocols(agentId: bigint): ProtocolAllocation[] {
  const variant = Number(agentId % BigInt(3));
  const mixes = [
    [45, 30, 25],
    [25, 50, 25],
    [35, 20, 45],
  ];
  const [aave, morpho, compound] = mixes[variant];

  return [
    { name: 'Aave V3', share: aave, logo: '/aave.png', color: '#d8d8d8', apy: '5.2%', status: aave >= 35 ? 'Active' : 'Watching' },
    { name: 'Morpho Blue', share: morpho, logo: '/morphos.png', color: '#7c7c7c', apy: '4.8%', status: morpho >= 35 ? 'Active' : 'Watching' },
    { name: 'Compound V3', share: compound, logo: '/compound.png', color: '#3f3f46', apy: '3.9%', status: compound >= 35 ? 'Active' : 'Watching' },
  ];
}

function borrowedFromProfile(profile: AgentProfileTuple) {
  const borrowed = Number(formatUnits(profile[5], USDC_DECIMALS));
  return borrowed > 0 ? borrowed : 10000;
}

export default function BorrowerDashboard() {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: SEPOLIA_CHAIN_ID });
  const [series, setSeries] = useState<LivelinePoint[]>([]);
  const [onChainAgents, setOnChainAgents] = useState<AgentNft[]>([]);
  const [agentLoadState, setAgentLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [selectedAgentId, setSelectedAgentId] = useState(AGENT_NFTS[0].id);
  const [isAllocationOpen, setIsAllocationOpen] = useState(false);
  const lastPersistRef = useRef(0);

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

  const { data: activeLoan } = useReadContract({
    address: TRECC_VAULT_ADDRESS,
    abi: DASHBOARD_VAULT_ABI,
    functionName: 'activeLoans',
    args: address ? [address] : undefined,
    chainId: SEPOLIA_CHAIN_ID,
    query: { enabled: !!address, retry: false },
  });

  useEffect(() => {
    if (!address || !publicClient) {
      setOnChainAgents([]);
      setAgentLoadState('idle');
      setSelectedAgentId(AGENT_NFTS[0].id);
      return;
    }

    const client = publicClient;
    let cancelled = false;
    setAgentLoadState('loading');

    async function loadAgents() {
      try {
        const logs = await client.getLogs({
          address: AGENT_REGISTRY_ADDRESS,
          event: DASHBOARD_REGISTRY_ABI[0],
          args: { operator: address },
          fromBlock: BigInt(0),
          toBlock: 'latest',
        });

        const agents = await Promise.all(
          logs.map(async (log) => {
            const agentId = log.args.agentId ?? BigInt(0);
            const safeAddress = log.args.safeAddress ?? '0x0000000000000000000000000000000000000000';
            const turnkeySigner = log.args.turnkeySigner ?? undefined;
            const profile = await client.readContract({
              address: AGENT_REGISTRY_ADDRESS,
              abi: DASHBOARD_REGISTRY_ABI,
              functionName: 'agentProfiles',
              args: [agentId],
            }) as AgentProfileTuple;
            const borrowed = borrowedFromProfile(profile);

            return {
              id: `onchain-${agentId.toString()}`,
              name: `Agent NFT #${agentId.toString()}`,
              tokenId: `#${agentId.toString()}`,
              safeAddress: shortAddress(safeAddress),
              turnkeySigner: turnkeySigner ? shortAddress(turnkeySigner) : undefined,
              score: Number(profile[3]),
              isActive: profile[4],
              borrowed,
              collateral: borrowed * 0.3,
              pnlPercent: profile[4] ? '+0.0%' : 'Paused',
              protocols: buildProtocols(agentId),
            };
          })
        );

        if (cancelled) return;
        setOnChainAgents(agents);
        setAgentLoadState('ready');
        setSelectedAgentId(agents.length ? agents[0].id : AGENT_NFTS[0].id);
      } catch {
        if (cancelled) return;
        setOnChainAgents([]);
        setAgentLoadState('error');
      }
    }

    loadAgents();
    return () => {
      cancelled = true;
    };
  }, [address, publicClient]);

  const agentOptions = onChainAgents.length ? onChainAgents : AGENT_NFTS;
  const selectedAgent = agentOptions.find((agent) => agent.id === selectedAgentId) ?? agentOptions[0];
  const vaultTvl = totalAssets ?? totalPoolLiquidity;
  const liveBorrowedValue = toNumber(activeLoan);
  const borrowedValue = selectedAgent.id === AGENT_NFTS[0].id && liveBorrowedValue > 0 ? liveBorrowedValue : selectedAgent.borrowed;
  const chartValue = borrowedValue > 0 ? borrowedValue : selectedAgent.borrowed;
  const collateralValue = selectedAgent.collateral;
  const portfolioFloor = Math.max(0, chartValue - collateralValue);

  useEffect(() => {
    const stored = readStoredSeries(address, selectedAgent.id);
    queueMicrotask(() => setSeries(stored.length ? stored : seedSeries(chartValue)));
  }, [address, selectedAgent.id, chartValue]);

  useEffect(() => {
    if (!address) return;
    const id = window.setInterval(() => {
      const anchor = chartValue > 0 ? chartValue : 10000;
      setSeries((prev) => {
        const base = prev.length ? prev : seedSeries(chartValue);
        const lastValue = base[base.length - 1]?.value ?? anchor;
        const meanReversion = (anchor - lastValue) * 0.006;
        const movement = randomNormal() * anchor * 0.00032;
        const microJump = Math.random() < 0.04 ? randomNormal() * anchor * 0.0014 : 0;
        const nextValue = Math.max(anchor * 0.78, Math.min(anchor * 1.24, lastValue + meanReversion + movement + microJump));
        const now = Date.now() / 1000;
        const lastPoint = base[base.length - 1];
        const shouldAppendPoint = !lastPoint || now - lastPoint.time >= 3;
        const nextPoint = { time: shouldAppendPoint ? now : lastPoint.time, value: nextValue };
        const next = shouldAppendPoint
          ? [...base, nextPoint].slice(-1200)
          : [...base.slice(0, -1), nextPoint];

        if (Date.now() - lastPersistRef.current > 2000) {
          lastPersistRef.current = Date.now();
          writeStoredSeries(address, selectedAgent.id, next);
        }
        return next;
      });
    }, 650);
    return () => window.clearInterval(id);
  }, [address, selectedAgent.id, chartValue]);

  const chartSeries = series;
  const graphValue = chartSeries.length ? chartSeries[chartSeries.length - 1].value : chartValue;
  const dynamicNetProfit = chartSeries.length > 1 ? graphValue - chartSeries[0].value : chartValue * 0.064;
  const netProfitLabel = `${dynamicNetProfit >= 0 ? '+' : '-'}$${Math.abs(dynamicNetProfit).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  const protocolAllocations = selectedAgent.protocols.map((protocol) => ({
    ...protocol,
    amount: chartValue * (protocol.share / 100),
  }));
  const mintedAgents = agentOptions.map((agent) => ({
    name: agent.name,
    address: agent.safeAddress,
    allocation: agent.borrowed,
    pnl: agent.pnlPercent,
    tokenId: agent.tokenId,
  }));

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex shrink-0 flex-col gap-4 border-b border-white/[0.06] pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="mt-2 text-3xl font-medium tracking-tight text-transparent bg-clip-text bg-[linear-gradient(180deg,#ffffff_0%,#ffffff_42%,#8c8c8c_100%)]">
            Agent Dashboard
          </h1>
          <div className="relative mt-3 w-full max-w-[320px]">
            <select
              value={selectedAgentId}
              onChange={(event) => setSelectedAgentId(event.target.value)}
              className="h-10 w-full appearance-none rounded-lg border border-white/[0.08] bg-black px-3 pr-10 font-mono text-xs text-zinc-200 outline-none transition-colors hover:border-white/[0.16] focus:border-white/[0.22]"
            >
              {agentOptions.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} NFT {agent.tokenId}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          </div>
          <p className="mt-2 font-mono text-[11px] text-zinc-600">
            {agentLoadState === 'loading'
              ? 'Loading minted NFTs from registry...'
              : onChainAgents.length
                ? `${onChainAgents.length} on-chain agent NFT${onChainAgents.length === 1 ? '' : 's'} found`
                : 'No on-chain agent found for this wallet, showing demo agents'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4 lg:min-w-[680px]">
          <MarketStat label="Wallet" value={shortAddress(address)} />
          <MarketStat label="Minted NFTs" value={`${onChainAgents.length || agentOptions.length} agents`} />
          <MarketStat label="Borrowed" value={`$${chartValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
          <MarketStat label="Net Profit" value={netProfitLabel} tone={dynamicNetProfit >= 0 ? 'positive' : 'negative'} showTrend />
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
          <ProtocolPanel allocations={protocolAllocations} onOpenDetails={() => setIsAllocationOpen(true)} />
          <AgentPanel
            agents={mintedAgents}
            registry={shortAddress(AGENT_REGISTRY_ADDRESS)}
            floor={`$${portfolioFloor.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
            selectedAgent={selectedAgent}
            vaultTvl={formatUSDC(vaultTvl)}
          />
        </aside>
      </div>

      {isAllocationOpen ? (
        <AllocationModal
          agent={selectedAgent}
          allocations={protocolAllocations}
          total={chartValue}
          onClose={() => setIsAllocationOpen(false)}
        />
      ) : null}
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
  onOpenDetails,
}: {
  allocations: Array<ProtocolAllocation & { amount: number }>;
  onOpenDetails: () => void;
}) {
  const totalShare = allocations.reduce((sum, allocation) => sum + allocation.share, 0);

  return (
    <section className="min-h-0 overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <Network size={15} className="text-zinc-500" />
          <h2 className="text-sm font-medium text-zinc-200">Protocol Routing</h2>
        </div>
        <button
          type="button"
          onClick={onOpenDetails}
          className="flex h-7 items-center gap-1.5 rounded-md border border-white/[0.08] bg-black/35 px-2 font-mono text-[10px] text-zinc-400 transition-colors hover:border-white/[0.16] hover:text-zinc-100"
        >
          <PieChart size={12} />
          Details
        </button>
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
              <div className="shrink-0 text-right">
                <p className="font-mono text-[11px] text-zinc-500">{formatPercent(allocation.share)}</p>
                <p className="font-mono text-[10px] text-zinc-700">{allocation.apy}</p>
              </div>
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
  floor,
  selectedAgent,
  vaultTvl,
}: {
  agents: Array<{ name: string; address: string; allocation: number; pnl: string; tokenId: string }>;
  registry: string;
  floor: string;
  selectedAgent: AgentNft;
  vaultTvl: string;
}) {
  return (
    <section className="min-h-0 rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot size={15} className="text-zinc-500" />
          <h2 className="text-sm font-medium text-zinc-200">Minted Agent NFTs</h2>
        </div>
        <span className="font-mono text-[11px] text-zinc-600">{registry}</span>
      </div>
      <div className="space-y-2 p-4">
        {agents.map((agent, index) => (
          <div
            key={agent.address}
            className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border px-3 py-2 ${
              agent.tokenId === selectedAgent.tokenId
                ? 'border-white/[0.14] bg-white/[0.06]'
                : 'border-white/[0.06] bg-black/30'
            }`}
          >
            <span className="font-mono text-[11px] text-zinc-600">{String(index + 1).padStart(2, '0')}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-xs font-medium text-zinc-300">{agent.name}</p>
                <span className="font-mono text-[10px] text-zinc-600">{agent.tokenId}</span>
              </div>
              <p className="mt-1 font-mono text-[11px] text-zinc-500">
                {agent.address} / ${agent.allocation.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>
            <span className="font-mono text-xs text-emerald-400">{agent.pnl}</span>
          </div>
        ))}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="border border-white/[0.06] bg-black/30 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-600">Portfolio Floor</p>
            <p className="mt-1 truncate font-mono text-xs text-zinc-300">{floor}</p>
          </div>
          <div className="border border-white/[0.06] bg-black/30 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-600">Capital Source</p>
            <p className="mt-1 truncate font-mono text-xs text-zinc-300">{vaultTvl}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function AllocationModal({
  agent,
  allocations,
  total,
  onClose,
}: {
  agent: AgentNft;
  allocations: Array<ProtocolAllocation & { amount: number }>;
  total: number;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-white/[0.08] bg-[#050505] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-600">Protocol Allocation</p>
            <h2 className="mt-1 truncate text-lg font-medium text-zinc-100">
              {agent.name} {agent.tokenId}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/[0.08] text-zinc-500 transition-colors hover:border-white/[0.16] hover:text-zinc-100"
            aria-label="Close allocation details"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-5">
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ModalStat label="Safe" value={agent.safeAddress} />
            <ModalStat label="Borrowed" value={`$${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
            <ModalStat label="Collateral" value={`$${agent.collateral.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
            <ModalStat label="P/L" value={agent.pnlPercent} tone="positive" />
          </div>

          <div className="flex h-2 overflow-hidden bg-white/[0.05]">
            {allocations.map((allocation) => (
              <span
                key={allocation.name}
                className="h-full border-r border-black last:border-r-0"
                style={{ width: `${allocation.share}%`, background: allocation.color }}
              />
            ))}
          </div>

          <div className="mt-4 divide-y divide-white/[0.06] border border-white/[0.06] bg-black/25">
            {allocations.map((allocation) => (
              <div key={allocation.name} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Image src={allocation.logo} alt="" width={22} height={22} className="h-[22px] w-[22px] shrink-0 object-contain" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-200">{allocation.name}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-zinc-600">{allocation.status} / APY {allocation.apy}</p>
                  </div>
                </div>
                <span className="font-mono text-xs text-zinc-500">{formatPercent(allocation.share)}</span>
                <span className="font-mono text-sm text-zinc-200">
                  ${allocation.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModalStat({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'positive';
}) {
  return (
    <div className="border border-white/[0.06] bg-black/30 px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-600">{label}</p>
      <p className={`mt-1 truncate font-mono text-xs ${tone === 'positive' ? 'text-emerald-400' : 'text-zinc-300'}`}>{value}</p>
    </div>
  );
}
