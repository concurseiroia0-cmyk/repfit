/**
 * TEMPLATE — MAPA MUSCULAR (card anatômico)
 *
 * Figuras frontal e traseira em SVG, com os músculos trabalhados no treino
 * pintados na cor primária (ACCENT) e o restante em cinza escuro. As
 * estatísticas ficam ENTRE as duas figuras (estilo app de musculação).
 *
 * Dados: `data.muscles` (calculados por selectWorkoutShareData via
 * muscleMap.ts). Preview === PNG: SVG puro + camadas, sem backdrop-filter.
 */

import { ACCENT, SUB, TEXT, TABULAR } from '../glassStyles';
import { fmtBig, fmtInt, safe } from '../formatShareStats';
import type { ShareCardData, ShareFormat, ShareTemplateProps } from '../types';
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
 * Card do mapa muscular. Layout vertical responsivo:
 * topo (nome + data + modalidade) → figuras com stats no meio →
 * legenda + recorde → avatar/nome → marca discreta.
 */
export function MuscleMapTemplate(props: ShareTemplateProps) {
  const { data, format, custom, logoUrl } = props;
  const tall = format.height >= 1700;
  const compact = format.height <= 1200;

  const active = new Set<MuscleId>(data.muscles ?? []);
  const figureW = compact ? Math.round(format.width * 0.16) : Math.round(format.width * 0.17);
  const statsGap = compact ? 12 : 18;

  // Stats: exercícios, volume (ou duração), recordes.
  const stats: { value: string; label: string }[] = [
    { value: fmtInt(data.totals.exercises), label: 'Exercícios' },
  ];
  if (custom.showVolume && data.totals.volumeKg != null && data.totals.volumeKg > 0) {
    stats.push({ value: fmtBig(data.totals.volumeKg), label: data.unit === 'lb' ? 'Volume lb' : 'Volume kg' });
  } else if (data.totals.durationMin != null) {
    stats.push({ value: fmtInt(data.totals.durationMin), label: 'Duração' });
  }
  stats.push({ value: data.record ? '🏆' : '—', label: 'Recorde' });

  return (
    <ShareCardFrame
      {...props}
      darken={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.04) 46%, rgba(0,0,0,0.3) 100%)' }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: `${tall ? 64 : compact ? 34 : 44}px ${compact ? 34 : 48}px 0`,
        }}
      >
        {/* Topo: modalidade + data */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
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
            margin: '14px 0 0',
            fontSize: tall ? 52 : compact ? 34 : 44,
            fontWeight: 900,
            lineHeight: 1.08,
            color: TEXT,
            textAlign: 'center',
            maxWidth: '82%',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textShadow: '0 6px 40px rgba(0,0,0,0.55)',
          }}
        >
          {safe(data.workoutName)}
        </h1>

        {/* Figuras + stats no meio */}
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
          <MuscleStats stats={stats} accent={ACCENT} style={{ flexShrink: 0, gap: compact ? 18 : 30 }} />
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

        {/* Marca discreta no rodapé */}
        <BrandSubtle logoUrl={logoUrl} format={format} />
      </div>
    </ShareCardFrame>
  );
}

/** Marca pequena e discreta no rodapé (visível, mas sem competir com os dados). */
function BrandSubtle({ logoUrl, format }: { logoUrl: string | null; format: ShareFormat }) {
  const bottom = format.height >= 1700 ? 34 : format.height <= 1200 ? 20 : 26;
  const size = format.height >= 1700 ? 30 : 24;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        opacity: 0.55,
        pointerEvents: 'none',
      }}
    >
      {logoUrl ? (
        <img src={logoUrl} alt="" style={{ height: size, width: size, objectFit: 'contain', borderRadius: 6, display: 'block' }} />
      ) : (
        <Barbell size={size * 0.9} />
      )}
      <span style={{ fontSize: size * 0.8, fontWeight: 700, color: '#fff', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        RepFit
      </span>
    </div>
  );
}
