/**
 * FIGURA ANATÔMICA (SVG) do template "Mapa muscular".
 *
 * Cada grupo muscular é um path SEPARADO e nomeado (peito, ombros, bíceps…)
 * — assim dá para "pintar" músculo por músculo com a cor primária do app e
 * deixar o restante em cinza escuro. Vista FRONTAL e TRASEIRA lado a lado.
 *
 * Convenção: os paths usam `data-muscle="<id>"` (para testes) e a cor vem de
 * `active` (Set de MuscleId). Tudo em SVG puro (sem backdrop, sem imagens)
 * → preview === PNG exportado.
 */

import type { CSSProperties } from 'react';
import type { MuscleId } from '../muscleMap';
import { ACCENT } from '../glassStyles';

const BODY = '#26262a';
const BODY_EDGE = 'rgba(255,255,255,0.07)';
const LINE = 'rgba(0,0,0,0.28)';

interface FigureProps {
  active: ReadonlySet<MuscleId>;
  /** Largura da figura em px (a altura segue a proporção 200×440). */
  width: number;
}

/** Vista frontal (viewBox 0 0 200 440). */
export function FrontFigure({ active, width }: FigureProps) {
  const on = (m: MuscleId) => (active.has(m) ? ACCENT : BODY);
  const stroke = (m: MuscleId) => (active.has(m) ? LINE : BODY_EDGE);
  return (
    <svg viewBox="0 0 200 440" width={width} height={(width * 440) / 200} aria-hidden="true" style={{ display: 'block' }}>
      {/* Cabeça, pescoço, mãos, joelhos e pés — sempre neutros */}
      <ellipse cx="100" cy="34" rx="15" ry="19" fill={BODY} stroke={BODY_EDGE} />
      <path d="M 92,52 L 108,52 L 110,62 L 90,62 Z" fill={BODY} stroke={BODY_EDGE} />
      {/* Antebraços */}
      <path d="M 58,126 C 55,146 55,168 58,190 C 60,198 66,200 70,197 C 74,188 73,168 71,148 C 69,134 64,126 58,126 Z" fill={BODY} stroke={BODY_EDGE} />
      <path d="M 142,126 C 145,146 145,168 142,190 C 140,198 134,200 130,197 C 126,188 127,168 129,148 C 131,134 136,126 142,126 Z" fill={BODY} stroke={BODY_EDGE} />
      {/* Mãos */}
      <path d="M 58,194 C 57,204 58,212 63,216 C 69,219 73,214 72,206 C 71,198 66,194 58,194 Z" fill={BODY} stroke={BODY_EDGE} />
      <path d="M 142,194 C 143,204 142,212 137,216 C 131,219 127,214 128,206 C 129,198 134,194 142,194 Z" fill={BODY} stroke={BODY_EDGE} />
      {/* Joelhos */}
      <ellipse cx="87" cy="296" rx="9" ry="8" fill={BODY} stroke={BODY_EDGE} />
      <ellipse cx="113" cy="296" rx="9" ry="8" fill={BODY} stroke={BODY_EDGE} />
      {/* Pés */}
      <path d="M 80,374 C 77,385 78,396 85,400 L 102,400 C 103,392 102,386 99,380 C 94,376 90,372 86,370 C 82,369 80,370 80,374 Z" fill={BODY} stroke={BODY_EDGE} />
      <path d="M 120,374 C 123,385 122,396 115,400 L 98,400 C 97,392 98,386 101,380 C 106,376 110,372 114,370 C 118,369 120,370 120,374 Z" fill={BODY} stroke={BODY_EDGE} />

      {/* Trapézio (nuca/ombros) */}
      <path data-muscle="trapezio" d="M 92,54 C 84,58 74,66 70,74 C 68,78 70,80 74,78 C 84,74 94,72 100,72 C 106,72 116,74 126,78 C 130,80 132,78 130,74 C 126,66 116,58 108,54 Z" fill={on('trapezio')} stroke={stroke('trapezio')} strokeWidth="1" />
      {/* Deltoides (ombros) */}
      <path data-muscle="ombros" d="M 72,70 C 62,74 56,82 56,92 C 56,101 62,107 70,109 C 73,103 75,97 77,92 C 77,80 75,72 72,70 Z" fill={on('ombros')} stroke={stroke('ombros')} strokeWidth="1" />
      <path data-muscle="ombros" d="M 128,70 C 138,74 144,82 144,92 C 144,101 138,107 130,109 C 127,103 125,97 123,92 C 123,80 125,72 128,70 Z" fill={on('ombros')} stroke={stroke('ombros')} strokeWidth="1" />
      {/* Peitorais */}
      <path data-muscle="peito" d="M 74,80 C 82,76 92,76 100,78 L 100,106 C 92,106 82,108 74,114 C 70,106 70,90 74,80 Z" fill={on('peito')} stroke={stroke('peito')} strokeWidth="1" />
      <path data-muscle="peito" d="M 126,80 C 118,76 108,76 100,78 L 100,106 C 108,106 118,108 126,114 C 130,106 130,90 126,80 Z" fill={on('peito')} stroke={stroke('peito')} strokeWidth="1" />
      {/* Bíceps */}
      <path data-muscle="biceps" d="M 62,84 C 56,94 54,108 56,120 C 58,126 63,128 67,125 C 71,116 73,104 73,94 C 72,86 67,82 62,84 Z" fill={on('biceps')} stroke={stroke('biceps')} strokeWidth="1" />
      <path data-muscle="biceps" d="M 138,84 C 144,94 146,108 144,120 C 142,126 137,128 133,125 C 129,116 127,104 127,94 C 128,86 133,82 138,84 Z" fill={on('biceps')} stroke={stroke('biceps')} strokeWidth="1" />
      {/* Abdômen */}
      <path data-muscle="abs" d="M 88,104 L 112,104 L 112,160 L 88,160 Z" fill={on('abs')} stroke={stroke('abs')} strokeWidth="1" />
      {active.has('abs') && (
        <g stroke={LINE} strokeWidth="1.2" opacity="0.5">
          <path d="M 88,118 L 112,118" />
          <path d="M 88,132 L 112,132" />
          <path d="M 88,146 L 112,146" />
          <path d="M 100,104 L 100,160" />
        </g>
      )}
      {/* Oblíquos */}
      <path data-muscle="obliquos" d="M 76,108 C 79,104 84,102 88,102 L 88,158 C 82,156 78,151 76,145 C 74,132 74,116 76,108 Z" fill={on('obliquos')} stroke={stroke('obliquos')} strokeWidth="1" />
      <path data-muscle="obliquos" d="M 124,108 C 121,104 116,102 112,102 L 112,158 C 118,156 122,151 124,145 C 126,132 126,116 124,108 Z" fill={on('obliquos')} stroke={stroke('obliquos')} strokeWidth="1" />
      {/* Quadríceps */}
      <path data-muscle="quadriceps" d="M 82,196 C 76,212 74,242 76,268 C 78,282 84,288 92,288 C 97,278 98,258 98,238 C 98,218 96,202 92,196 C 88,192 84,192 82,196 Z" fill={on('quadriceps')} stroke={stroke('quadriceps')} strokeWidth="1" />
      <path data-muscle="quadriceps" d="M 118,196 C 124,212 126,242 124,268 C 122,282 116,288 108,288 C 103,278 102,258 102,238 C 102,218 104,202 108,196 C 112,192 116,192 118,196 Z" fill={on('quadriceps')} stroke={stroke('quadriceps')} strokeWidth="1" />
      {/* Canela (tibial) */}
      <path data-muscle="tibialis" d="M 80,302 C 78,322 78,342 82,360 C 84,370 90,374 94,372 C 96,360 96,340 96,322 C 96,310 92,302 87,300 C 83,299 81,299 80,302 Z" fill={on('tibialis')} stroke={stroke('tibialis')} strokeWidth="1" />
      <path data-muscle="tibialis" d="M 120,302 C 122,322 122,342 118,360 C 116,370 110,374 106,372 C 104,360 104,340 104,322 C 104,310 108,302 113,300 C 117,299 119,299 120,302 Z" fill={on('tibialis')} stroke={stroke('tibialis')} strokeWidth="1" />
    </svg>
  );
}

/** Vista traseira (viewBox 0 0 200 440). */
export function BackFigure({ active, width }: FigureProps) {
  const on = (m: MuscleId) => (active.has(m) ? ACCENT : BODY);
  const stroke = (m: MuscleId) => (active.has(m) ? LINE : BODY_EDGE);
  return (
    <svg viewBox="0 0 200 440" width={width} height={(width * 440) / 200} aria-hidden="true" style={{ display: 'block' }}>
      {/* Cabeça, pescoço, mãos, joelhos, pés — neutros */}
      <ellipse cx="100" cy="34" rx="15" ry="19" fill={BODY} stroke={BODY_EDGE} />
      <path d="M 92,52 L 108,52 L 110,62 L 90,62 Z" fill={BODY} stroke={BODY_EDGE} />
      <path d="M 58,126 C 55,146 55,168 58,190 C 60,198 66,200 70,197 C 74,188 73,168 71,148 C 69,134 64,126 58,126 Z" fill={BODY} stroke={BODY_EDGE} />
      <path d="M 142,126 C 145,146 145,168 142,190 C 140,198 134,200 130,197 C 126,188 127,168 129,148 C 131,134 136,126 142,126 Z" fill={BODY} stroke={BODY_EDGE} />
      <path d="M 58,194 C 57,204 58,212 63,216 C 69,219 73,214 72,206 C 71,198 66,194 58,194 Z" fill={BODY} stroke={BODY_EDGE} />
      <path d="M 142,194 C 143,204 142,212 137,216 C 131,219 127,214 128,206 C 129,198 134,194 142,194 Z" fill={BODY} stroke={BODY_EDGE} />
      <ellipse cx="87" cy="296" rx="9" ry="8" fill={BODY} stroke={BODY_EDGE} />
      <ellipse cx="113" cy="296" rx="9" ry="8" fill={BODY} stroke={BODY_EDGE} />
      <path d="M 80,374 C 77,385 78,396 85,400 L 102,400 C 103,392 102,386 99,380 C 94,376 90,372 86,370 C 82,369 80,370 80,374 Z" fill={BODY} stroke={BODY_EDGE} />
      <path d="M 120,374 C 123,385 122,396 115,400 L 98,400 C 97,392 98,386 101,380 C 106,376 110,372 114,370 C 118,369 120,370 120,374 Z" fill={BODY} stroke={BODY_EDGE} />

      {/* Trapézio (parte superior das costas) */}
      <path data-muscle="trapezio" d="M 88,54 C 76,60 66,72 62,84 C 60,90 62,94 66,92 C 76,86 88,84 94,84 L 92,126 L 108,126 L 106,84 C 112,84 124,86 134,92 C 138,94 140,90 138,84 C 134,72 124,60 112,54 Z" fill={on('trapezio')} stroke={stroke('trapezio')} strokeWidth="1" />
      {/* Deltoides posteriores */}
      <path data-muscle="ombros" d="M 70,80 C 62,84 58,92 58,100 C 58,108 62,112 68,112 C 72,106 74,98 75,92 C 75,84 73,80 70,80 Z" fill={on('ombros')} stroke={stroke('ombros')} strokeWidth="1" />
      <path data-muscle="ombros" d="M 130,80 C 138,84 142,92 142,100 C 142,108 138,112 132,112 C 128,106 126,98 125,92 C 125,84 127,80 130,80 Z" fill={on('ombros')} stroke={stroke('ombros')} strokeWidth="1" />
      {/* Tríceps */}
      <path data-muscle="triceps" d="M 64,92 C 58,104 56,118 58,130 C 60,135 64,136 68,133 C 72,124 74,110 74,100 C 73,94 69,90 64,92 Z" fill={on('triceps')} stroke={stroke('triceps')} strokeWidth="1" />
      <path data-muscle="triceps" d="M 136,92 C 142,104 144,118 142,130 C 140,135 136,136 132,133 C 128,124 126,110 126,100 C 127,94 131,90 136,92 Z" fill={on('triceps')} stroke={stroke('triceps')} strokeWidth="1" />
      {/* Dorsais (lats) */}
      <path data-muscle="lats" d="M 74,100 C 68,116 64,140 66,160 C 68,172 76,176 82,170 C 90,162 94,148 96,132 C 94,118 88,106 74,100 Z" fill={on('lats')} stroke={stroke('lats')} strokeWidth="1" />
      <path data-muscle="lats" d="M 126,100 C 132,116 136,140 134,160 C 132,172 124,176 118,170 C 110,162 106,148 104,132 C 106,118 112,106 126,100 Z" fill={on('lats')} stroke={stroke('lats')} strokeWidth="1" />
      {/* Lombar */}
      <path data-muscle="lombar" d="M 92,138 L 108,138 L 106,190 L 94,190 Z" fill={on('lombar')} stroke={stroke('lombar')} strokeWidth="1" />
      {/* Glúteos */}
      <path data-muscle="gluteos" d="M 82,192 C 90,188 98,188 104,192 L 104,210 C 98,218 90,218 84,212 C 80,206 80,198 82,192 Z" fill={on('gluteos')} stroke={stroke('gluteos')} strokeWidth="1" />
      <path data-muscle="gluteos" d="M 118,192 C 110,188 102,188 96,192 L 96,210 C 102,218 110,218 116,212 C 120,206 120,198 118,192 Z" fill={on('gluteos')} stroke={stroke('gluteos')} strokeWidth="1" />
      {/* Posterior de coxa */}
      <path data-muscle="posterior" d="M 82,214 C 76,230 74,252 76,272 C 78,284 84,288 92,288 C 97,278 98,258 98,240 C 98,224 96,214 92,212 C 88,210 84,210 82,214 Z" fill={on('posterior')} stroke={stroke('posterior')} strokeWidth="1" />
      <path data-muscle="posterior" d="M 118,214 C 124,230 126,252 124,272 C 122,284 116,288 108,288 C 103,278 102,258 102,240 C 102,224 104,214 108,212 C 112,210 116,210 118,214 Z" fill={on('posterior')} stroke={stroke('posterior')} strokeWidth="1" />
      {/* Panturrilha */}
      <path data-muscle="panturrilha" d="M 80,296 C 78,316 78,338 82,356 C 84,366 90,370 94,368 C 96,356 96,336 96,318 C 96,306 92,298 87,296 C 83,295 81,295 80,296 Z" fill={on('panturrilha')} stroke={stroke('panturrilha')} strokeWidth="1" />
      <path data-muscle="panturrilha" d="M 120,296 C 122,316 122,338 118,356 C 116,366 110,370 106,368 C 104,356 104,336 104,318 C 104,306 108,298 113,296 C 117,295 119,295 120,296 Z" fill={on('panturrilha')} stroke={stroke('panturrilha')} strokeWidth="1" />
    </svg>
  );
}

/** Coluna de estatísticas que fica ENTRE as duas figuras (estilo FITFOLIO). */
export function MuscleStats({
  stats,
  accent,
  style,
}: {
  stats: { value: string; label: string }[];
  accent: string;
  style?: CSSProperties;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 26, alignItems: 'center', ...style }}>
      {stats.map((s) => (
        <div key={s.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div
            style={{
              fontSize: 46,
              fontWeight: 900,
              color: '#fff',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
              textShadow: '0 4px 24px rgba(0,0,0,0.5)',
            }}
          >
            {s.value}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: accent, opacity: 0.95 }}>
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}
