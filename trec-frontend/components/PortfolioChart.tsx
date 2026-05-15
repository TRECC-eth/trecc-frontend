'use client';

import React, { useMemo, useState } from 'react';
import type { LivelinePoint } from 'liveline';

const WINDOWS = [
  { label: '1H', secs: 3600 },
  { label: '24H', secs: 86400 },
  { label: '7D', secs: 604800 },
];

const SVG_WIDTH = 960;
const SVG_HEIGHT = 420;
const PAD = { top: 28, right: 86, bottom: 44, left: 24 };

type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

interface PortfolioChartProps {
  data: LivelinePoint[];
  value: number;
}

function formatCurrency(v: number) {
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
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
    hour12: false,
  });
}

function buildCandles(points: LivelinePoint[]): Candle[] {
  if (points.length < 2) return [];

  const targetCandles = 120;
  const groupSize = Math.max(2, Math.floor(points.length / targetCandles));
  const candles: Candle[] = [];

  for (let i = 0; i < points.length - 1; i += groupSize) {
    const group = points.slice(i, Math.min(points.length, i + groupSize + 1));
    if (group.length < 2) continue;

    const open = group[0].value;
    const close = group[group.length - 1].value;
    const values = group.map((point) => point.value);
    const baseHigh = Math.max(...values, open, close);
    const baseLow = Math.min(...values, open, close);
    const body = Math.abs(close - open);
    const wickPad = Math.max(open * 0.00045, body * 0.2);

    candles.push({
      time: group[group.length - 1].time,
      open,
      close,
      high: baseHigh + wickPad,
      low: Math.max(0, baseLow - wickPad),
    });
  }

  return candles;
}

export default function PortfolioChart({ data, value }: PortfolioChartProps) {
  const [activeWindowSecs, setActiveWindowSecs] = useState(WINDOWS[0].secs);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const candles = useMemo(() => buildCandles(data), [data]);

  const chart = useMemo(() => {
    const highs = candles.map((candle) => candle.high);
    const lows = candles.map((candle) => candle.low);
    const max = Math.max(...highs, value);
    const min = Math.min(...lows, value);
    const range = Math.max(1, max - min);
    const top = max + range * 0.04;
    const bottom = Math.max(0, min - range * 0.04);
    const height = SVG_HEIGHT - PAD.top - PAD.bottom;
    const width = SVG_WIDTH - PAD.left - PAD.right;
    const slot = width / Math.max(1, candles.length);
    const candleWidth = Math.max(2, Math.min(6, slot * 0.68));

    const y = (price: number) => PAD.top + ((top - price) / Math.max(1, top - bottom)) * height;
    const x = (index: number) => PAD.left + slot * index + slot / 2;

    return { top, bottom, height, width, slot, candleWidth, x, y };
  }, [candles, value]);

  const hoveredCandle = hoverIndex !== null ? candles[hoverIndex] : null;

  const yLabels = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const ratio = i / 4;
      const price = chart.top - (chart.top - chart.bottom) * ratio;
      return {
        price,
        y: PAD.top + chart.height * ratio,
      };
    });
  }, [chart]);

  const xLabels = useMemo(() => {
    if (!candles.length) return [];
    const latest = candles[candles.length - 1].time;
    const start = latest - activeWindowSecs;
    return Array.from({ length: 4 }, (_, i) => {
      const ratio = i / 3;
      return {
        label: formatTimeLabel(start + activeWindowSecs * ratio, activeWindowSecs),
        x: PAD.left + chart.width * ratio,
      };
    });
  }, [candles, activeWindowSecs, chart.width]);

  if (!candles.length) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500">
        Waiting for portfolio data
      </div>
    );
  }

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / Math.max(1, rect.width);
    const svgX = ratio * SVG_WIDTH;
    const rawIndex = Math.round((svgX - PAD.left - chart.slot / 2) / chart.slot);
    const nextIndex = Math.max(0, Math.min(candles.length - 1, rawIndex));
    setHoverIndex(nextIndex);
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <div className="absolute left-4 top-4 z-10 flex items-center gap-2 border border-white/[0.08] bg-black/70 p-1 backdrop-blur">
        {WINDOWS.map((window) => {
          const active = window.secs === activeWindowSecs;
          return (
            <button
              key={window.label}
              type="button"
              onClick={() => setActiveWindowSecs(window.secs)}
              className={`
                h-7 rounded-full px-3 text-[11px] font-semibold transition-colors
                ${active ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-500 hover:text-zinc-200'}
              `}
            >
              {window.label}
            </button>
          );
        })}
      </div>

      {hoveredCandle && hoverIndex !== null && (
        <div className="absolute right-4 top-4 z-10 border border-white/[0.08] bg-black/75 px-3 py-2 font-mono text-[11px] text-zinc-400 backdrop-blur">
          <div className="mb-1 text-zinc-200">{formatTimeLabel(hoveredCandle.time, activeWindowSecs)}</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <span>O {formatCurrency(hoveredCandle.open)}</span>
            <span>H {formatCurrency(hoveredCandle.high)}</span>
            <span>L {formatCurrency(hoveredCandle.low)}</span>
            <span>C {formatCurrency(hoveredCandle.close)}</span>
          </div>
        </div>
      )}

      <svg
        className="h-full w-full cursor-crosshair"
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        role="img"
        aria-label="Portfolio candlestick chart"
        preserveAspectRatio="none"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id="chartGlow" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width={SVG_WIDTH} height={SVG_HEIGHT} fill="url(#chartGlow)" />

        {yLabels.map((label) => (
          <g key={label.price}>
            <line x1={PAD.left} x2={SVG_WIDTH - PAD.right} y1={label.y} y2={label.y} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
            <text x={SVG_WIDTH - PAD.right + 14} y={label.y + 4} fill="rgba(255,255,255,0.42)" fontSize="11" fontFamily="monospace">
              {formatCurrency(label.price)}
            </text>
          </g>
        ))}

        {xLabels.map((label) => (
          <text key={`${label.label}-${label.x}`} x={label.x} y={SVG_HEIGHT - 14} fill="rgba(255,255,255,0.42)" fontSize="11" fontFamily="monospace" textAnchor="middle">
            {label.label}
          </text>
        ))}

        {candles.map((candle, index) => {
          const up = candle.close >= candle.open;
          const color = up ? '#22c55e' : '#ef4444';
          const x = chart.x(index);
          const yHigh = chart.y(candle.high);
          const yLow = chart.y(candle.low);
          const yOpen = chart.y(candle.open);
          const yClose = chart.y(candle.close);
          const bodyY = Math.min(yOpen, yClose);
          const bodyHeight = Math.max(3, Math.abs(yClose - yOpen));

          return (
            <g key={`${candle.time}-${index}`}>
              <line x1={x} x2={x} y1={yHigh} y2={yLow} stroke={color} strokeWidth="1" opacity="0.9" />
              <rect
                x={x - chart.candleWidth / 2}
                y={bodyY}
                width={chart.candleWidth}
                height={bodyHeight}
                rx="1"
                fill={up ? 'rgba(34,197,94,0.82)' : 'rgba(239,68,68,0.82)'}
                stroke={color}
                strokeWidth="1"
              />
            </g>
          );
        })}

        {hoveredCandle && hoverIndex !== null && (
          <g>
            <line
              x1={chart.x(hoverIndex)}
              x2={chart.x(hoverIndex)}
              y1={PAD.top}
              y2={SVG_HEIGHT - PAD.bottom}
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="1"
            />
            <line
              x1={PAD.left}
              x2={SVG_WIDTH - PAD.right}
              y1={chart.y(hoveredCandle.close)}
              y2={chart.y(hoveredCandle.close)}
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="1"
              strokeDasharray="3 5"
            />
          </g>
        )}

        <line
          x1={PAD.left}
          x2={SVG_WIDTH - PAD.right}
          y1={chart.y(value)}
          y2={chart.y(value)}
          stroke="rgba(255,255,255,0.34)"
          strokeDasharray="4 6"
          strokeWidth="1"
        />
        <text x={SVG_WIDTH - PAD.right + 14} y={chart.y(value) - 8} fill="rgba(255,255,255,0.82)" fontSize="12" fontFamily="monospace">
          {formatCurrency(value)}
        </text>
      </svg>
    </div>
  );
}
