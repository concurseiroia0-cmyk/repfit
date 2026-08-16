/**
 * TEMPLATE — MAPA MUSCULAR (card anatômico premium)
 *
 * Estilo infográfico profissional (referência FITFOLIO):
 *   · fundo preto puro com um brilho radial dourado sutil ao centro;
 *   · logo da marca no topo (cabeçalho, não marca d'água);
 *   · duas figuras anatômicas (frente à esquerda, costas à direita) com os
 *     músculos trabalhados pintados na cor primária (ACCENT — amarelo do app);
 *   · coluna central com 4 estatísticas empilhadas (EXERCÍCIOS · VOLUME KG ·
 *     RECORDE · DURAÇÃO) — número branco grande + rótulo amarelo espaçado;
 *   · paleta mínima: preto, branco, cinza e amarelo do projeto.
 *
 * Dados: `data.muscles` (calculados por selectWorkoutShareData via
 * muscleMap.ts). Preview === PNG: SVG puro + camadas, sem backdrop-filter.
 */

import { ACCENT, SUB, TABULAR } from '../glassStyles';
import { fmtBig, fmtInt, safe } from '../formatShareStats';
import type { ShareTemplateProps } from '../types';
import { MUSCLE_LABELS, type MuscleId } from '../muscleMap';
import { AvatarCircle, ModePill, RecordStrip, ShareCardFrame } from './shared';
import { Barbell } from './CardShell';
import { FrontFigure, BackFigure, MuscleStats } from './MuscleFigure';

/** Legenda compacta dos grupos trabalhados (ex.: "Peito · Ombros · Tríceps"). */
export function MuscleLegend({ muscles }: { muscles: MuscleId[] }) {
  if (muscles.length === 0) return null;
  const labels = muscles.map((m) => MUSCLE_LABELS[m] ?? m);
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '8px 14px',
        maxWidth: '78%',
        margin: '0 auto',
      }}
    >
      {labels.map((l) => (
        <span
          key={l}
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: '#fff',
            padding: '8px 20px',
            borderRadius: 999,
            background: 'rgba(245,197,24,0.12)',
            border: '1px solid rgba(245,197,24,0.38)',
            letterSpacing: '0.04em',
          }}
        >
          {l}
        </span>
      ))}
    </div>
  );
}

/**
 * Cabeçalho do card: a logo da marca (squircle amarelo com haltere) no topo,
 * centralizada — como no infográfico de referência. Sem texto, sem marca
 * d'água: é o logotipo do app compondo o design.
 */
function BrandHeader({ logoUrl, size }: { logoUrl: string | null; size: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt=""
          draggable={false}
          style={{
            width: size,
            height: size,
            objectFit: 'contain',
            borderRadius: size * 0.28,
            background: ACCENT,
            boxShadow: '0 6px 30px rgba(245,197,24,0.28)',
          }}
        />
      ) : (
        <span
          style={{
            width: size,
            height: size,
            borderRadius: size * 0.28,
            background: ACCENT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 30px rgba(245,197,24,0.28)',
          }}
        >
          <Barbell size={size * 0.58} />
        </span>
      )}
    </div>
  );
}

/**
 * Card do mapa muscular — layout vertical simétrico:
 * logo → data/modalidade → nome → [figura | 4 stats | figura] →
 * legenda → recorde → avatar/nome → esforço.
 */
export function MuscleMapTemplate(props: ShareTemplateProps) {
  const { data, format, custom, logoUrl } = props;
  const tall = format.height >= 1700;
  const compact = format.height <= 1200;

  const active = new Set<MuscleId>(data.muscles ?? []);
  const figureW = compact ? Math.round(format.width * 0.185) : Math.round(format.width * 0.2);
  const statsGap = compact ? 16 : 24;

  const hasVolume = custom.showVolume && data.totals.volumeKg != null && data.totals.volumeKg > 0;
  const stats: { value: string; label: string }[] = [
    { value: fmtInt(data.totals.exercises), label: 'Exercícios' },
    { value: hasVolume ? fmtBig(data.totals.volumeKg ?? 0) : '—', label: data.unit === 'lb' ? 'Volume lb' : 'Volume kg' },
    { value: custom.showRecord && data.record ? '🏆' : '—', label: 'Recorde' },
    { value: data.totals.durationMin != null ? fmtInt(data.totals.durationMin) : '—', label: 'Duração' },
  ];

  return (
    <ShareCardFrame
      {...props}
      // Fundo: preto puro (a foto do usuário não compete com o infográfico).
      darken={{ background: 'linear-gradient(180deg, #000, #000)' }}
      watermark={false}
      footer={null}
    >
      {/* Camadas de fundo: preto puro + brilho radial dourado ao centro */}
      <div style={{ position: 'absolute', inset: 0, background: '#000', pointerEvents: 'none' }} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(58% 52% at 50% 55%, rgba(245,197,24,0.13), rgba(245,197,24,0) 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          height: '100%',
          boxSizing: 'border-box',
          padding: `${tall ? 56 : compact ? 28 : 38}px ${compact ? 30 : 44}px 0`,
        }}
      >
        {/* Logo da marca no topo */}
        <BrandHeader logoUrl={logoUrl} size={compact ? 54 : 62} />

        {/* Data + modalidade */}
        <div
          style={{
            marginTop: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {data.mode && <ModePill mode={data.mode} compact={compact} />}
          <span
            style={{
              fontSize: compact ? 16 : 20,
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: SUB,
            }}
          >
            {data.dateLabel}
          </span>
        </div>

        {/* Nome do treino */}
        <h1
          style={{
            margin: '10px 0 0',
            fontSize: tall ? 44 : compact ? 28 : 38,
            fontWeight: 900,
            lineHeight: 1.08,
            color: '#fff',
            textAlign: 'center',
            maxWidth: '82%',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textShadow: '0 6px 40px rgba(0,0,0,0.6)',
          }}
        >
          {safe(data.workoutName)}
        </h1>

        {/* Figuras + coluna de estatísticas */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: statsGap,
            width: '100%',
            minHeight: 0,
          }}
        >
          <FrontFigure active={active} width={figureW} />
          <MuscleStats stats={stats} accent={ACCENT} style={{ flexShrink: 0, gap: compact ? 20 : 30 }} />
          <BackFigure active={active} width={figureW} />
        </div>

        {/* Legenda dos grupos trabalhados */}
        {custom.showExercises && <MuscleLegend muscles={data.muscles ?? []} />}

        {/* Recorde (se houver) */}
        {custom.showRecord && data.record && (
          <div style={{ marginTop: compact ? 14 : 20, width: '100%', display: 'flex', justifyContent: 'center' }}>
            <RecordStrip data={data} style={{ fontSize: compact ? 18 : 22, padding: '12px 22px' }} />
          </div>
        )}

        {/* Avatar + nome do usuário */}
        {custom.showAvatar && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginTop: compact ? 18 : 26,
              padding: '12px 26px',
              borderRadius: 999,
              background: 'rgba(8,8,10,0.55)',
              border: '1px solid rgba(255,255,255,0.14)',
            }}
          >
            <AvatarCircle name={data.username} avatarUrl={data.avatarUrl} size={compact ? 48 : 56} />
            <span style={{ fontSize: compact ? 20 : 24, fontWeight: 800, color: '#fff' }}>
              {safe(data.username) || 'Atleta'}
            </span>
          </div>
        )}

        {/* Esforço médio */}
        {custom.showEffort && data.averageEffort != null && (
          <div style={{ marginTop: compact ? 10 : 14, fontSize: compact ? 16 : 19, color: SUB, fontWeight: 700 }}>
            Esforço médio{' '}
            <span style={{ color: ACCENT, fontWeight: 900, ...TABULAR }}>{fmtInt(data.averageEffort)}/6</span>
          </div>
        )}
      </div>
    </ShareCardFrame>
  );
}
