import { ACCENT, SUB, TEXT, TABULAR } from '../glassStyles';
import { fmtBig, fmtInt, safe } from '../formatShareStats';
import type { ShareCardData, ShareFormat, ShareTemplateProps } from '../types';
import { Barbell } from './CardShell';
import { ModePill, ShareCardFrame } from './shared';

/**
 * TEMPLATE — PÔSTER MINIMAL VERTICAL
 * Pôster esportivo minimalista: foto em tela cheia, dados do treino
 * centralizados e empilhados com bastante respiro, traço amarelo (a
 * "assinatura do treino" — polyline gerada do volume de cada exercício,
 * sem mapa/GPS/IA) e a marca centralizada perto do rodapé.
 *
 * Preview === PNG: nada de backdrop-filter; tudo em camadas.
 */
export function PosterMinimalVerticalTemplate(props: ShareTemplateProps) {
  const { data, format, custom, logoUrl } = props;
  const tall = format.height >= 1700;
  const compact = format.height <= 1200;

  // Métricas empilhadas (só as que existem — nunca "0 kg"/undefined/NaN).
  const metrics: { label: string; value: string }[] = [];
  if (custom.showVolume && data.totals.volumeKg != null && data.totals.volumeKg > 0) {
    metrics.push({ label: 'Volume', value: `${fmtBig(data.totals.volumeKg)} ${data.unit}` });
  }
  if (data.totals.durationMin != null) {
    metrics.push({ label: 'Duração', value: `${fmtInt(data.totals.durationMin)} min` });
  }
  metrics.push({ label: 'Séries', value: fmtInt(data.totals.sets) });
  metrics.push({ label: 'Repetições', value: fmtInt(data.totals.reps) });
  if (tall && custom.showExercises) {
    metrics.push({ label: 'Exercícios', value: fmtInt(data.totals.exercises) });
  }

  const name = safe(data.workoutName);
  const long = name.length > 16;
  const nameSize = tall ? 104 : compact ? 72 : 88;
  const valueSize = tall ? 64 : compact ? 44 : 54;
  const labelSize = tall ? 20 : compact ? 15 : 18;
  const rowGap = tall ? 34 : compact ? 22 : 26;

  return (
    <ShareCardFrame
      {...props}
      darken={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.16), rgba(0,0,0,0.09) 42%, rgba(0,0,0,0.26) 100%)' }}
      footer={<CenteredBrand logoUrl={logoUrl} format={format} />}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: `0 ${tall ? 90 : 64}px`,
        }}
      >
        {/* Data discreta no topo */}
        <div
          style={{
            fontSize: labelSize,
            fontWeight: 700,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: SUB,
            opacity: 0.9,
            marginBottom: tall ? 26 : 18,
          }}
        >
          {data.dateLabel}
        </div>

        {/* Nome do treino */}
        <h1
          style={{
            margin: 0,
            fontSize: nameSize,
            fontWeight: 900,
            lineHeight: 1.02,
            letterSpacing: '-0.01em',
            color: TEXT,
            textShadow: '0 6px 40px rgba(0,0,0,0.55)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {name}
        </h1>

        {/* Exercícios em pílula (quando não estão na pilha de métricas) */}
        {!tall && custom.showExercises && (
          <div
            style={{
              marginTop: 18,
              padding: '10px 26px',
              borderRadius: 999,
              background: 'rgba(10,10,12,0.45)',
              border: '1px solid rgba(255,255,255,0.14)',
              fontSize: compact ? 16 : 19,
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            {fmtInt(data.totals.exercises)} Exercícios
          </div>
        )}

        {/* Selo da modalidade (academia/calistenia) */}
        {data.mode && (
          <div style={{ marginTop: 18 }}>
            <ModePill mode={data.mode} compact={compact} />
          </div>
        )}

        {/* Traço amarelo */}
        <div
          style={{
            width: 120,
            height: 5,
            borderRadius: 999,
            background: ACCENT,
            margin: `${tall ? 40 : 28}px 0 ${tall ? 44 : 30}px`,
            boxShadow: '0 4px 22px rgba(245,197,24,0.45)',
          }}
        />

        {/* Métricas empilhadas */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: rowGap }}>
          {metrics.map((m) => (
            <div key={m.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  fontSize: labelSize,
                  fontWeight: 700,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: SUB,
                }}
              >
                {m.label}
              </div>
              <div
                style={{
                  fontSize: valueSize,
                  fontWeight: 900,
                  color: TEXT,
                  ...TABULAR,
                  lineHeight: 1,
                  textShadow: '0 4px 24px rgba(0,0,0,0.5)',
                }}
              >
                {m.value}
              </div>
            </div>
          ))}
        </div>

        {/* Assinatura do treino (polyline amarela dos dados reais) */}
        <WorkoutWave data={data} format={format} compact={compact} tall={tall} />
      </div>
    </ShareCardFrame>
  );
}

/** Marca centralizada perto do rodapé (discreta, sem competir com os dados). */
function CenteredBrand({ logoUrl, format }: { logoUrl: string | null; format: ShareFormat }) {
  const bottom = format.height >= 1700 ? 52 : 38;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 22px',
          borderRadius: 999,
          background: 'rgba(8,8,10,0.5)',
          border: '1px solid rgba(255,255,255,0.14)',
        }}
      >
        {logoUrl ? (
          <img src={logoUrl} alt="" style={{ height: 40, width: 40, objectFit: 'contain', borderRadius: 10, display: 'block' }} />
        ) : (
          <Barbell size={28} />
        )}
        <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '0.02em' }}>RepFit</span>
      </div>
    </div>
  );
}

/**
 * A "impressão digital do treino": polyline gerada do volume (ou reps) de
 * cada exercício. Cada treino produz uma forma diferente, sem mapa nem IA.
 */
function WorkoutWave({ data, format, compact, tall }: { data: ShareCardData; format: ShareFormat; compact: boolean; tall: boolean }) {
  const exs = data.exercises.slice(0, 12).map((ex) => ex.volumeKg ?? ex.reps);
  const max = Math.max(1, ...exs);
  const W = format.width;
  const H = tall ? 230 : compact ? 130 : 170;
  const margin = 130;
  const baseY = H - 18;
  const amp = tall ? 130 : compact ? 70 : 95;
  const n = exs.length;

  let pts: string[];
  if (n <= 1) {
    const v = exs[0] ?? 0;
    pts = [`${W * 0.3},${baseY}`, `${W * 0.5},${baseY - (v / max) * amp * 0.6}`, `${W * 0.7},${baseY}`];
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
      style={{ marginTop: tall ? 52 : 38, pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <polyline points={pts.join(' ')} fill="none" stroke={ACCENT} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" opacity={0.5} />
    </svg>
  );
}
