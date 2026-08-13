import type { CSSProperties } from 'react';
import { ACCENT, SUB, TEXT, TABULAR } from '../glassStyles';
import { fmtBig, fmtInt, safe } from '../formatShareStats';
import type { ShareTemplateProps } from '../types';
import { GlassPanel, ModePill, ShareCardFrame } from './shared';

/**
 * TEMPLATE 2 — PERFORMANCE GLASS
 * Painel vertical de vidro com métricas GRANDES (volume/duração),
 * gráfico de barras do volume por exercício (dados reais) e rodapé
 * de séries/repetições.
 */
export function PerformanceTemplate(props: ShareTemplateProps) {
  const { data, format, custom } = props;
  const tall = format.height >= 1700;
  const compact = format.height <= 1200;
  const pad = tall ? 64 : compact ? 36 : 48;

  const showVol = custom.showVolume && data.totals.volumeKg != null && data.totals.volumeKg > 0;
  const showDur = data.totals.durationMin != null;

  // Barras: volume de cada exercício (ou reps, se o treino não tem carga).
  const bars = data.exercises.slice(0, 6).map((ex) => ({ name: ex.name, v: ex.volumeKg ?? ex.reps }));
  const maxV = Math.max(1, ...bars.map((b) => b.v));
  const chartH = tall ? 330 : compact ? 190 : 260;
  const barMaxH = chartH - 96;

  const panelStyle: CSSProperties = compact
    ? { position: 'absolute', left: pad, right: pad, bottom: pad, top: pad * 1.5 }
    : { position: 'absolute', top: pad, right: pad, bottom: pad, width: Math.round(format.width * 0.56) };

  return (
    <ShareCardFrame
      {...props}
      darken={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.22), rgba(0,0,0,0.03) 50%)' }}
    >
      <GlassPanel
        radius={40}
        style={{
          ...panelStyle,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: tall ? 44 : 32,
          gap: 22,
        }}
      >
        {/* Topo */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ fontSize: compact ? 16 : 20, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', color: ACCENT }}>
              Performance do treino
            </div>
            <ModePill mode={data.mode} compact={compact} />
          </div>
          <h1
            style={{
              margin: '12px 0 0',
              fontSize: tall ? 56 : compact ? 38 : 48,
              fontWeight: 900,
              lineHeight: 1.1,
              color: TEXT,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {safe(data.workoutName)}
          </h1>
          <div style={{ fontSize: compact ? 18 : 22, color: SUB, marginTop: 8 }}>{data.dateLabel}</div>
        </div>

        {/* Métricas grandes */}
        <div style={{ display: 'flex', gap: 30, flexWrap: 'wrap' }}>
          {showVol && (
            <div>
              <div style={{ fontSize: compact ? 13 : 16, fontWeight: 700, letterSpacing: '0.12em', color: SUB }}>VOLUME</div>
              <div style={{ fontSize: tall ? 74 : compact ? 46 : 60, fontWeight: 900, color: TEXT, ...TABULAR, lineHeight: 1.05 }}>
                {fmtBig(data.totals.volumeKg!)}{' '}
                <span style={{ fontSize: '0.45em', color: ACCENT, fontWeight: 800 }}>{data.unit}</span>
              </div>
            </div>
          )}
          {showDur && (
            <div>
              <div style={{ fontSize: compact ? 13 : 16, fontWeight: 700, letterSpacing: '0.12em', color: SUB }}>DURAÇÃO</div>
              <div style={{ fontSize: tall ? 74 : compact ? 46 : 60, fontWeight: 900, color: TEXT, ...TABULAR, lineHeight: 1.05 }}>
                {fmtInt(data.totals.durationMin!)}{' '}
                <span style={{ fontSize: '0.45em', color: ACCENT, fontWeight: 800 }}>min</span>
              </div>
            </div>
          )}
        </div>

        {/* Gráfico de volume por exercício */}
        {bars.length > 0 && (
          <div>
            <div style={{ fontSize: compact ? 13 : 16, fontWeight: 700, letterSpacing: '0.12em', color: SUB, marginBottom: 14 }}>
              {data.hasLoad ? 'GRÁFICO DE VOLUME' : 'GRÁFICO DE REPS'}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10, height: chartH }}>
              {bars.map((b, i) => {
                const h = Math.max(12, (b.v / maxV) * barMaxH);
                const last = i === bars.length - 1;
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
                    <div style={{ fontSize: compact ? 15 : 19, color: SUB, fontWeight: 700, ...TABULAR, marginBottom: 8, whiteSpace: 'nowrap' }}>
                      {fmtBig(b.v)}
                    </div>
                    <div
                      style={{
                        width: '58%',
                        maxWidth: 64,
                        height: h,
                        borderRadius: '32px 32px 8px 8px',
                        background: last ? ACCENT : 'rgba(245,197,24,0.38)',
                        boxShadow: last ? '0 8px 26px rgba(245,197,24,0.3)' : 'none',
                      }}
                    />
                    <div
                      style={{
                        fontSize: compact ? 13 : 17,
                        color: SUB,
                        fontWeight: 600,
                        marginTop: 10,
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {safe(b.name)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Rodapé: séries / repetições */}
        <div style={{ display: 'flex', gap: 36 }}>
          <div>
            <div style={{ fontSize: tall ? 58 : compact ? 38 : 48, fontWeight: 900, color: TEXT, ...TABULAR, lineHeight: 1 }}>
              {fmtInt(data.totals.sets)}
            </div>
            <div style={{ fontSize: compact ? 14 : 17, fontWeight: 700, letterSpacing: '0.1em', color: SUB, marginTop: 6 }}>SÉRIES</div>
          </div>
          <div>
            <div style={{ fontSize: tall ? 58 : compact ? 38 : 48, fontWeight: 900, color: TEXT, ...TABULAR, lineHeight: 1 }}>
              {fmtInt(data.totals.reps)}
            </div>
            <div style={{ fontSize: compact ? 14 : 17, fontWeight: 700, letterSpacing: '0.1em', color: SUB, marginTop: 6 }}>REPETIÇÕES</div>
          </div>
        </div>
      </GlassPanel>
    </ShareCardFrame>
  );
}
