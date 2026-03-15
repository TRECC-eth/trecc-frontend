'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { LivelinePoint } from 'liveline';
import { TrendingUp, DollarSign, Percent, Layers, Users } from 'lucide-react';
import { generatePortfolioSeries, MOCK_BORROWER } from '../lib/mock-dashboard-data';
import MetallicCard from './MetallicCard';
import PortfolioChart from './PortfolioChart';

export default function BorrowerDashboard() {
  const initialSeries = useMemo(
    () => generatePortfolioSeries(MOCK_BORROWER.portfolioValue),
    []
  );
  const [data, setData] = useState<LivelinePoint[]>(initialSeries);
  const value = data.length ? data[data.length - 1].value : MOCK_BORROWER.portfolioValue;

  useEffect(() => {
    const id = setInterval(() => {
      setData((prev) => {
        const last = prev[prev.length - 1];
        const newVal = last.value + (Math.random() - 0.48) * last.value * 0.004;
        return [...prev.slice(-59), { time: Date.now() / 1000, value: Math.max(MOCK_BORROWER.portfolioValue * 0.7, newVal) }];
      });
    }, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="w-full h-full min-h-0 grid grid-cols-12 gap-4 grid-rows-[auto_1fr] items-stretch">
      {/* Row 1: Stats */}
      <MetallicCard accent="silver" contentClassName="p-4" className="col-span-12 sm:col-span-6 lg:col-span-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/5 border border-white/10">
            <DollarSign className="text-zinc-300" size={18} />
          </div>
          <div>
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Net Profit</p>
            <p className="text-white text-lg font-medium tabular-nums tracking-tight">${MOCK_BORROWER.netProfit.toLocaleString()}</p>
            <p className="text-emerald-400 text-xs font-medium">+{MOCK_BORROWER.netProfitPercent}%</p>
          </div>
        </div>
      </MetallicCard>
      <MetallicCard accent="silver" contentClassName="p-4" className="col-span-12 sm:col-span-6 lg:col-span-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/5 border border-white/10">
            <Percent className="text-zinc-300" size={18} />
          </div>
          <div>
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">APY</p>
            <p className="text-white text-lg font-medium tabular-nums tracking-tight">{MOCK_BORROWER.apy}%</p>
          </div>
        </div>
      </MetallicCard>
      <MetallicCard accent="silver" contentClassName="p-4" className="col-span-12 sm:col-span-6 lg:col-span-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/5 border border-white/10">
            <DollarSign className="text-zinc-300" size={18} />
          </div>
          <div>
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Portfolio Value</p>
            <p className="text-white text-lg font-medium tabular-nums tracking-tight">${MOCK_BORROWER.portfolioValue.toLocaleString()}</p>
          </div>
        </div>
      </MetallicCard>


      {/* Row 2: Chart (left) + Agents who lent & Protocols (right) */}
      <MetallicCard
        accent="silver"
        contentClassName="p-6 flex flex-col min-h-0"
        className="col-span-12 lg:col-span-8 flex flex-col min-h-0"
      >
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
              <TrendingUp className="text-zinc-400" size={16} />
            </div>
            <span className="text-sm font-medium text-white tracking-wide">Portfolio Value</span>
          </div>
        </div>

        {/* Container for the chart - fixed height prevents layout glitching/expansion */}
        <div className="relative h-[320px] min-h-[320px] shrink-0 rounded-2xl overflow-hidden border border-white/10 bg-black/20">
          <PortfolioChart data={data} value={value} />
        </div>
      </MetallicCard>
      <div className="col-span-12 lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 min-h-0 auto-rows-fr">
        <MetallicCard accent="slate" contentClassName="p-5 flex flex-col min-h-0" className="min-h-0 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
              <Users className="text-zinc-400" size={16} />
            </div>
            <h3 className="text-sm font-medium text-white tracking-wide">Agents Who Lent</h3>
          </div>
          <ul className="space-y-2 overflow-auto min-h-0 flex-1 pr-1">
            {MOCK_BORROWER.agentsLent.map((a) => (
              <li key={a.id} className="flex justify-between items-center py-2 px-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-white/80 font-bold text-[10px]">{a.name.slice(0, 1)}</span>
                  <span className="text-zinc-300 font-medium">{a.name}</span>
                </div>
                <span className="text-zinc-500 tabular-nums">${a.amount.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </MetallicCard>
        <MetallicCard accent="slate" contentClassName="p-5 flex flex-col min-h-0" className="min-h-0 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
              <Layers className="text-zinc-400" size={16} />
            </div>
            <h3 className="text-sm font-medium text-white tracking-wide">Protocols</h3>
          </div>
          <ul className="space-y-2 overflow-auto min-h-0 flex-1 pr-1">
            {MOCK_BORROWER.protocols.map((p) => (
              <li key={p.name} className="flex justify-between items-center py-2 px-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-xs">
                <span className="text-zinc-300 font-medium">{p.name}</span>
                <span className="text-zinc-500 tabular-nums">{p.share}%</span>
              </li>
            ))}
          </ul>
        </MetallicCard>
      </div>
    </div>
  );
}
