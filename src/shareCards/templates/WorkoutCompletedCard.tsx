import { ACCENT, GLASS_PANEL, PILL_YELLOW, SUB, TEXT, TABULAR, clampLines } from '../glassStyles';
import { fmtBig, fmtInt, fmtNum, safe } from '../formatShareStats';
import type { ShareCardData, ShareFormat } from '../types';
import { Avatar, CardShell } from './CardShell';

/**
 * TEMPLATE 1 — TREINO CONCLUÍDO
 * Topo em vidro com selo amarelo, faixa de 4 métricas em pílulas,
 * lista dos exercícios em linhas de vidro e faixa amarela de recorde.
 */
export function WorkoutCompletedCard({ data, format }: { data: ShareCardData; format: ShareFormat }) {
  const tall = format.height >= 1700;
  const compact = format.height <= 1200;

  const rowsToShow = compact ? 4 : 5;
  const hidden =
    data.moreExercises + Math.max(0, data.exercises.length - rowsToShow);
  const shown = data.exercises.slice(0, rowsToShow);

  const titleSize = compact ? 46 : tall ? 66 : 58;
  const metricNum = compact ? 46 : tall ? 68 : 58;
  const metricLabel = compact ? 19 : tall ? 26 : 23;
  const rowPad = compact ? 14 : tall ? 24 : 19;
  const rowName = compact ? 23 : tall ? 30 : 27;
  const rowMeta = compact ? 20 : tall ? 26 : 24;

  // Métricas: exercícios · séries · reps · volume|duração (só as que existem).
  const metrics: { n: string; label: string }[] = [
    { n: fmtInt(data.totals.exercises), label: 'Exercícios' },
    { n: fmtInt(data.totals.sets), label: 'Séries' },
    { n: fmtInt(data.totals.reps), label: 'Repetições' },
  ];
  if (data.totals.volumeKg != null && data.totals.volumeKg > 0) {
    metrics.push({ n: fmtBig(data.totals.volumeKg), label: data.unit === 'lb' ? 'Volume (lb)' : 'Volume (kg)' });
  } else if (data.totals.durationMin != null) {
    metrics.push({ n: fmtInt(data.totals.durationMin), label: 'Duração (min)' });
  }

  const hasUser = Boolean(data.username.trim());

  return (
    <CardShell format={format}>
      {/* Topo: usuário (monograma) + data */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Avatar name={data.username} />
          <div>
            {hasUser ? (
              <div style={{ fontSize: compact ? 24 : 30, fontWeight: 800, color: TEXT }}>{safe(data.username)}</div>
            ) : (
              <div style={{ fontSize: compact ? 24 : 30, fontWeight: 800, color: TEXT }}>Treino concluído</div>
            )}
            <div style={{ fontSize: compact ? 18 : 22, color: SUB, marginTop: 2 }}>{data.dateLabel}</div>
          </div>
        </div>
        {data.workoutType && (
          <span
            style={{
              ...GLASS_PANEL,
              padding: '12px 26px',
              fontSize: compact ? 18 : 22,
              fontWeight: 700,
              color: SUB,
              borderRadius: 999,
            }}
          >
            {safe(data.workoutType)}
          </span>
        )}
      </div>

      {/* Selo + nome do treino */}
      <div style={{ marginTop: tall ? 40 : compact ? 24 : 32 }}>
        <span
          style={{
            ...PILL_YELLOW,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 26px',
            fontSize: compact ? 18 : 22,
          }}
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" stroke="#0B0B0B" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Treino concluído
        </span>
        <h1
          style={{
            margin: '20px 0 0',
            fontSize: titleSize,
            fontWeight: 900,
            lineHeight: 1.08,
            letterSpacing: '-0.01em',
            color: TEXT,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {safe(data.workoutName)}
        </h1>
      </div>

      {/* Métricas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${metrics.length}, 1fr)`,
          gap: 16,
          marginTop: tall ? 40 : compact ? 24 : 32,
        }}
      >
        {metrics.map((m) => (
          <div key={m.label} style={{ ...GLASS_PANEL, padding: `${compact ? 18 : 24}px 14px`, textAlign: 'center' }}>
            <div style={{ fontSize: metricNum, fontWeight: 900, color: TEXT, ...TABULAR, lineHeight: 1 }}>{m.n}</div>
            <div style={{ fontSize: metricLabel, color: SUB, marginTop: 8, fontWeight: 600 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Lista de exercícios */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: tall ? 36 : compact ? 20 : 28 }}>
        {shown.map((ex) => (
          <div key={ex.name} style={{ ...GLASS_PANEL, padding: `${rowPad}px 26px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
            <span
              style={{
                fontSize: rowName,
                fontWeight: 700,
                color: TEXT,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                maxWidth: '58%',
              }}
            >
              {safe(ex.name)}
            </span>
            <span style={{ fontSize: rowMeta, color: SUB, fontWeight: 700, ...TABULAR, whiteSpace: 'nowrap' }}>
              {ex.weightKg != null ? `${fmtNum(ex.weightKg)} ${data.unit} · ` : ''}
              {fmtInt(ex.sets)}×{fmtInt(ex.reps)}
            </span>
          </div>
        ))}
        {hidden > 0 && (
          <div style={{ padding: '10px 4px 0', fontSize: rowMeta, color: SUB, fontWeight: 600, textAlign: 'center' }}>
            + {hidden} {hidden === 1 ? 'exercício' : 'exercícios'}
          </div>
        )}
      </div>

      {/* Faixa de recorde */}
      {data.record && (
        <div
          style={{
            marginTop: 'auto',
            marginBottom: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            padding: '16px 26px',
            borderRadius: 999,
            background: 'rgba(245,197,24,0.14)',
            border: `1px solid rgba(245,197,24,0.4)`,
            fontSize: compact ? 20 : 25,
            fontWeight: 800,
            color: ACCENT,
            ...TABULAR,
          }}
        >
          <span style={{ fontSize: compact ? 18 : 22, flexShrink: 0 }}>🏆</span>
          <span style={{ ...clampLines(1), minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            NOVO RECORDE · {safe(data.record.sublabel || data.workoutName)}{' '}
          </span>
          <span style={{ whiteSpace: 'nowrap', flexShrink: 0, ...TABULAR }}>
            {data.record.unit === 'kg' ? `${fmtNum(data.record.value)} ${data.unit}` : `${fmtNum(data.record.value)} ${data.record.unit || ''}`}
          </span>
        </div>
      )}
    </CardShell>
  );
}
