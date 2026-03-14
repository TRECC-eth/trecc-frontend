'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Liveline } from 'liveline';
import { ArrowLeft, TrendingUp, Percent, Wallet, Bot, Layers } from 'lucide-react';

// Generate initial portfolio history (last 24h in 5-min steps) + live value
function usePortfolioData(initialValue: number) {
  const [data, setData] = useState<{ time: number; value: number }[]>(() => {
    const now = Math.floor(Date.now() / 1000);
    const points: { time: number; value: number }[] = [];
    let v = initialValue * 0.92;
    for (let i = 24 * 12; i >= 0; i--) {
      const t = now - i * 300;
      v = v + (Math.random() - 0.48) * initialValue * 0.002;
      points.push({ time: t, value: Math.max(initialValue * 0.85, v) });
    }
    return points;
  });
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const drift = (Math.random() - 0.48) * initialValue * 0.0015;
      setValue((prev) => {
        const next = Math.max(initialValue * 0.88, prev + drift);
        setData((d) => [...d.slice(-500), { time: now, value: next }]);
        return next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [initialValue]);

  return { data, value };
}

const MOCK_AGENTS = [
  { name: 'sky.eth', amount: '$45,000', protocol: 'TRECC' },
  { name: 'dex-agent.eth', amount: '$32,000', protocol: 'TRECC' },
  { name: 'arb-bot.eth', amount: '$18,500', protocol: 'TRECC' },
];
const MOCK_PROTOCOLS = ['TRECC', 'Base', 'ERC-8004'];

export default function LenderDashboard() {
  const initialPortfolio = 95600;
  const { data, value } = usePortfolioData(initialPortfolio);
  const netProfit = 4200;
  const apy = 10.4;

  const cardStyle =
    'rounded-2xl border border-white/10 bg-black/80 backdrop-blur-sm p-5 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.1)]';
  const sectionStyle =
    'rounded-2xl border border-white/10 bg-black/80 backdrop-blur-sm p-6 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.1)]';

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Metallic background — neutral grey only, no blue */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-neutral-900/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-[50%] bg-gradient-to-t from-neutral-950/60 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.04),transparent)]" />
      </div>

      <div className="relative z-10 p-4 md:p-8 max-w-6xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-white mb-8 transition-colors font-medium"
        >
          <ArrowLeft size={18} /> Back to home
        </Link>

        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-200 to-neutral-500">
            Lender Dashboard
          </h1>
          <p className="text-neutral-500 mt-1">Portfolio performance and allocation</p>
        </header>

        {/* KPI cards — glossy metallic panels matching navbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Portfolio Value', value: `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, icon: Wallet },
            { label: 'Net Profit', value: `+$${netProfit.toLocaleString()}`, icon: TrendingUp },
            { label: 'APY', value: `${apy}%`, icon: Percent },
            { label: 'Active Agents', value: String(MOCK_AGENTS.length), icon: Bot },
          ].map(({ label, value: val, icon: Icon }) => (
            <div key={label} className={cardStyle}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{label}</span>
                <Icon className="text-neutral-500" size={18} />
              </div>
              <p className="text-xl md:text-2xl font-bold text-white tabular-nums drop-shadow-sm">{val}</p>
            </div>
          ))}
        </div>

        {/* Portfolio value chart — Liveline with silver/metallic line */}
        <section className={`${sectionStyle} mb-8`}>
          <h2 className="text-lg font-semibold text-neutral-200 mb-4">Portfolio Value</h2>
          <div className="h-[280px] rounded-xl overflow-hidden bg-black/50 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <Liveline
              data={data}
              value={value}
              theme="dark"
              color="#e2e8f0"
              formatValue={(v) => `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
              showValue
              momentum
              grid
              fill
              window={30}
              windows={[
                { label: '24h', secs: 86400 },
                { label: '7d', secs: 604800 },
                { label: '30d', secs: 2592000 },
              ]}
              windowStyle="rounded"
            />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className={sectionStyle}>
            <h2 className="text-lg font-semibold text-neutral-200 mb-4 flex items-center gap-2">
              <Bot size={20} /> Agents funded
            </h2>
            <ul className="space-y-3">
              {MOCK_AGENTS.map((agent) => (
                <li
                  key={agent.name}
                  className="flex items-center justify-between py-3 px-4 rounded-xl bg-neutral-900/60 border border-white/10"
                >
                  <span className="font-mono text-white">{agent.name}</span>
                  <span className="text-neutral-400 text-sm">{agent.amount}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className={sectionStyle}>
            <h2 className="text-lg font-semibold text-neutral-200 mb-4 flex items-center gap-2">
              <Layers size={20} /> Protocols
            </h2>
            <div className="flex flex-wrap gap-3">
              {MOCK_PROTOCOLS.map((p) => (
                <span
                  key={p}
                  className="px-4 py-2 rounded-full bg-neutral-900/80 border border-white/10 text-neutral-200 font-medium"
                >
                  {p}
                </span>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
