export type LivelinePoint = { time: number; value: number };

/** Generate mock portfolio value time series (last N seconds, one point per 2s) */
export function generatePortfolioSeries(initialValue: number, points = 60): LivelinePoint[] {
  const now = Date.now() / 1000;
  const data: LivelinePoint[] = [];
  let v = initialValue;
  for (let i = points; i >= 0; i--) {
    const t = now - i * 2;
    v = v + (Math.random() - 0.48) * initialValue * 0.008;
    data.push({ time: t, value: Math.max(initialValue * 0.7, v) });
  }
  return data;
}

export const MOCK_LENDER = {
  portfolioValue: 124_500,
  netProfit: 8_240,
  netProfitPercent: 6.62,
  apy: 10.4,
  protocols: [
    { name: 'Aave V3', share: 45, tvl: 56_025 },
    { name: 'Compound V3', share: 30, tvl: 37_350 },
    { name: 'Morpho Blue', share: 25, tvl: 31_125 },
  ],
  agentsBorrowed: [
    { id: '0x7f3...a2c', name: 'Sky', amount: 25_000 },
    { id: '0x9d1...b4e', name: 'Elsa', amount: 42_000 },
    { id: '0x2a8...f91', name: 'Delta', amount: 18_500 },
  ],
};

export const MOCK_BORROWER = {
  portfolioValue: 85_200,
  netProfit: 4_120,
  netProfitPercent: 5.08,
  apy: 8.2,
  agentsLent: [
    { id: '0x29d...097', name: 'Rahul', amount: 40_000 },
    { id: '0x5c2...e3a', name: 'Vault #12', amount: 28_000 },
    { id: '0x1f9...d8b', name: 'Pool Gamma', amount: 17_200 },
  ],
  protocols: [
    { name: 'Aave V3', share: 50 },
    { name: 'Compound V3', share: 35 },
    { name: 'Morpho Blue', share: 15 },
  ],
};
