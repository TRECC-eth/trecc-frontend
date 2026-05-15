'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { LivelinePoint } from 'liveline';

const WINDOWS = [
  { label: '1H', secs: 3600 },
  { label: '4H', secs: 14400 },
  { label: '1D', secs: 86400 },
  { label: '1W', secs: 604800 },
];

const MODES = [
  { id: 'candles', label: 'Candles' },
  { id: 'hollow', label: 'Hollow' },
  { id: 'bars', label: 'Bars' },
  { id: 'line', label: 'Line' },
  { id: 'area', label: 'Area' },
  { id: 'baseline', label: 'Baseline' },
] as const;

const SVG_WIDTH = 1200;
const SVG_HEIGHT = 560;
const PAD = { top: 28, right: 92, bottom: 42, left: 18 };

type ChartMode = typeof MODES[number]['id'];
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
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
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

  const targetCandles = 420;
  const groupSize = Math.max(1, Math.floor(points.length / targetCandles));
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
    const wickPad = Math.max(Math.max(open, 1) * 0.00025, body * 0.16);

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
  const [activeWindowSecs, setActiveWindowSecs] = useState(WINDOWS[2].secs);
  const [mode, setMode] = useState<ChartMode>('candles');
  const [visibleCount, setVisibleCount] = useState(180);
  const [offsetFromEnd, setOffsetFromEnd] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragStartOffset, setDragStartOffset] = useState(0);
  const [markers, setMarkers] = useState<number[]>([]);
  const [displayData, setDisplayData] = useState<LivelinePoint[]>(data);
  const displayDataRef = useRef<LivelinePoint[]>(data);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }

    const from = displayDataRef.current;
    const to = data;

    if (!from.length || !to.length) {
      displayDataRef.current = to;
      queueMicrotask(() => setDisplayData(to));
      return;
    }

    const duration = 520;
    const startedAt = performance.now();
    const lengthDelta = to.length - from.length;
    const fallbackStart = from[from.length - 1];
    const startFrames = to.map((point, index) => {
      const fromIndex = index - Math.max(0, lengthDelta);
      return from[fromIndex] ?? fallbackStart ?? point;
    });

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (now: number) => {
      const progress = easeOut(Math.min(1, (now - startedAt) / duration));
      const next = to.map((point, index) => {
        const start = startFrames[index] ?? point;
        return {
          time: point.time,
          value: start.value + (point.value - start.value) * progress,
        };
      });

      displayDataRef.current = next;
      setDisplayData(next);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [data]);

  const renderedValue = displayData[displayData.length - 1]?.value ?? value;
  const allCandles = useMemo(() => buildCandles(displayData), [displayData]);
  const maxOffset = Math.max(0, allCandles.length - visibleCount);
  const safeOffset = Math.min(offsetFromEnd, maxOffset);
  const visibleCandles = useMemo(() => {
    const end = allCandles.length - safeOffset;
    const start = Math.max(0, end - visibleCount);
    return allCandles.slice(start, end);
  }, [allCandles, safeOffset, visibleCount]);

  const chart = useMemo(() => {
    const highs = visibleCandles.map((candle) => candle.high);
    const lows = visibleCandles.map((candle) => candle.low);
    const max = Math.max(...highs, renderedValue);
    const min = Math.min(...lows, renderedValue);
    const range = Math.max(1, max - min);
    const top = max + range * 0.05;
    const bottom = Math.max(0, min - range * 0.05);
    const height = SVG_HEIGHT - PAD.top - PAD.bottom;
    const width = SVG_WIDTH - PAD.left - PAD.right;
    const slot = width / Math.max(1, visibleCandles.length);
    const candleWidth = Math.max(1.6, Math.min(7, slot * 0.7));
    const y = (price: number) => PAD.top + ((top - price) / Math.max(1, top - bottom)) * height;
    const x = (index: number) => PAD.left + slot * index + slot / 2;
    const priceAtY = (svgY: number) => top - ((svgY - PAD.top) / height) * (top - bottom);

    return { top, bottom, height, width, slot, candleWidth, x, y, priceAtY };
  }, [visibleCandles, renderedValue]);

  const hoveredCandle = hoverIndex !== null ? visibleCandles[hoverIndex] : null;
  const linePath = visibleCandles
    .map((candle, index) => `${index === 0 ? 'M' : 'L'} ${chart.x(index)} ${chart.y(candle.close)}`)
    .join(' ');
  const areaPath = linePath
    ? `${linePath} L ${chart.x(visibleCandles.length - 1)} ${SVG_HEIGHT - PAD.bottom} L ${chart.x(0)} ${SVG_HEIGHT - PAD.bottom} Z`
    : '';
  const baseline = visibleCandles[0]?.open ?? renderedValue;

  const yLabels = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const ratio = i / 6;
      const price = chart.top - (chart.top - chart.bottom) * ratio;
      return { price, y: PAD.top + chart.height * ratio };
    });
  }, [chart]);

  const xLabels = useMemo(() => {
    if (!visibleCandles.length) return [];
    return Array.from({ length: 5 }, (_, i) => {
      const index = Math.round((visibleCandles.length - 1) * (i / 4));
      const candle = visibleCandles[index];
      return {
        label: formatTimeLabel(candle.time, activeWindowSecs),
        x: chart.x(index),
      };
    });
  }, [visibleCandles, activeWindowSecs, chart]);

  const pointerToIndex = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / Math.max(1, rect.width);
    const svgX = ratio * SVG_WIDTH;
    const rawIndex = Math.round((svgX - PAD.left - chart.slot / 2) / chart.slot);
    return Math.max(0, Math.min(visibleCandles.length - 1, rawIndex));
  };

  const pointerToPrice = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientY - rect.top) / Math.max(1, rect.height);
    return Math.max(0, chart.priceAtY(ratio * SVG_HEIGHT));
  };

  const handleWheel = (event: React.WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? 24 : -24;
    const nextVisible = Math.max(40, Math.min(allCandles.length || 420, visibleCount + delta));
    setVisibleCount(nextVisible);
    setOffsetFromEnd((prev) => Math.min(prev, Math.max(0, allCandles.length - nextVisible)));
  };

  const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragStartX(event.clientX);
    setDragStartOffset(safeOffset);
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    setHoverIndex(pointerToIndex(event));

    if (dragStartX !== null) {
      const pixelDelta = event.clientX - dragStartX;
      const candleDelta = Math.round(pixelDelta / Math.max(1, event.currentTarget.getBoundingClientRect().width / visibleCount));
      const nextOffset = Math.max(0, Math.min(maxOffset, dragStartOffset + candleDelta));
      setOffsetFromEnd(nextOffset);
    }
  };

  const handlePointerUp = () => {
    setDragStartX(null);
  };

  const handleDoubleClick = (event: React.PointerEvent<SVGSVGElement>) => {
    const price = pointerToPrice(event);
    setMarkers((prev) => [...prev.slice(-4), price]);
  };

  const toolbar = (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/[0.06] bg-black px-3 py-2">
      <div className="flex items-center gap-1 border border-white/[0.08] bg-white/[0.02] p-1">
        {WINDOWS.map((window) => (
          <button
            key={window.label}
            type="button"
            onClick={() => setActiveWindowSecs(window.secs)}
            className={`h-7 px-3 text-[11px] font-semibold transition-colors ${window.secs === activeWindowSecs ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-500 hover:text-zinc-200'}`}
          >
            {window.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1 border border-white/[0.08] bg-white/[0.02] p-1">
        {MODES.map((chartMode) => (
          <button
            key={chartMode.id}
            type="button"
            onClick={() => setMode(chartMode.id)}
            className={`h-7 px-3 text-[11px] font-semibold transition-colors ${chartMode.id === mode ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-500 hover:text-zinc-200'}`}
          >
            {chartMode.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => {
          setVisibleCount(180);
          setOffsetFromEnd(0);
          setMarkers([]);
        }}
        className="h-9 border border-white/[0.08] bg-white/[0.02] px-3 text-[11px] font-semibold text-zinc-500 transition-colors hover:text-zinc-200"
      >
        Reset
      </button>
    </div>
  );

  if (!visibleCandles.length) {
    return (
      <div className="flex h-full w-full flex-col overflow-hidden bg-black">
        {toolbar}
        <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
          Waiting for live vault data
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-black">
      {toolbar}
      <div className="relative min-h-0 flex-1">
      {hoveredCandle && hoverIndex !== null && (
        <div className="absolute right-3 top-3 z-10 border border-white/[0.08] bg-black/80 px-3 py-2 font-mono text-[11px] text-zinc-400 backdrop-blur">
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
        className="h-full w-full cursor-crosshair select-none touch-none"
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        role="img"
        aria-label="Interactive portfolio chart"
        preserveAspectRatio="none"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => {
          setHoverIndex(null);
          setDragStartX(null);
        }}
        onDoubleClick={handleDoubleClick}
      >
        <defs>
          <linearGradient id="greenArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(34,197,94,0.28)" />
            <stop offset="100%" stopColor="rgba(34,197,94,0)" />
          </linearGradient>
          <linearGradient id="redArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(239,68,68,0.24)" />
            <stop offset="100%" stopColor="rgba(239,68,68,0)" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width={SVG_WIDTH} height={SVG_HEIGHT} fill="#000" />

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

        {(mode === 'area' || mode === 'baseline') && (
          <path d={areaPath} fill={visibleCandles[visibleCandles.length - 1].close >= baseline ? 'url(#greenArea)' : 'url(#redArea)'} />
        )}

        {(mode === 'line' || mode === 'area' || mode === 'baseline') && (
          <path d={linePath} fill="none" stroke={visibleCandles[visibleCandles.length - 1].close >= baseline ? '#22c55e' : '#ef4444'} strokeWidth="1.8" />
        )}

        {(mode === 'candles' || mode === 'hollow' || mode === 'bars') && visibleCandles.map((candle, index) => {
          const up = candle.close >= candle.open;
          const color = up ? '#22c55e' : '#ef4444';
          const x = chart.x(index);
          const yHigh = chart.y(candle.high);
          const yLow = chart.y(candle.low);
          const yOpen = chart.y(candle.open);
          const yClose = chart.y(candle.close);
          const bodyY = Math.min(yOpen, yClose);
          const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));

          if (mode === 'bars') {
            return (
              <g key={`${candle.time}-${index}`}>
                <line x1={x} x2={x} y1={yHigh} y2={yLow} stroke={color} strokeWidth="1" />
                <line x1={x - chart.candleWidth / 2} x2={x} y1={yOpen} y2={yOpen} stroke={color} strokeWidth="1" />
                <line x1={x} x2={x + chart.candleWidth / 2} y1={yClose} y2={yClose} stroke={color} strokeWidth="1" />
              </g>
            );
          }

          return (
            <g key={`${candle.time}-${index}`}>
              <line x1={x} x2={x} y1={yHigh} y2={yLow} stroke={color} strokeWidth="1" opacity="0.9" />
              <rect
                x={x - chart.candleWidth / 2}
                y={bodyY}
                width={chart.candleWidth}
                height={bodyHeight}
                rx="0.75"
                fill={mode === 'hollow' && up ? 'rgba(0,0,0,0)' : up ? 'rgba(34,197,94,0.82)' : 'rgba(239,68,68,0.82)'}
                stroke={color}
                strokeWidth="1"
              />
            </g>
          );
        })}

        {markers.map((marker, index) => (
          <g key={`${marker}-${index}`}>
            <line x1={PAD.left} x2={SVG_WIDTH - PAD.right} y1={chart.y(marker)} y2={chart.y(marker)} stroke="rgba(250,204,21,0.7)" strokeDasharray="5 5" strokeWidth="1" />
            <text x={SVG_WIDTH - PAD.right + 14} y={chart.y(marker) - 5} fill="rgba(250,204,21,0.9)" fontSize="11" fontFamily="monospace">
              {formatCurrency(marker)}
            </text>
          </g>
        ))}

        {hoveredCandle && hoverIndex !== null && (
          <g>
            <line x1={chart.x(hoverIndex)} x2={chart.x(hoverIndex)} y1={PAD.top} y2={SVG_HEIGHT - PAD.bottom} stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
            <line x1={PAD.left} x2={SVG_WIDTH - PAD.right} y1={chart.y(hoveredCandle.close)} y2={chart.y(hoveredCandle.close)} stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="3 5" />
          </g>
        )}

        <line x1={PAD.left} x2={SVG_WIDTH - PAD.right} y1={chart.y(renderedValue)} y2={chart.y(renderedValue)} stroke="rgba(255,255,255,0.34)" strokeDasharray="4 6" strokeWidth="1" />
        <text x={SVG_WIDTH - PAD.right + 14} y={chart.y(renderedValue) - 8} fill="rgba(255,255,255,0.82)" fontSize="12" fontFamily="monospace">
          {formatCurrency(renderedValue)}
        </text>
      </svg>
      </div>
    </div>
  );
}
