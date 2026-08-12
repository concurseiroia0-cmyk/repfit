/**
 * Peças compartilhadas dos 5 templates.
 * Regra de ouro: NADA de backdrop-filter aqui — o "vidro" é simulado com
 * camadas (rgba + borda + highlight + sombra), então a prévia na tela é
 * EXATAMENTE igual ao PNG exportado.
 */
import type { CSSProperties, ReactNode } from 'react';
import { ACCENT, CARD_BG, FONT, GLASS_BORDER, SUB, TEXT, TABULAR } from '../glassStyles';
import { fmtBig, fmtInt, fmtNum, monogram, safe } from '../formatShareStats';
import type { ShareCardData, ShareCustomization, ShareFormat, SharePhoto } from '../types';
import { Barbell } from './CardShell';

export const CARD_RADIUS = 32;

function blobStyle(top: number, left: number, size: number, opacity: number): CSSProperties {
  return {
    position: 'absolute',
    top,
    left,
    width: size,
    height: size,
    borderRadius: '50%',
    background: ACCENT,
    opacity,
    filter: 'blur(110px)',
  };
}

/** Linhas de grade finas (HUD / fundo sem foto). */
export function GridLines({ format }: { format: ShareFormat }) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {[0.25, 0.5, 0.75].map((p) => (
        <div
          key={p}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${p * 100}%`,
            height: 1,
            background: 'rgba(255,255,255,0.07)',
          }}
        />
      ))}
    </div>
  );
}

/**
 * Camada de fundo: a foto do usuário (com zoom/posição) ou uma composição
 * premium sem foto (preto profundo + manchas amarelas desfocadas + grid).
 */
export function PhotoLayer({ photo, overlay, format }: { photo: SharePhoto | null; overlay: number; format: ShareFormat }) {
  if (!photo) {
    return (
      <div style={{ position: 'absolute', inset: 0, background: CARD_BG, overflow: 'hidden' }}>
        <div style={blobStyle(-180, -140, 560, 0.1)} />
        <div style={blobStyle(format.height - 500, format.width - 420, 620, 0.07)} />
        <div style={blobStyle(format.height * 0.4, format.width * 0.55, 460, 0.05)} />
        <GridLines format={format} />
      </div>
    );
  }
  const o = Math.min(0.9, Math.max(0, overlay));
  return (
    <div style={{ position: 'absolute', inset: 0, background: CARD_BG, overflow: 'hidden' }}>
      <img
        src={photo.url}
        alt=""
        draggable={false}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `translate(calc(-50% + ${photo.panX}%), calc(-50% + ${photo.panY}%)) scale(${photo.scale})`,
          transformOrigin: 'center',
        }}
      />
      <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${o})` }} />
    </div>
  );
}

/** Painel de vidro (sem backdrop-filter). */
export function GlassPanel({ style, children, radius = 28 }: { style?: CSSProperties; children: ReactNode; radius?: number }) {
  return (
    <div
      style={{
        position: 'relative',
        background: 'rgba(255,255,255,0.07)',
        border: `1px solid ${GLASS_BORDER}`,
        borderRadius: radius,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 12px 40px rgba(0,0,0,0.28)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Moldura do card: fundo (foto ou premium) + vinheta + conteúdo + rodapé da
 * marca. Todos os templates usam esta moldura.
 */
export function ShareCardFrame({
  format,
  photo,
  overlay,
  logoUrl,
  children,
  darken,
  footer,
}: {
  format: ShareFormat;
  photo: SharePhoto | null;
  overlay: number;
  logoUrl: string | null;
  children: ReactNode;
  /** Escurecimento extra específico do template (gradiente, por exemplo). */
  darken?: CSSProperties;
  /** Rodapé personalizado (ex.: marca centralizada). Padrão: canto inferior direito. */
  footer?: ReactNode;
}) {
  return (
    <div
      style={{
        width: format.width,
        height: format.height,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: CARD_RADIUS,
        background: CARD_BG,
        fontFamily: FONT,
        color: TEXT,
      }}
    >
      <PhotoLayer photo={photo} overlay={overlay} format={format} />
      {photo && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(120% 90% at 50% 12%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.45) 100%)',
            pointerEvents: 'none',
          }}
        />
      )}
      {darken && <div style={{ position: 'absolute', inset: 0, ...darken, pointerEvents: 'none' }} />}
      {children}
      {footer ?? <BrandFooterAbs logoUrl={logoUrl} format={format} />}
    </div>
  );
}

/** Logo da marca em pílula discreta no canto inferior direito. */
export function BrandFooterAbs({ logoUrl, format }: { logoUrl: string | null; format: ShareFormat }) {
  const pad = format.height >= 1700 ? 44 : 34;
  return (
    <div
      style={{
        position: 'absolute',
        right: pad,
        bottom: pad,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 18px',
        borderRadius: 999,
        background: 'rgba(8,8,10,0.5)',
        border: '1px solid rgba(255,255,255,0.14)',
      }}
    >
      <BrandMark logoUrl={logoUrl} />
      <span style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '0.02em' }}>RepFit</span>
    </div>
  );
}

function BrandMark({ logoUrl }: { logoUrl: string | null }) {
  if (logoUrl) {
    return <img src={logoUrl} alt="" style={{ height: 42, width: 42, objectFit: 'contain', borderRadius: 10, display: 'block' }} />;
  }
  return <Barbell size={30} />;
}

/** Avatar: monograma em círculo amarelo (o app ainda não tem foto de perfil). */
export function AvatarCircle({ name, size = 72 }: { name: string; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: ACCENT,
        color: '#0B0B0B',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.44,
        fontWeight: 900,
        flexShrink: 0,
      }}
    >
      {monogram(name)}
    </div>
  );
}

/** Métricas em ordem fixa (exercícios · séries · reps · volume|duração). */
export function buildMetrics(data: ShareCardData, custom: ShareCustomization): { value: string; label: string }[] {
  const m = [
    { value: fmtInt(data.totals.exercises), label: 'Exercícios' },
    { value: fmtInt(data.totals.sets), label: 'Séries' },
    { value: fmtInt(data.totals.reps), label: 'Repetições' },
  ];
  if (custom.showVolume && data.totals.volumeKg != null && data.totals.volumeKg > 0) {
    m.push({ value: fmtBig(data.totals.volumeKg), label: data.unit === 'lb' ? 'Volume (lb)' : 'Volume (kg)' });
  } else if (data.totals.durationMin != null) {
    m.push({ value: fmtInt(data.totals.durationMin), label: 'Duração (min)' });
  }
  return m;
}

/** Lista de exercícios em linhas de vidro (nome clampado, métrica à direita). */
export function ExerciseRows({ data, maxRows, compact }: { data: ShareCardData; maxRows: number; compact?: boolean }) {
  const shown = data.exercises.slice(0, maxRows);
  const hidden = data.moreExercises + Math.max(0, data.exercises.length - maxRows);
  const nameSize = compact ? 23 : 28;
  const metaSize = compact ? 20 : 25;
  const padY = compact ? 14 : 20;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {shown.map((ex) => (
        <div
          key={ex.name}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 22,
            padding: `${padY}px 24px`,
            borderRadius: 18,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <span
            style={{
              fontSize: nameSize,
              fontWeight: 700,
              color: TEXT,
              maxWidth: '60%',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {safe(ex.name)}
          </span>
          <span style={{ fontSize: metaSize, color: SUB, fontWeight: 700, ...TABULAR, whiteSpace: 'nowrap' }}>
            {ex.weightKg != null ? `${fmtNum(ex.weightKg)} ${data.unit} · ` : ''}
            {fmtInt(ex.sets)}×{fmtInt(ex.reps)}
          </span>
        </div>
      ))}
      {hidden > 0 && (
        <div style={{ textAlign: 'center', fontSize: metaSize - 2, color: SUB, fontWeight: 600 }}>
          + {hidden} {hidden === 1 ? 'exercício' : 'exercícios'}
        </div>
      )}
    </div>
  );
}

/** Faixa amarela de recorde (só se existir recorde neste treino). */
export function RecordStrip({ data, style }: { data: ShareCardData; style?: CSSProperties }) {
  const rec = data.record;
  if (!rec) return null;
  const value = rec.unit === 'kg' ? `${fmtNum(rec.value)} ${data.unit}` : `${fmtNum(rec.value)} ${rec.unit || ''}`;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        padding: '16px 26px',
        borderRadius: 999,
        background: 'rgba(245,197,24,0.14)',
        border: '1px solid rgba(245,197,24,0.4)',
        fontSize: 24,
        fontWeight: 800,
        color: ACCENT,
        ...TABULAR,
        ...style,
      }}
    >
      <span style={{ fontSize: 20, flexShrink: 0 }}>🏆</span>
      <span
        style={{
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        NOVO RECORDE · {safe(rec.sublabel || data.workoutName)} · {value}
      </span>
    </div>
  );
}

/** Linha de esforço médio (só se registrado). */
export function EffortLine({ data, compact }: { data: ShareCardData; compact?: boolean }) {
  if (data.averageEffort == null) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: compact ? 20 : 24, fontWeight: 700, color: SUB }}>Esforço médio</span>
      <span style={{ fontSize: compact ? 26 : 32, fontWeight: 900, color: ACCENT, ...TABULAR }}>{fmtInt(data.averageEffort)}/6</span>
    </div>
  );
}
