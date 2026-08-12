import { ACCENT, SUB, TEXT, TABULAR } from '../glassStyles';
import { fmtBig, fmtInt, fmtNum, safe } from '../formatShareStats';
import type { ShareTemplateProps } from '../types';
import { GridLines, ShareCardFrame } from './shared';

/**
 * TEMPLATE 3 — DASHBOARD TRANSPARENTE
 * HUD esportiva "projetada" sobre a foto: módulos transparentes pequenos,
 * linhas finas, grid discreto e mini gráfico. Sem um card único grande.
 */
export function DashboardTemplate(props: ShareTemplateProps) {
  const { data, format, custom } = props;
  const tall = format.height >= 1700;
  const compact = format.height <= 1200;
  const pad = tall ? 72 : compact ? 44 : 56;

  const showVol = custom.showVolume && data.totals.volumeKg != null && data.totals.volumeKg > 0;
  const showDur = data.totals.durationMin != null;
  const rec = custom.showRecord ? data.record : null;

  const bars = data.exercises.slice(0, 8).map((ex) => ex.volumeKg ?? ex.reps);
  const maxB = Math.max(1, ...bars);

  return (
    <ShareCardFrame {...props} overlay={0.36}>
      <GridLines format={format} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: pad,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 24,
        }}
      >
        {/* Topo: resumo + 2 módulos */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: compact ? 15 : 18, fontWeight: 900, letterSpacing: '0.22em', textTransform: 'uppercase', color: ACCENT }}>
              Resumo
            </div>
            <div
              style={{
                fontSize: tall ? 52 : compact ? 32 : 40,
                fontWeight: 900,
                color: TEXT,
                lineHeight: 1.1,
                marginTop: 8,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {safe(data.workoutName)}
            </div>
            <div style={{ fontSize: compact ? 17 : 20, color: SUB, marginTop: 6 }}>{data.dateLabel}</div>
          </div>
          <HudChip value={fmtInt(data.totals.sets)} label="SÉRIES" compact={compact} />
          <HudChip value={fmtInt(data.totals.reps)} label="REPS" compact={compact} />
        </div>

        {/* Centro: destaque grande */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div
            style={{
              fontSize: tall ? 150 : compact ? 92 : 116,
              fontWeight: 900,
              letterSpacing: '-0.02em',
              color: ACCENT,
              lineHeight: 0.98,
              textShadow: '0 6px 40px rgba(0,0,0,0.5)',
            }}
          >
            TREINO
            <br />
            CONCLUÍDO
          </div>
          <div style={{ marginTop: 22, fontSize: compact ? 20 : 24, fontWeight: 700, color: '#fff', textShadow: '0 2px 14px rgba(0,0,0,0.6)' }}>
            {fmtInt(data.totals.exercises)} EXERCÍCIOS ✓
          </div>
          {rec && (
            <div
              style={{
                marginTop: 18,
                padding: '12px 30px',
                borderRadius: 999,
                background: 'rgba(245,197,24,0.16)',
                border: '1px solid rgba(245,197,24,0.5)',
                color: ACCENT,
                fontSize: compact ? 22 : 28,
                fontWeight: 900,
                ...TABULAR,
              }}
            >
              NOVO PR · {rec.unit === 'kg' ? `${fmtNum(rec.value)} ${data.unit}` : `${fmtNum(rec.value)} ${rec.unit || ''}`}
            </div>
          )}
        </div>

        {/* Rodapé: mini gráfico + módulos */}
        <div>
          {bars.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 72, marginBottom: 20, paddingRight: 12 }}>
              {bars.map((v, i) => {
                const h = Math.max(8, (v / maxB) * 64);
                return (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: h,
                      borderRadius: 6,
                      background: i === bars.length - 1 ? ACCENT : 'rgba(245,197,24,0.3)',
                    }}
                  />
                );
              })}
            </div>
          )}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', paddingRight: 150 }}>
            {showVol && <HudChip value={fmtBig(data.totals.volumeKg!)} label={`${data.unit.toUpperCase()} · VOLUME`} compact={compact} />}
            {showDur && <HudChip value={fmtInt(data.totals.durationMin!)} label="MIN · DURAÇÃO" compact={compact} />}
            {custom.showEffort && data.averageEffort != null && (
              <HudChip value={`${fmtInt(data.averageEffort)}/6`} label="ESFORÇO" compact={compact} />
            )}
          </div>
        </div>
      </div>
    </ShareCardFrame>
  );
}

function HudChip({ value, label, compact }: { value: string; label: string; compact: boolean }) {
  return (
    <div
      style={{
        padding: `${compact ? 12 : 18}px ${compact ? 18 : 26}px`,
        borderRadius: 20,
        background: 'rgba(10,10,12,0.42)',
        border: '1px solid rgba(255,255,255,0.16)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 2,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: compact ? 26 : 34, fontWeight: 900, color: ACCENT, ...TABULAR, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: compact ? 12 : 14, fontWeight: 700, letterSpacing: '0.14em', color: SUB }}>{label}</span>
    </div>
  );
}
