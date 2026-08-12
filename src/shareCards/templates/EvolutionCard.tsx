import { ACCENT, GLASS_PANEL, PILL_YELLOW, SUB, TEXT, TABULAR } from '../glassStyles';
import { fmtNum, safe } from '../formatShareStats';
import type { ShareCardData, ShareFormat } from '../types';
import { CardShell } from './CardShell';

/**
 * TEMPLATE 3 — MINHA EVOLUÇÃO
 * Histórico real do exercício destaque: 3 pontos (mês + carga × reps) e
 * gráfico de barras verticais no estilo do app (arredondadas, amarelas,
 * última destacada, as outras mais opacas).
 */
export function EvolutionCard({ data, format }: { data: ShareCardData; format: ShareFormat }) {
  const compact = format.height <= 1200;
  const tall = format.height >= 1700;
  const evo = data.evolution;

  const barAreaH = compact ? 180 : tall ? 300 : 240;
  const barW = compact ? 72 : 92;

  // Altura proporcional à carga (ou reps) de cada ponto.
  const values = evo ? evo.points.map((p) => p.weightKg ?? p.reps) : [];
  const max = Math.max(0, ...values);
  const bars = evo
    ? evo.points.map((p, i) => ({
        label: p.dateLabel.slice(0, 5),
        value: p.weightKg != null ? `${fmtNum(p.weightKg)} ${data.unit}` : `${fmtNum(p.reps)} reps`,
        h: max > 0 ? Math.max(12, (p.weightKg ?? p.reps) / max) * barAreaH : barAreaH * 0.15,
        last: i === evo.points.length - 1,
      }))
    : [];

  const footerLine = evo
    ? evo.deltaPercent != null
      ? `EVOLUÇÃO · +${fmtNum(evo.deltaPercent, 0)}% de carga`
      : evo.deltaReps != null
        ? `EVOLUÇÃO · +${fmtNum(evo.deltaReps, 0)} reps`
        : 'EVOLUÇÃO'
    : 'Registre mais treinos deste exercício para ver a evolução';

  return (
    <CardShell format={format}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ ...PILL_YELLOW, display: 'inline-flex', alignItems: 'center', gap: 10, padding: '12px 26px', fontSize: compact ? 17 : 21 }}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 17l6-6 4 4 8-8" stroke="#0B0B0B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Minha evolução
        </span>
        <div style={{ fontSize: compact ? 18 : 22, color: SUB }}>{data.dateLabel}</div>
      </div>

      <h1
        style={{
          margin: '20px 0 0',
          fontSize: compact ? 44 : tall ? 62 : 54,
          fontWeight: 900,
          lineHeight: 1.1,
          color: TEXT,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {safe(evo?.exercise || data.workoutName)}
      </h1>

      {!evo || evo.points.length < 2 ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '0 40px',
          }}
        >
          <div>
            <div style={{ fontSize: 90, marginBottom: 18 }}>📈</div>
            <div style={{ fontSize: compact ? 24 : 30, color: SUB, fontWeight: 600, lineHeight: 1.4 }}>
              Registre mais treinos deste exercício para ver a evolução
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingTop: tall ? 40 : 24 }}>
          {/* Barras */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 28, height: barAreaH + 70 }}>
            {bars.map((b, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: barW + 40 }}>
                <div style={{ fontSize: compact ? 19 : 24, color: SUB, fontWeight: 700, ...TABULAR, marginBottom: 10, whiteSpace: 'nowrap' }}>
                  {b.value}
                </div>
                <div
                  style={{
                    width: barW,
                    height: b.h,
                    borderRadius: `${barW / 2}px ${barW / 2}px 0 0`,
                    background: b.last ? ACCENT : 'rgba(245,197,24,0.35)',
                    boxShadow: b.last ? '0 8px 30px rgba(245,197,24,0.35)' : 'none',
                  }}
                />
                <div style={{ fontSize: compact ? 17 : 21, color: SUB, marginTop: 12, fontWeight: 700 }}>{b.label}</div>
              </div>
            ))}
          </div>

          {/* Linha final */}
          <div
            style={{
              marginTop: 34,
              textAlign: 'center',
              padding: '16px 26px',
              borderRadius: 999,
              background: 'rgba(245,197,24,0.14)',
              border: '1px solid rgba(245,197,24,0.4)',
              fontSize: compact ? 20 : 26,
              fontWeight: 800,
              color: ACCENT,
              ...TABULAR,
            }}
          >
            {footerLine}
          </div>
        </div>
      )}
    </CardShell>
  );
}
