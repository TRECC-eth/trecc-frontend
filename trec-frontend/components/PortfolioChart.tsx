'use client';

import React, { useState, useMemo } from 'react';
import { Liveline } from 'liveline';
import type { LivelinePoint } from 'liveline';

const CHART_PAD_LEFT = 16;
const CHART_PAD_RIGHT = 64;

const COLOR_UP = '#22c55e';
const COLOR_DOWN = '#ef4444';
const COLOR_NEUTRAL = '#ffffff';

const TREND_THRESHOLD_PCT = 0.05;

const WINDOWS = [
  { label: '1H', secs: 3600 },
  { label: '24H', secs: 86400 },
  { label: '7D', secs: 604800 },
];

interface PortfolioChartProps {
  data: LivelinePoint[];
  value: number;
}

function formatTimeLabel(t: number, windowSecs: number): string {
  if (windowSecs >= 86400) {
    return new Date(t * 1000).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }
  return new Date(t * 1000).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export default function PortfolioChart({ data, value }: PortfolioChartProps) {
  const [activeWindowSecs, setActiveWindowSecs] = useState(WINDOWS[0].secs);

  const lineColor = useMemo(() => {
    if (!data.length || data.length < 2) return COLOR_NEUTRAL;
    const curr = data[data.length - 1].value;
    const prevIdx = Math.max(0, data.length - 6);
    const prev = data[prevIdx].value;
    const pct = prev ? ((curr - prev) / prev) * 100 : 0;
    if (pct > TREND_THRESHOLD_PCT) return COLOR_UP;
    if (pct < -TREND_THRESHOLD_PCT) return COLOR_DOWN;
    return COLOR_NEUTRAL;
  }, [data]);

  const xAxisLabels = useMemo(() => {
    if (!data.length) return [];
    const latestTime = data[data.length - 1].time;
    const startTime = latestTime - activeWindowSecs;
    const labels: string[] = [];
    const numLabels = 5;
    for (let i = 0; i < numLabels; i++) {
      const t = startTime + (i / Math.max(1, numLabels - 1)) * activeWindowSecs;
      labels.push(formatTimeLabel(t, activeWindowSecs));
    }
    return labels;
  }, [data, activeWindowSecs]);

  return (
    <div className="relative w-full h-full">
      <Liveline
        data={data}
        value={value}
        theme="dark"
        color={lineColor}
        fill
        momentum
        showValue
        valueMomentumColor={false}
        grid
        badge
        badgeVariant="minimal"
        scrub
        windows={WINDOWS}
        onWindowChange={setActiveWindowSecs}
        windowStyle="rounded"
        formatValue={(v) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        padding={{ top: 24, right: CHART_PAD_RIGHT, bottom: 36, left: CHART_PAD_LEFT }}
        className="w-full h-full"
      />
      {/* Custom x-axis overlay - Liveline's built-in time axis is erased by its left-edge fade */}
      <div
        className="absolute bottom-0 left-0 right-0 flex justify-between items-end pointer-events-none"
        style={{
          paddingLeft: CHART_PAD_LEFT,
          paddingRight: CHART_PAD_RIGHT,
          paddingBottom: 10,
          height: 50,
        }}
      >
        {xAxisLabels.map((label, i) => (
          <span
            key={`${label}-${i}`}
            className="text-[10px] text-white/80 tabular-nums font-mono"
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
