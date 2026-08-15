import { formatNumber } from '../../utils/calc';
import { cn } from '../../utils/misc';

export interface ChartPoint {
  label: string;
  value: number;
}

export interface ChartSeries {
  name: string;
  color: string;
  data: ChartPoint[];
}

const W = 640;
const H = 220;
const PAD_L = 46;
const PAD_R = 14;
const PAD_T = 14;
const PAD_B = 30;

function niceMax(v: number): number {
  if (v <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(v));
  const norm = v / mag;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return step * mag;
}

function ticks(max: number, count = 4): number[] {
  const out: number[] = [];
  for (let i = 0; i <= count; i++) out.push((max / count) * i);
  return out;
}

function xPos(i: number, n: number): number {
  const inner = W - PAD_L - PAD_R;
  if (n <= 1) return PAD_L + inner / 2;
  return PAD_L + (i / (n - 1)) * inner;
}

export function LineChart({
  data,
  unit = '',
  color = '#f5c518',
  className,
}: {
  data: ChartPoint[];
  unit?: string;
  color?: string;
  className?: string;
}) {
  if (data.length === 0) return null;
  const max = niceMax(Math.max(...data.map((d) => d.value)));
  const min = 0;
  const innerH = H - PAD_T - PAD_B;

  const y = (v: number) => PAD_T + innerH - ((v - min) / (max - min)) * innerH;
  const n = data.length;
  const last = data[data.length - 1];

  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xPos(i, n).toFixed(1)},${y(d.value).toFixed(1)}`).join(' ');

  const labelEvery = Math.max(1, Math.ceil(n / 5));

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full text-slate-400 dark:text-slate-500"
        role="img"
        aria-label="Gráfico de linha"
      >
        {ticks(max).map((t) => (
          <g key={t}>
            <line x1={PAD_L} x2={W - PAD_R} y1={y(t)} y2={y(t)} stroke="currentColor" strokeOpacity={0.18} strokeWidth={1} />
            <text x={PAD_L - 6} y={y(t) + 4} textAnchor="end" fontSize={11} fill="currentColor">
              {formatNumber(t)}
            </text>
          </g>
        ))}
        <path d={path} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => {
          const showLabel = i % labelEvery === 0 || i === n - 1;
          return (
            <g key={i}>
              <circle cx={xPos(i, n)} cy={y(d.value)} r={i === n - 1 ? 4.5 : 3} fill={color} stroke="#fff" strokeWidth={1.5} />
              {showLabel && (
                <text x={xPos(i, n)} y={H - 10} textAnchor="middle" fontSize={11} fill="currentColor">
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {unit && (
        <p className="mt-1 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">
          último: {formatNumber(last.value)} {unit}
        </p>
      )}
    </div>
  );
}

/**
 * Mini gráfico de linha (sparkline): sem eixos nem rótulos, para cards
 * compactos — mostra a tendência da evolução com o último ponto destacado.
 */
export function Sparkline({
  data,
  color = '#f5c518',
  className,
}: {
  data: ChartPoint[];
  color?: string;
  className?: string;
}) {
  if (data.length === 0) return null;
  const w = 240;
  const h = 56;
  const min = Math.min(...data.map((d) => d.value));
  const max = Math.max(...data.map((d) => d.value));
  const span = max - min || 1;
  const pad = 4;
  const x = (i: number) => (data.length === 1 ? w / 2 : pad + (i / (data.length - 1)) * (w - pad * 2));
  const y = (v: number) => h - pad - ((v - min) / span) * (h - pad * 2);
  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(' ');
  const last = data[data.length - 1];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} role="img" aria-label="Gráfico de evolução">
      <path d={path} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" opacity={0.85} />
      {data.map((d, i) => (
        <circle key={i} cx={x(i)} cy={y(d.value)} r={i === data.length - 1 ? 4 : 2} fill={color} stroke="#fff" strokeWidth={1.2} />
      ))}
      {data.length > 1 && (
        <text x={x(data.length - 1)} y={y(last.value) - 7} textAnchor="middle" fontSize={10} fontWeight={700} fill={color}>
          {formatNumber(last.value)}
        </text>
      )}
    </svg>
  );
}

export function BarChart({
  data,
  unit = '',
  color = '#f5c518',
  className,
}: {
  data: ChartPoint[];
  unit?: string;
  color?: string;
  className?: string;
}) {
  if (data.length === 0) return null;
  const max = niceMax(Math.max(...data.map((d) => d.value)));
  const innerH = H - PAD_T - PAD_B;
  const barW = 18;
  const gap = (W - PAD_L - PAD_R - barW * data.length) / Math.max(1, data.length - 1);
  const labelEvery = Math.max(1, Math.ceil(data.length / 8));

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full text-slate-400 dark:text-slate-500" role="img" aria-label="Gráfico de barras">
        {ticks(max).map((t) => (
          <g key={t}>
            <line x1={PAD_L} x2={W - PAD_R} y1={PAD_T + innerH - (t / max) * innerH} y2={PAD_T + innerH - (t / max) * innerH} stroke="currentColor" strokeOpacity={0.18} strokeWidth={1} />
            <text x={PAD_L - 6} y={PAD_T + innerH - (t / max) * innerH + 4} textAnchor="end" fontSize={11} fill="currentColor">
              {formatNumber(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const h = (d.value / max) * innerH;
          const x = PAD_L + i * (barW + gap);
          const y = PAD_T + innerH - h;
          const showLabel = i % labelEvery === 0 || i === data.length - 1;
          const bottom = PAD_T + innerH;
          const top = Math.min(y, bottom - 2);
          const r = Math.min(6, Math.max(2, h / 2));
          // Barra com cantos superiores arredondados e base reta.
          const path =
            h <= r
              ? `M${x},${bottom} L${x},${top} L${x + barW},${top} L${x + barW},${bottom} Z`
              : `M${x},${bottom} L${x},${top + r} Q${x},${top} ${x + r},${top} L${x + barW - r},${top} Q${x + barW},${top} ${x + barW},${top + r} L${x + barW},${bottom} Z`;
          return (
            <g key={i}>
              <path d={path} fill={color} />
              {d.value > 0 && (
                <text x={x + barW / 2} y={top - 5} textAnchor="middle" fontSize={11} fontWeight={700} fill="currentColor">
                  {formatNumber(d.value)}
                </text>
              )}
              {showLabel && (
                <text x={x + barW / 2} y={H - 10} textAnchor="middle" fontSize={11} fill="currentColor">
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {unit && <p className="mt-1 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">{unit}</p>}
    </div>
  );
}

/**
 * Gráfico de linhas multissérie: sobrepõe várias séries no mesmo eixo.
 * O eixo X é o índice de ocorrência de cada série (1º treino, 2º treino…),
 * ideal para comparar a progressão de dois exercícios lado a lado.
 */
export function MultiLineChart({
  series,
  unit = '',
  className,
}: {
  series: ChartSeries[];
  unit?: string;
  className?: string;
}) {
  const withData = series.filter((s) => s.data.length > 0);
  if (withData.length === 0) return null;

  const maxVal = Math.max(...withData.map((s) => Math.max(...s.data.map((d) => d.value))));
  const max = niceMax(maxVal);
  const innerH = H - PAD_T - PAD_B;
  const y = (v: number) => PAD_T + innerH - (v / max) * innerH;
  const maxLen = Math.max(...withData.map((s) => s.data.length));
  const labelEvery = Math.max(1, Math.ceil(maxLen / 5));

  return (
    <div className={className}>
      {/* Legenda */}
      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1">
        {withData.map((s) => (
          <span key={s.name} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} aria-hidden="true" />
            {s.name}
            <b className="text-slate-900 dark:text-white">{formatNumber(s.data[s.data.length - 1].value)}</b>
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full text-slate-400 dark:text-slate-500" role="img" aria-label="Gráfico de comparação">
        {ticks(max).map((t) => (
          <g key={t}>
            <line x1={PAD_L} x2={W - PAD_R} y1={y(t)} y2={y(t)} stroke="currentColor" strokeOpacity={0.18} strokeWidth={1} />
            <text x={PAD_L - 6} y={y(t) + 4} textAnchor="end" fontSize={11} fill="currentColor">
              {formatNumber(t)}
            </text>
          </g>
        ))}
        {withData.map((s) => {
          const n = s.data.length;
          const path = s.data
            .map((d, i) => `${i === 0 ? 'M' : 'L'}${xPos(i, n).toFixed(1)},${y(d.value).toFixed(1)}`)
            .join(' ');
          return (
            <g key={s.name}>
              <path d={path} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
              {s.data.map((d, i) => (
                <circle key={i} cx={xPos(i, n)} cy={y(d.value)} r={i === n - 1 ? 4.5 : 3} fill={s.color} stroke="#fff" strokeWidth={1.5} />
              ))}
              {/* Rótulos de ocorrência (só na série mais longa, para não poluir) */}
              {n === maxLen &&
                s.data.map((d, i) =>
                  i % labelEvery === 0 || i === n - 1 ? (
                    <text key={i} x={xPos(i, n)} y={H - 10} textAnchor="middle" fontSize={11} fill="currentColor">
                      {i + 1}º
                    </text>
                  ) : null
                )}
            </g>
          );
        })}
      </svg>
      {unit && <p className="mt-1 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">{unit}</p>}
    </div>
  );
}

export function ChartCard({
  title,
  subtitle,
  children,
  empty,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  empty?: string;
  className?: string;
}) {
  return (
    <div className={cn('rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#161616]', className)}>
      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
      <div className="mt-3">
        {empty ? (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">{empty}</p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
