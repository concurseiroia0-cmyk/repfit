import { ACCENT, SUB, TEXT, TABULAR } from '../glassStyles';
import { fmtBig, fmtInt, safe } from '../formatShareStats';
import type { ShareCardData, ShareFormat, ShareTemplateProps } from '../types';
import { ShareCardFrame } from './shared';

/**
 * TEMPLATE 5 — POSTER
 * Pôster esportivo: tipografia GRANDE sobre a foto + a "assinatura do treino"
 * — uma polyline amarela gerada a partir do volume de cada exercício
 * (nenhum mapa, GPS ou IA; cada treino gera uma forma diferente).
 */
export function PosterTemplate(props: ShareTemplateProps) {
  const { data, format, custom } = props;
  const tall = format.height >= 1700;
  const compact = format.height <= 1200;
  const pad = tall ? 72 : compact ? 44 : 56;

  const name = safe(data.workoutName);
  const long = name.length > 14;
  const veryLong = name.length > 28;
  const base = tall ? 148 : compact ? 110 : 132;
  const titleSize = veryLong ? base * 0.6 : long ? base * 0.74 : base;

  const hasUser = Boolean(data.username.trim());
  const showVol = custom.showVolume && data.totals.volumeKg != null && data.totals.volumeKg > 0;
  const showDur = data.totals.durationMin != null;

  return (
    <ShareCardFrame {...props} overlay={0.42}>
      {/* Assinatura do treino (polyline amarela) */}
      <WorkoutWave data={data} format={format} />

      {/* Topo: nome + data + dados */}
      <div style={{ position: 'absolute', top: pad, left: pad, right: pad, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
        <div style={{ minWidth: 0 }}>
          {custom.showAvatar && hasUser && (
            <div style={{ fontSize: compact ? 22 : 26, fontWeight: 800, color: '#fff' }}>{safe(data.username)}</div>
          )}
          <div style={{ fontSize: compact ? 17 : 20, color: SUB, marginTop: 2 }}>{data.dateLabel}</div>
          <div style={{ display: 'flex', gap: compact ? 18 : 26, marginTop: 18 }}>
            <DataCell label="VOLUME" value={showVol ? `${fmtBig(data.totals.volumeKg!)} ${data.unit}` : '—'} compact={compact} />
            <DataCell label="TEMPO" value={showDur ? `${fmtInt(data.totals.durationMin!)} min` : '—'} compact={compact} />
            <DataCell label="SÉRIES" value={fmtInt(data.totals.sets)} compact={compact} />
          </div>
        </div>
        {data.workoutType && (
          <span
            style={{
              padding: '10px 22px',
              borderRadius: 999,
              background: 'rgba(10,10,12,0.5)',
              border: '1px solid rgba(255,255,255,0.16)',
              fontSize: compact ? 17 : 20,
              fontWeight: 700,
              color: SUB,
              whiteSpace: 'nowrap',
            }}
          >
            {safe(data.workoutType)}
          </span>
        )}
      </div>

      {/* Título central */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: `0 ${pad}px ${compact ? 70 : 50}px`,
        }}
      >
        <div
          style={{
            fontSize: compact ? 15 : 18,
            fontWeight: 900,
            letterSpacing: '0.34em',
            textTransform: 'uppercase',
            color: ACCENT,
            marginBottom: 18,
          }}
        >
          Diário de treino
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: titleSize,
            fontWeight: 900,
            letterSpacing: '-0.02em',
            lineHeight: 0.98,
            color: TEXT,
            textShadow: '0 8px 50px rgba(0,0,0,0.65)',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {name}
        </h1>
        <div
          style={{
            width: 130,
            height: 8,
            borderRadius: 999,
            background: ACCENT,
            marginTop: 28,
            boxShadow: '0 4px 22px rgba(245,197,24,0.5)',
          }}
        />
      </div>
    </ShareCardFrame>
  );
}

/** A "impressão digital do treino": polyline do volume de cada exercício. */
function WorkoutWave({ data, format }: { data: ShareCardData; format: ShareFormat }) {
  const exs = data.exercises.slice(0, 12).map((ex) => ex.volumeKg ?? ex.reps);
  const max = Math.max(1, ...exs);
  const W = format.width;
  const H = 380;
  const margin = 70;
  const baseY = H - 26;
  const amp = 170;
  const n = exs.length;

  let pts: string[];
  if (n <= 1) {
    const v = exs[0] ?? 0;
    pts = [`${W * 0.28},${baseY}`, `${W * 0.5},${baseY - (v / max) * amp * 0.6}`, `${W * 0.72},${baseY}`];
  } else {
    pts = exs.map((v, i) => {
      const x = margin + (i / (n - 1)) * (W - margin * 2);
      const y = baseY - (v / max) * amp;
      return `${x},${y}`;
    });
  }

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ position: 'absolute', left: 0, bottom: 100, pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={ACCENT}
        strokeWidth={16}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.45}
      />
    </svg>
  );
}

function DataCell({ label, value, compact }: { label: string; value: string; compact: boolean }) {
  return (
    <div>
      <div style={{ fontSize: compact ? 12 : 15, fontWeight: 700, letterSpacing: '0.16em', color: SUB }}>{label}</div>
      <div style={{ fontSize: compact ? 24 : 30, fontWeight: 900, color: '#fff', ...TABULAR, marginTop: 4 }}>{value}</div>
    </div>
  );
}
