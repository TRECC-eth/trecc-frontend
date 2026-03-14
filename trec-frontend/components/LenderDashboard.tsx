'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Liveline } from 'liveline';
import type { LivelinePoint } from 'liveline';
import { TrendingUp, DollarSign, Percent, Layers, Bot, Sparkles } from 'lucide-react';
import { generatePortfolioSeries, MOCK_LENDER } from '../lib/mock-dashboard-data';
import LenderVault from './LenderVault';
import MetallicCard from './MetallicCard';

const SILVER = '#cbd5e1'; // slate-300 for chart line

export default function LenderDashboard() {
  const initialSeries = useMemo(
    () => generatePortfolioSeries(MOCK_LENDER.portfolioValue),
    []
  );
  const [data, setData] = useState<LivelinePoint[]>(initialSeries);
  const value = data.length ? data[data.length - 1].value : MOCK_LENDER.portfolioValue;

  useEffect(() => {
    const id = setInterval(() => {
      setData((prev) => {
        const last = prev[prev.length - 1];
        const newVal = last.value + (Math.random() - 0.48) * last.value * 0.004;
        return [...prev.slice(-59), { time: Date.now() / 1000, value: Math.max(MOCK_LENDER.portfolioValue * 0.7, newVal) }];
      });
    }, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="w-full h-full min-h-0 grid grid-cols-12 gap-4 grid-rows-[auto_1fr] items-stretch">
      {/* Row 1: Stats - 4 cards */}
      <MetallicCard accent="silver" contentClassName="p-4" className="col-span-12 sm:col-span-6 lg:col-span-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-black border-2 border-white/50">
            <DollarSign className="text-slate-300" size={18} />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-medium">Net Profit</p>
            <p className="text-white text-lg font-semibold tabular-nums tracking-tight">${MOCK_LENDER.netProfit.toLocaleString()}</p>
            <p className="text-slate-400 text-xs font-medium">+{MOCK_LENDER.netProfitPercent}%</p>
          </div>
        </div>
      </MetallicCard>
      <MetallicCard accent="silver" contentClassName="p-4" className="col-span-12 sm:col-span-6 lg:col-span-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-black border-2 border-white/50">
            <Percent className="text-slate-300" size={18} />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-medium">APY</p>
            <p className="text-white text-lg font-semibold tabular-nums tracking-tight">{MOCK_LENDER.apy}%</p>
          </div>
        </div>
      </MetallicCard>
      <MetallicCard accent="silver" contentClassName="p-4" className="col-span-12 sm:col-span-6 lg:col-span-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-black border-2 border-white/50">
            <DollarSign className="text-slate-300" size={18} />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-medium">Portfolio Value</p>
            <p className="text-white text-lg font-semibold tabular-nums tracking-tight">${MOCK_LENDER.portfolioValue.toLocaleString()}</p>
          </div>
        </div>
      </MetallicCard>

      {/* Row 2: Chart (left) + Protocols & Agents (right) */}
      <MetallicCard
        accent="silver"
        contentClassName="p-5 flex flex-col min-h-0"
        className="col-span-12 lg:col-span-8 flex flex-col min-h-0"
      >
        <div className="flex items-center justify-between mb-2 shrink-0">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-slate-400" size={18} />
            <span className="text-sm font-medium text-white">Portfolio Value</span>
          </div>
        </div>

        {/* Container for the chart */}
        <div className="relative p-5 flex-1 min-h-[300px] rounded-lg overflow-hidden border-2 border-white/40 bg-black">
          <Liveline
            data={data}
            value={value}
            theme="dark"
            color={SILVER}
            fill
            momentum
            showValue
            valueMomentumColor={false}
            grid
            badge
            badgeVariant="minimal"
            scrub
            windows={[
              { label: '1H', secs: 3600 },
              { label: '24H', secs: 86400 },
              { label: '7D', secs: 604800 },
            ]}
            windowStyle="rounded"
            formatValue={(v) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            padding={{ top: 16, right: 64, bottom: 20, left: 0 }}
            className="w-full h-full"
          />
        </div>
      </MetallicCard>
      <div className="col-span-12 lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 min-h-0 auto-rows-fr">
        <MetallicCard accent="slate" contentClassName="p-4 flex flex-col min-h-0" className="min-h-0 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="text-slate-400" size={16} />
            <h3 className="text-sm font-medium text-white">Protocols</h3>
          </div>
          <ul className="space-y-2 overflow-auto min-h-0 flex-1">
            {MOCK_LENDER.protocols.map((p) => (
              <li key={p.name} className="flex justify-between items-center py-1.5 px-2.5 rounded-lg bg-black border-2 border-white/40 text-xs">
                <span className="text-slate-300">{p.name}</span>
                <span className="text-slate-400 tabular-nums">{p.share}% · ${p.tvl.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </MetallicCard>
        <MetallicCard accent="slate" contentClassName="p-4 flex flex-col min-h-0" className="min-h-0 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="text-slate-400" size={16} />
            <h3 className="text-sm font-medium text-white">Agents Borrowed</h3>
          </div>
          <ul className="space-y-2 overflow-auto min-h-0 flex-1">
            {MOCK_LENDER.agentsBorrowed.map((a) => (
              <li key={a.id} className="flex justify-between items-center py-1.5 px-2.5 rounded-lg bg-black border-2 border-white/40 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-black border-2 border-white/50 flex items-center justify-center text-white/80 font-bold text-[10px]">{a.name.slice(0, 1)}</span>
                  <span className="text-slate-300">{a.name}</span>
                </div>
                <span className="text-slate-400 tabular-nums">${a.amount.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </MetallicCard>
      </div>
    </div>
  );
}
