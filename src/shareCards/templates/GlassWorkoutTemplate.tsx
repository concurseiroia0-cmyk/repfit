import { ACCENT, PILL_YELLOW, SUB, TEXT, TABULAR } from '../glassStyles';
import { safe } from '../formatShareStats';
import type { ShareTemplateProps } from '../types';
import { AvatarCircle, EffortLine, ExerciseRows, GlassPanel, ModePill, RecordStrip, ShareCardFrame, buildMetrics } from './shared';

/**
 * TEMPLATE 1 — GLASS
 * Foto em tela cheia + painel de vidro flutuante com o resumo do treino.
 * O vidro é simulado com camadas (rgba + borda + highlight) — sem
 * backdrop-filter, então preview === PNG.
 */
export function GlassWorkoutTemplate(props: ShareTemplateProps) {
  const { data, format, custom } = props;
  const tall = format.height >= 1700;
  const compact = format.height <= 1200;
  const pad = tall ? 68 : compact ? 40 : 52;
  const maxRows = tall ? 5 : compact ? 3 : 4;
  const metrics = buildMetrics(data, custom);
  const hasUser = Boolean(data.username.trim());

  return (
    <ShareCardFrame
      {...props}
      darken={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.12), rgba(0,0,0,0.28) 75%)' }}
    >
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: pad }}>
        <GlassPanel
          radius={tall ? 60 : 48}
          style={{
            width: '100%',
            maxWidth: format.width - pad * 2,
            padding: `${tall ? 56 : 40}px ${tall ? 52 : 38}px ${tall ? 84 : 66}px`,
            display: 'flex',
            flexDirection: 'column',
            gap: tall ? 28 : 20,
          }}
        >
          {/* Topo: avatar + nome + data */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              {custom.showAvatar && <AvatarCircle name={data.username} size={tall ? 84 : 64} />}
              <div>
                <div style={{ fontSize: compact ? 24 : 28, fontWeight: 800, color: TEXT }}>
                  {hasUser ? safe(data.username) : 'Treino concluído'}
                </div>
                <div style={{ fontSize: compact ? 18 : 22, color: SUB, marginTop: 2 }}>{data.dateLabel}</div>
              </div>
            </div>
            {(data.workoutType || data.mode) && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                {data.workoutType && (
                  <span
                    style={{
                      padding: '10px 24px',
                      borderRadius: 999,
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.16)',
                      fontSize: compact ? 18 : 22,
                      fontWeight: 700,
                      color: SUB,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {safe(data.workoutType)}
                  </span>
                )}
                <ModePill mode={data.mode} compact={compact} />
              </div>
            )}
          </div>

          {/* Selo + nome do treino */}
          <div>
            <span
              style={{
                ...PILL_YELLOW,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 24px',
                fontSize: compact ? 17 : 21,
              }}
            >
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" stroke="#0B0B0B" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Treino concluído
            </span>
            <h1
              style={{
                margin: '18px 0 0',
                fontSize: tall ? 68 : compact ? 46 : 58,
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
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${metrics.length}, 1fr)`, gap: 14 }}>
            {metrics.map((m) => (
              <div
                key={m.label}
                style={{
                  padding: `${compact ? 16 : 22}px 10px`,
                  textAlign: 'center',
                  borderRadius: 18,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <div style={{ fontSize: tall ? 60 : compact ? 42 : 54, fontWeight: 900, color: TEXT, ...TABULAR, lineHeight: 1 }}>
                  {m.value}
                </div>
                <div style={{ fontSize: compact ? 18 : 22, color: SUB, marginTop: 8, fontWeight: 600 }}>{m.label}</div>
              </div>
            ))}
          </div>

          {custom.showEffort && <EffortLine data={data} compact={compact} />}

          {custom.showExercises && <ExerciseRows data={data} maxRows={maxRows} compact={compact} />}

          {custom.showRecord && <RecordStrip data={data} />}
        </GlassPanel>
      </div>
    </ShareCardFrame>
  );
}
