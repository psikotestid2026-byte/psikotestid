import React from 'react';
import { DiscGraphValues } from '@/lib/scoring/disc';

interface DiscGraphProps {
  title: string;
  subtitle: string;
  values: DiscGraphValues;
}

const ORDER: ('D' | 'I' | 'S' | 'C')[] = ['D', 'I', 'S', 'C'];
const COLORS = { D: '#D7263D', I: '#E8A317', S: '#2E9E5B', C: '#2D6CDF' };
const AXMIN = -16;
const AXMAX = 18;

export function SingleDiscGraph({ title, subtitle, values }: DiscGraphProps) {
  const W = 240;
  const H = 300;
  const padL = 34;
  const padR = 14;
  const padT = 14;
  const padB = 26;

  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const getY = (v: number) => {
    const clamped = Math.max(AXMIN, Math.min(AXMAX, v));
    return padT + plotH * (AXMAX - clamped) / (AXMAX - AXMIN);
  };

  const xs = ORDER.map((_, i) => padL + plotW * (i + 0.5) / 4);

  // Y Grid Lines
  const gridLines: React.ReactNode[] = [];
  for (let g = AXMAX; g >= AXMIN; g -= 4) {
    const gy = getY(g);
    const isZero = g === 0;
    gridLines.push(
      <g key={g}>
        <line
          x1={padL}
          y1={gy}
          x2={W - padR}
          y2={gy}
          stroke={isZero ? '#9aa6b6' : '#eceef2'}
          strokeWidth={isZero ? 1.5 : 1}
        />
        <text
          x={padL - 6}
          y={gy + 3}
          textAnchor="end"
          className="font-mono text-[9px] fill-slate-400"
        >
          {g}
        </text>
      </g>
    );
  }

  // Connecting Line
  const points = ORDER.map((d, i) => `${xs[i].toFixed(1)},${getY(values[d] || 0).toFixed(1)}`).join(' ');

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col items-center">
      <div className="text-center mb-3">
        <h4 className="font-bold text-slate-900 text-sm font-display">{title}</h4>
        <p className="text-[11px] text-slate-500 font-medium">{subtitle}</p>
      </div>

      <div className="w-full max-w-[240px]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto overflow-visible">
          {gridLines}

          {/* Polyline */}
          <polyline
            points={points}
            fill="none"
            stroke="#46566e"
            strokeWidth="2"
            strokeLinejoin="round"
            opacity="0.6"
          />

          {/* Dots and Labels */}
          {ORDER.map((d, i) => {
            const val = values[d] || 0;
            const cx = xs[i];
            const cy = getY(val);
            const isPositive = val >= 0;
            const textY = isPositive ? cy - 12 : cy + 18;

            return (
              <g key={d}>
                <circle
                  cx={cx}
                  cy={cy}
                  r="6.5"
                  fill={COLORS[d]}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <text
                  x={cx}
                  y={textY}
                  textAnchor="middle"
                  className="font-mono text-[10px] font-bold"
                  fill={COLORS[d]}
                >
                  {val}
                </text>
                <text
                  x={cx}
                  y={H - 8}
                  textAnchor="middle"
                  className="font-display text-[12px] font-bold"
                  fill={COLORS[d]}
                >
                  {d}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export function DiscThreeCharts({ g1, g2, g3 }: { g1: DiscGraphValues; g2: DiscGraphValues; g3: DiscGraphValues }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full my-4">
      <SingleDiscGraph
        title="Graph 1: MOST"
        subtitle="Mask / Diri Adaptif (Public Self)"
        values={g1}
      />
      <SingleDiscGraph
        title="Graph 2: LEAST"
        subtitle="Core / Diri Alami (Private Self)"
        values={g2}
      />
      <SingleDiscGraph
        title="Graph 3: CHANGE"
        subtitle="Mirror / Persepsi Diri (Perceived Self)"
        values={g3}
      />
    </div>
  );
}
