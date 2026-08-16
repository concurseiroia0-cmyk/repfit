/**
 * FIGURA ANATÔMICA (SVG) do template "Mapa muscular".
 *
 * Desenho em duas camadas:
 *   1. SILHUETA única do corpo (uma linha fechada contínua, com curvas
 *      suaves e proporções atléticas) na cor neutra — é ela que dá o
 *      contorno limpo da figura, sem "quebra-cabeça" entre as partes;
 *   2. MÚSCULOS sobrepostos: cada grupo é um path separado e nomeado
 *      (`data-muscle`), pintado de AMARELO quando trabalhado no treino ou
 *      da mesma cor da silhueta quando não (fica invisível, "embutido").
 *
 * Assim a figura tem aparência coesa como as referências anatômicas, e o
 * destaque amarelo mostra exatamente os grupos trabalhados. Músculos
 * bilaterais são desenhados do lado esquerdo e espelhados
 * (`transform="translate(200 0) scale(-1 1)"`) — desenho simétrico e fácil
 * de manter. Sem backdrop, sem imagens: SVG puro (preview === PNG).
 */

import type { CSSProperties, ReactNode } from 'react';
import type { MuscleId } from '../muscleMap';
import { ACCENT } from '../glassStyles';

const BODY = '#333336';
const LINE = 'rgba(0,0,0,0.35)';
const LINE_SOFT = 'rgba(0,0,0,0.22)';

interface FigureProps {
  active: ReadonlySet<MuscleId>;
  /** Largura da figura em px (a altura segue a proporção 200×440). */
  width: number;
}

/**
 * Espelha o desenho do lado esquerdo para o direito (x → 200 − x).
 * IMPORTANTE: renderiza o lado ORIGINAL e o espelhado (dois grupos) —
 * um `<g transform>` por si só NÃO duplica o conteúdo.
 */
function Mirror({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <g transform="translate(200 0) scale(-1 1)">{children}</g>
    </>
  );
}

/**
 * Silhueta única do corpo (frente e costas compartilham o contorno).
 * Uma ÚNICA forma fechada (sem espelho) — evita qualquer costura no centro.
 */
function BodySilhouette() {
  return (
    <path
      d="M 100,9
         C 86,9 77,17 76,29 C 75,38 79,45 85,48 C 82,52 80,56 79,61 C 69,65 61,71 57,79
         C 53,87 51,96 52,104 C 51,116 49,130 48,144 C 47,158 46,172 46,186 C 46,198 47,208 49,216
         C 50,222 52,228 55,233 C 53,238 55,245 59,248 C 63,251 69,249 72,244 C 74,239 74,233 74,227
         C 76,217 78,207 80,197 C 82,187 83,177 84,167 C 85,155 85,143 84,133 C 83,123 82,117 82,113
         C 83,126 84,140 85,152 C 86,164 86,178 85,190 C 84,200 83,208 82,214 C 81,220 81,226 82,232
         C 83,242 83,254 81,266 C 79,280 78,292 78,304 C 78,316 79,328 80,340 C 81,352 81,364 80,376
         C 79,386 78,394 77,400 C 76,408 77,415 81,419 C 84,422 88,423 92,423 C 96,424 100,424 100,424
         C 100,424 104,424 108,423 C 112,423 116,422 119,419 C 123,415 124,408 123,400 C 122,394 121,386 120,376
         C 119,364 119,352 120,340 C 121,328 122,316 122,304 C 122,292 121,280 119,266 C 117,254 117,242 118,232
         C 119,226 119,220 118,214 C 117,208 116,200 115,190 C 114,178 114,164 115,152 C 116,140 117,126 118,113
         C 118,117 117,123 116,133 C 115,143 115,155 116,167 C 117,177 118,187 120,197 C 122,207 124,217 126,227
         C 126,233 126,239 128,244 C 131,249 137,251 141,248 C 145,245 147,238 145,233 C 148,228 150,222 151,216
         C 153,208 154,198 154,186 C 154,172 153,158 152,144 C 151,130 149,116 148,104 C 149,96 147,87 143,79
         C 139,71 131,65 121,61 C 120,56 118,52 115,48 C 121,45 125,38 124,29 C 123,17 114,9 100,9
         Z"
      fill={BODY}
    />
  );
}

/** Vista frontal (viewBox 0 0 200 440). */
export function FrontFigure({ active, width }: FigureProps) {
  const on = (m: MuscleId) => (active.has(m) ? ACCENT : BODY);
  return (
    <svg viewBox="0 0 200 440" width={width} height={(width * 440) / 200} aria-hidden="true" style={{ display: 'block' }}>
      <BodySilhouette />

      {/* Músculos frontais (espelhados) */}
      <Mirror>
        {/* Deltoide (ombro) */}
        <path
          data-muscle="ombros"
          d="M 67,78 C 59,82 54,89 53,97 C 52,106 56,112 63,114 C 68,108 71,100 72,92 C 72,84 70,79 67,78 Z"
          fill={on('ombros')}
        />
        {/* Peitoral */}
        <path
          data-muscle="peito"
          d="M 100,76 C 92,74 84,76 79,81 C 74,86 72,94 73,103 C 74,112 79,117 86,116 C 94,114 99,110 100,106 Z"
          fill={on('peito')}
        />
        {/* Bíceps */}
        <path
          data-muscle="biceps"
          d="M 63,90 C 57,100 54,114 55,128 C 56,136 60,140 65,137 C 69,129 71,114 71,101 C 70,93 67,89 63,90 Z"
          fill={on('biceps')}
        />
        {/* Oblíquo */}
        <path
          data-muscle="obliquos"
          d="M 79,110 C 76,118 74,128 74,138 C 74,150 77,160 82,166 L 88,163 L 88,112 C 85,109 82,109 79,110 Z"
          fill={on('obliquos')}
        />
        {/* Quadríceps */}
        <path
          data-muscle="quadriceps"
          d="M 86,198 C 80,212 77,240 79,268 C 81,284 86,292 93,296 C 98,296 100,290 99,280 C 98,258 97,232 94,210 C 92,200 89,196 86,198 Z"
          fill={on('quadriceps')}
        />
        {/* Canela (tibial anterior) */}
        <path
          data-muscle="tibialis"
          d="M 85,312 C 83,328 83,350 86,368 C 88,378 92,382 95,380 C 97,370 96,350 95,330 C 94,318 91,310 87,309 C 85,308 84,309 85,312 Z"
          fill={on('tibialis')}
        />
        {/* Definição do V do quadríceps (só quando ativo) */}
        {active.has('quadriceps') && (
          <g stroke={LINE_SOFT} strokeWidth="1.2" fill="none" opacity="0.9">
            <path d="M 85,214 C 82,230 81,250 83,270" />
            <path d="M 97,214 C 96,232 96,252 98,270" />
          </g>
        )}
      </Mirror>

      {/* Trapézio (nuca/ombros) */}
      <path
        data-muscle="trapezio"
        d="M 88,50 C 80,54 72,60 67,68 C 63,75 61,82 63,88 C 67,87 73,85 79,84 C 81,76 83,66 88,58 C 90,55 93,52 100,50 C 107,52 110,55 112,58 C 117,66 119,76 121,84 C 127,85 133,87 137,88 C 139,82 137,75 133,68 C 128,60 120,54 112,50 Z"
        fill={on('trapezio')}
      />

      {/* Abdômen (six-pack) */}
      <path
        data-muscle="abs"
        d="M 89,112 C 94,110 106,110 111,112 C 113,122 113,140 112,152 C 111,161 108,164 100,164 C 92,164 89,161 88,152 C 87,140 87,122 89,112 Z"
        fill={on('abs')}
      />
      {active.has('abs') && (
        <g stroke={LINE} strokeWidth="1.3" opacity="0.55">
          <path d="M 89,124 L 111,124" />
          <path d="M 89,137 L 111,137" />
          <path d="M 89,150 L 111,150" />
          <path d="M 100,112 L 100,164" />
        </g>
      )}
      {/* Linha do esterno (só com peito ativo) */}
      {active.has('peito') && (
        <path d="M 100,76 L 100,106" stroke={LINE_SOFT} strokeWidth="1.2" opacity="0.9" />
      )}
    </svg>
  );
}

/** Vista traseira (viewBox 0 0 200 440). */
export function BackFigure({ active, width }: FigureProps) {
  const on = (m: MuscleId) => (active.has(m) ? ACCENT : BODY);
  return (
    <svg viewBox="0 0 200 440" width={width} height={(width * 440) / 200} aria-hidden="true" style={{ display: 'block' }}>
      <BodySilhouette />

      {/* Músculos dorsais (espelhados) */}
      <Mirror>
        {/* Deltoide posterior */}
        <path
          data-muscle="ombros"
          d="M 70,80 C 62,84 57,91 56,99 C 55,107 59,112 65,113 C 70,107 73,99 74,91 C 74,84 72,80 70,80 Z"
          fill={on('ombros')}
        />
        {/* Tríceps */}
        <path
          data-muscle="triceps"
          d="M 63,92 C 57,104 54,118 56,132 C 58,138 62,140 67,137 C 71,129 73,114 73,102 C 72,95 68,91 63,92 Z"
          fill={on('triceps')}
        />
        {/* Dorsal (latíssimo) */}
        <path
          data-muscle="lats"
          d="M 72,98 C 66,112 63,132 65,150 C 67,166 72,178 80,184 C 87,189 93,187 97,179 C 96,156 93,126 91,108 C 89,100 81,96 72,98 Z"
          fill={on('lats')}
        />
        {/* Glúteo */}
        <path
          data-muscle="gluteos"
          d="M 100,190 C 94,188 86,189 82,195 C 78,202 78,212 84,219 C 90,224 96,223 100,219 Z"
          fill={on('gluteos')}
        />
        {/* Posterior de coxa */}
        <path
          data-muscle="posterior"
          d="M 86,222 C 79,236 76,256 78,274 C 80,286 85,292 93,296 C 98,296 100,290 99,280 C 98,260 97,240 93,220 Z"
          fill={on('posterior')}
        />
        {/* Panturrilha */}
        <path
          data-muscle="panturrilha"
          d="M 85,310 C 82,322 82,342 85,360 C 87,372 91,378 94,376 C 96,364 96,342 94,324 C 93,314 90,308 86,307 C 84,306 83,307 85,310 Z"
          fill={on('panturrilha')}
        />
        {/* Ferradura do tríceps (só quando ativo) */}
        {active.has('triceps') && (
          <g stroke={LINE_SOFT} strokeWidth="1.2" fill="none" opacity="0.9">
            <path d="M 56,114 C 59,119 63,120 66,117" />
            <path d="M 56,126 C 59,131 63,132 66,129" />
          </g>
        )}
        {/* Linha do dorsal (V das costas) */}
        {active.has('lats') && (
          <g stroke={LINE_SOFT} strokeWidth="1.2" fill="none" opacity="0.9">
            <path d="M 66,114 C 64,134 65,156 72,176" />
          </g>
        )}
        {/* Dobra inferior do glúteo */}
        {active.has('gluteos') && (
          <path d="M 79,207 C 86,212 93,212 100,209" stroke={LINE_SOFT} strokeWidth="1.2" fill="none" opacity="0.9" />
        )}
        {/* Definição do posterior de coxa */}
        {active.has('posterior') && (
          <g stroke={LINE_SOFT} strokeWidth="1.2" fill="none" opacity="0.9">
            <path d="M 86,234 C 82,248 81,264 83,282" />
            <path d="M 97,232 C 95,248 95,264 97,284" />
          </g>
        )}
      </Mirror>

      {/* Trapézio (escudo das costas) */}
      <path
        data-muscle="trapezio"
        d="M 100,48 C 90,50 81,56 76,64 C 72,71 71,78 74,84 C 77,89 81,90 85,88 C 88,102 90,118 91,132 L 109,132 C 110,118 112,102 115,88 C 119,90 123,89 126,84 C 129,78 128,71 124,64 C 119,56 110,50 100,48 Z"
        fill={on('trapezio')}
      />
      {active.has('trapezio') && (
        <g stroke={LINE} strokeWidth="1.3" opacity="0.55">
          <path d="M 80,64 C 88,70 112,70 120,64" />
          <path d="M 84,86 C 92,92 108,92 116,86" />
          <path d="M 87,108 C 94,112 106,112 113,108" />
        </g>
      )}

      {/* Lombar (coluna central) */}
      <path
        data-muscle="lombar"
        d="M 94,140 L 106,140 L 106,190 C 103,193 97,193 94,190 Z"
        fill={on('lombar')}
      />
      {active.has('lombar') && (
        <g stroke={LINE_SOFT} strokeWidth="1.2" opacity="0.9">
          <path d="M 94,152 L 106,152" />
          <path d="M 94,164 L 106,164" />
          <path d="M 94,176 L 106,176" />
        </g>
      )}
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
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: accent,
              opacity: 0.95,
            }}
          >
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}
