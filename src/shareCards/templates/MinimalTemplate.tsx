import { ACCENT, SUB, TABULAR } from '../glassStyles';
import { fmtNum, safe } from '../formatShareStats';
import type { ShareTemplateProps } from '../types';
import { GlassPanel, ModePill, ShareCardFrame, buildMetrics } from './shared';

/**
 * TEMPLATE 4 — MINIMAL
 * Extremamente limpo: pequeno painel de métricas no topo, título tipográfico
 * GRANDE em amarelo direto sobre a foto, recorde em linha discreta.
 */
export function MinimalTemplate(props: ShareTemplateProps) {
  const { data, format, custom } = props;
  const tall = format.height >= 1700;
  const compact = format.height <= 1200;
  const pad = tall ? 72 : compact ? 44 : 56;
  const metrics = buildMetrics(data, custom);

  const name = safe(data.workoutName);
  const long = name.length > 12;
  const veryLong = name.length > 26;
  const base = tall ? 190 : compact ? 132 : 160;
  const titleSize = veryLong ? base * 0.62 : long ? base * 0.78 : base;

  const rec = custom.showRecord ? data.record : null;

  return (
    <ShareCardFrame {...props}>
      {/* Painel de métricas no topo */}
      <div style={{ position: 'absolute', top: pad, left: pad, right: pad, display: 'flex', justifyContent: 'center' }}>
        <GlassPanel
          radius={999}
          style={{
            padding: `${compact ? 16 : 22}px ${compact ? 26 : 36}px`,
            display: 'flex',
            alignItems: 'center',
            gap: compact ? 20 : 28,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {metrics.map((m, i) => (
            <div key={m.label} style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontSize: compact ? 26 : 34, fontWeight: 900, color: ACCENT, ...TABULAR }}>{m.value}</span>
              <span style={{ fontSize: compact ? 15 : 18, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: SUB }}>
                {m.label}
              </span>
              {i < metrics.length - 1 && <span style={{ marginLeft: 8, color: 'rgba(255,255,255,0.25)', fontSize: 26 }}>·</span>}
            </div>
          ))}
        </GlassPanel>
      </div>

      {/* Recorde (discreto, abaixo do painel) */}
      {rec && (
        <div
          style={{
            position: 'absolute',
            top: pad + (compact ? 76 : 96),
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            padding: `0 ${pad}px`,
          }}
        >
          <div
            style={{
              padding: '12px 26px',
              borderRadius: 999,
              background: 'rgba(10,10,12,0.5)',
              border: '1px solid rgba(245,197,24,0.45)',
              color: ACCENT,
              fontSize: compact ? 19 : 23,
              fontWeight: 800,
              ...TABULAR,
              maxWidth: '90%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            🏆 NOVO RECORDE · {safe(rec.sublabel || data.workoutName)} ·{' '}
            {rec.unit === 'kg' ? `${fmtNum(rec.value)} ${data.unit}` : `${fmtNum(rec.value)} ${rec.unit || ''}`}
          </div>
        </div>
      )}

      {/* Título gigante */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: `0 ${pad * 1.4}px ${pad * 1.2}px`,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: titleSize,
            fontWeight: 900,
            letterSpacing: '-0.02em',
            lineHeight: 0.98,
            color: ACCENT,
            textShadow: '0 6px 46px rgba(0,0,0,0.55)',
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
            marginTop: 26,
            fontSize: compact ? 20 : 24,
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            opacity: 0.9,
            textShadow: '0 2px 18px rgba(0,0,0,0.6)',
          }}
        >
          {data.dateLabel}
        </div>
        {data.mode && (
          <div style={{ marginTop: 22 }}>
            <ModePill mode={data.mode} compact={compact} />
          </div>
        )}
      </div>
    </ShareCardFrame>
  );
}
