/**
 * FIGURA ANATÔMICA (SVG) do template "Mapa muscular".
 *
 * Estilo baseado na referência anatômica (figura muscular com mapa de
 * grupos): TODOS os músculos ficam sempre visíveis — cada grupo é um path
 * separado e nomeado (`data-muscle`), preenchido com um cinza levemente
 * mais claro que o corpo e contornado por uma linha escura de separação.
 * Os músculos TRABALHADOS no treino são pintados de amarelo vivo; os demais
 * permanecem no cinza de definição. As partes neutras (cabeça, antebraços,
 * mãos, canelas e pés) ficam no cinza escuro do corpo.
 *
 * Proporções atléticas (viewBox 200×440, centro x=100): ombros largos
 * (~148), cintura marcada (~58), coxas e panturrilhas definidas, braços
 * afastados do tronco (o "V" do fisiculturismo) — sem a silhueta fina e
 * alongada da versão anterior.
 *
 * Estrutura em camadas:
 *   1. SILHUETA (duas metades — esquerda e espelho à direita) — cinza
 *      escuro do corpo (#202225), cobrindo cabeça/membros neutros;
 *   2. MÚSCULOS sobrepostos — cinza de definição (inativo) ou amarelo
 *      (ativo), com stroke escuro de separação entre os grupos.
 *
 * Músculos bilaterais são desenhados do lado esquerdo e espelhados
 * (`translate(200 0) scale(-1 1)`), com o lado ORIGINAL também renderizado.
 * Sem backdrop, sem imagens: SVG puro (preview === PNG exportado).
 */

import type { CSSProperties, ReactNode } from 'react';
import type { MuscleId } from '../muscleMap';
import { ACCENT } from '../glassStyles';

const BODY = '#202225';
const MUSCLE = '#3a3e46';
const SEAM = 'rgba(0,0,0,0.72)';
const SEAM_SOFT = 'rgba(0,0,0,0.45)';

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
 * Metade esquerda da silhueta (do topo da cabeça ao centro dos pés).
 * A metade direita é o espelho desta (ver BodySilhouette). As duas metades
 * juntas formam o corpo; sem stroke, a emenda em x=100 é invisível.
 */
const BODY_LEFT =
  'M 100,8' +
  ' C 88,8 78,15 74,26' +
  ' C 71,37 77,45 85,47' +
  ' C 88,49 91,51 93,55' +
  ' C 86,57 76,59 66,63' +
  ' C 48,67 32,71 27,79' +
  ' C 24,88 27,95 33,100' +
  ' C 36,112 39,128 42,144' +
  ' C 45,156 46,166 46,190' +
  ' C 46,204 45,212 43,222' +
  ' C 47,234 55,237 63,233' +
  ' C 65,226 63,212 63,190' +
  ' C 63,166 61,150 57,128' +
  ' C 56,118 57,110 58,106' +
  ' C 61,112 65,120 68,128' +
  ' C 70,138 71,148 71,156' +
  ' C 71,166 70,176 71,186' +
  ' C 71,196 71,208 71,220' +
  ' C 69,232 68,244 67,256' +
  ' C 68,268 70,280 73,290' +
  ' C 75,298 76,302 76,306' +
  ' C 75,316 73,328 71,340' +
  ' C 70,352 70,364 72,374' +
  ' C 74,384 76,392 78,398' +
  ' C 79,404 79,410 76,414' +
  ' C 73,421 78,427 86,429' +
  ' C 93,430 98,427 100,425' +
  ' Z';

/** Silhueta do corpo: metade esquerda + espelho à direita (mesmo preenchimento). */
function BodySilhouette() {
  return (
    <>
      <path d={BODY_LEFT} fill={BODY} />
      <path d={BODY_LEFT} fill={BODY} transform="translate(200 0) scale(-1 1)" />
    </>
  );
}

/** Props comuns de um path de músculo (preenchimento + costura escura). */
function muscleProps(m: MuscleId, active: ReadonlySet<MuscleId>) {
  return {
    fill: active.has(m) ? ACCENT : MUSCLE,
    stroke: SEAM,
    strokeWidth: 1.2,
    strokeLinejoin: 'round' as const,
  };
}

/** Traço de definição (só quando o músculo está ativo). */
function detailProps() {
  return { stroke: SEAM_SOFT, strokeWidth: 1.2, fill: 'none', opacity: 0.9 };
}

// ---------------------------------------------------------------------------
// Paths (lado ESQUERDO; os bilaterais são espelhados pelo <Mirror>)
// ---------------------------------------------------------------------------

/** Trapézio frontal: jugo do pescoço aos deltoides (path central). */
const TRAPEZIO_FRONT =
  'M 100,56' +
  ' C 94,56 91,58 90,60' +
  ' C 86,62 80,63 74,65' +
  ' C 62,67 54,69 49,73' +
  ' C 45,77 44,81 48,84' +
  ' C 56,83 66,81 74,81' +
  ' C 76,77 78,73 80,70' +
  ' C 86,73 93,75 100,75' +
  ' C 107,75 114,73 120,70' +
  ' C 122,73 124,77 126,81' +
  ' C 134,81 144,83 152,84' +
  ' C 156,81 155,77 151,73' +
  ' C 146,69 138,67 126,65' +
  ' C 120,63 114,62 110,60' +
  ' C 109,58 106,56 100,56 Z';

/** Trapézio das costas: escudo do pescoço ao meio das costas (path central). */
const TRAPEZIO_BACK =
  'M 100,54' +
  ' C 94,54 91,56 90,58' +
  ' C 86,60 80,62 74,64' +
  ' C 64,66 58,68 54,72' +
  ' C 50,76 49,81 52,85' +
  ' C 61,84 71,82 77,85' +
  ' C 81,96 85,110 87,124' +
  ' L 113,124' +
  ' C 115,110 119,96 123,85' +
  ' C 129,82 139,84 148,85' +
  ' C 151,81 150,76 146,72' +
  ' C 142,68 136,66 126,64' +
  ' C 120,62 114,60 110,58' +
  ' C 109,56 106,54 100,54 Z';

/** Deltoide (frente e costas usam o mesmo cap, casado com o contorno). */
const DELT =
  'M 66,63' +
  ' C 48,67 32,71 27,79' +
  ' C 24,88 27,95 33,100' +
  ' C 38,102 42,99 44,93' +
  ' C 46,85 49,77 54,72' +
  ' C 57,68 60,65 66,63 Z';

const PEC =
  'M 100,62' +
  ' C 92,60 84,62 78,66' +
  ' C 71,71 66,78 64,87' +
  ' C 62,96 64,102 70,105' +
  ' C 76,108 82,107 88,103' +
  ' C 93,99 97,96 100,94 Z';

const BICEPS =
  'M 62,102' +
  ' C 54,108 49,120 50,132' +
  ' C 51,143 56,151 62,153' +
  ' C 66,152 68,148 68,143' +
  ' C 67,132 66,118 65,108' +
  ' C 64,103 63,101 62,102 Z';

const OBLIQUO =
  'M 84,106' +
  ' C 77,108 72,114 70,124' +
  ' C 68,135 69,146 73,152' +
  ' C 78,157 86,159 91,155' +
  ' C 93,147 92,136 90,125' +
  ' C 88,115 86,109 84,106 Z';

const ABS =
  'M 100,100' +
  ' C 90,98 82,102 78,109' +
  ' C 74,117 73,128 74,138' +
  ' C 75,148 79,156 85,160' +
  ' C 91,163 109,163 115,160' +
  ' C 121,156 125,148 126,138' +
  ' C 127,128 126,117 122,109' +
  ' C 118,102 110,98 100,100 Z';

const QUADRICEPS =
  'M 100,190' +
  ' C 92,188 84,191 78,197' +
  ' C 73,204 70,214 69,227' +
  ' C 69,240 69,252 70,266' +
  ' C 72,276 75,284 80,290' +
  ' C 86,295 93,296 100,293' +
  ' C 102,287 102,276 102,262' +
  ' C 102,250 102,214 100,190 Z';

const TIBIALIS =
  'M 88,298' +
  ' C 82,297 77,302 75,308' +
  ' C 74,318 72,330 72,344' +
  ' C 72,358 73,372 75,383' +
  ' C 79,391 84,394 88,391' +
  ' C 91,385 91,371 90,355' +
  ' C 89,337 89,315 88,298 Z';

const TRICEPS =
  'M 58,100' +
  ' C 50,106 45,118 45,130' +
  ' C 45,141 49,149 55,152' +
  ' C 61,154 64,150 65,144' +
  ' C 64,132 63,117 61,106' +
  ' C 60,101 59,99 58,100 Z';

const LAT =
  'M 100,94' +
  ' C 92,92 84,96 78,102' +
  ' C 71,109 65,113 61,119' +
  ' C 57,126 56,135 58,144' +
  ' C 60,152 64,158 69,161' +
  ' C 76,165 84,167 92,166' +
  ' C 97,165 100,162 100,158' +
  ' C 100,136 100,114 100,94 Z';

const LOMBAR =
  'M 92,122' +
  ' L 108,122' +
  ' L 108,170' +
  ' C 104,175 96,175 92,170 Z';

const GLUTEO =
  'M 100,170' +
  ' C 92,168 84,170 78,175' +
  ' C 73,180 71,188 71,196' +
  ' C 71,204 74,211 79,214' +
  ' C 86,217 94,214 100,209' +
  ' C 100,196 100,183 100,170 Z';

const POSTERIOR =
  'M 100,217' +
  ' C 92,215 84,217 78,223' +
  ' C 73,229 70,239 69,250' +
  ' C 68,262 69,274 72,283' +
  ' C 76,291 83,295 89,293' +
  ' C 95,291 99,285 100,277' +
  ' C 100,256 100,236 100,217 Z';

const PANTURRILHA =
  'M 96,296' +
  ' C 88,294 81,298 76,305' +
  ' C 73,314 72,328 71,342' +
  ' C 71,356 72,370 75,381' +
  ' C 78,389 83,392 88,390' +
  ' C 93,387 96,377 96,361' +
  ' C 96,341 96,318 96,296 Z';

// ---------------------------------------------------------------------------
// Vista frontal
// ---------------------------------------------------------------------------

/** Vista frontal (viewBox 0 0 200 440). */
export function FrontFigure({ active, width }: FigureProps) {
  return (
    <svg viewBox="0 0 200 440" width={width} height={(width * 440) / 200} aria-hidden="true" style={{ display: 'block' }}>
      <BodySilhouette />

      {/* Trapézio (jugo do pescoço aos ombros) */}
      <path data-muscle="trapezio" d={TRAPEZIO_FRONT} {...muscleProps('trapezio', active)} />

      {/* Músculos frontais (espelhados) */}
      <Mirror>
        {/* Deltoide (ombro) */}
        <path data-muscle="ombros" d={DELT} {...muscleProps('ombros', active)} />
        {/* Peitoral */}
        <path data-muscle="peito" d={PEC} {...muscleProps('peito', active)} />
        {/* Bíceps */}
        <path data-muscle="biceps" d={BICEPS} {...muscleProps('biceps', active)} />
        {/* Oblíquo */}
        <path data-muscle="obliquos" d={OBLIQUO} {...muscleProps('obliquos', active)} />
        {/* Quadríceps */}
        <path data-muscle="quadriceps" d={QUADRICEPS} {...muscleProps('quadriceps', active)} />
        {/* Canela (tibial anterior) */}
        <path data-muscle="tibialis" d={TIBIALIS} {...muscleProps('tibialis', active)} />

        {/* Detalhes de definição (só com o músculo ativo) */}
        {active.has('peito') && (
          <g {...detailProps()}>
            <path d="M 100,62 L 100,94" />
            <path d="M 64,96 C 72,102 84,106 100,106" />
          </g>
        )}
        {active.has('biceps') && <path d="M 57,112 C 55,124 55,136 59,146" {...detailProps()} strokeWidth={1.1} />}
        {active.has('obliquos') && (
          <g {...detailProps()} strokeWidth={1.1} opacity={0.85}>
            <path d="M 71,128 C 76,131 81,130 86,128" />
            <path d="M 70,140 C 75,143 80,142 85,140" />
          </g>
        )}
        {active.has('quadriceps') && (
          <g {...detailProps()}>
            <path d="M 70,242 C 70,260 72,276 77,288" />
            <path d="M 100,196 L 100,290" />
          </g>
        )}
        {active.has('tibialis') && <path d="M 75,320 C 74,340 74,358 76,376" {...detailProps()} />}
      </Mirror>

      {/* Abdômen (six-pack) — a grade do abdômen fica SEMPRE visível */}
      <path data-muscle="abs" d={ABS} {...muscleProps('abs', active)} />
      <g
        stroke={active.has('abs') ? 'rgba(0,0,0,0.62)' : SEAM_SOFT}
        strokeWidth={1.3}
        opacity={active.has('abs') ? 0.85 : 0.55}
      >
        <path d="M 78,120 L 122,120" />
        <path d="M 77,135 L 123,135" />
        <path d="M 78,150 L 122,150" />
        <path d="M 100,100 L 100,163" />
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Vista traseira
// ---------------------------------------------------------------------------

/** Vista traseira (viewBox 0 0 200 440). */
export function BackFigure({ active, width }: FigureProps) {
  return (
    <svg viewBox="0 0 200 440" width={width} height={(width * 440) / 200} aria-hidden="true" style={{ display: 'block' }}>
      <BodySilhouette />

      {/* Trapézio (escudo das costas) */}
      <path data-muscle="trapezio" d={TRAPEZIO_BACK} {...muscleProps('trapezio', active)} />
      {active.has('trapezio') && (
        <g stroke={SEAM} strokeWidth={1.3} opacity={0.55}>
          <path d="M 66,64 C 74,70 126,70 134,64" />
          <path d="M 70,80 C 78,86 122,86 130,80" />
          <path d="M 74,96 C 82,102 118,102 126,96" />
        </g>
      )}

      {/* Músculos dorsais (espelhados) */}
      <Mirror>
        {/* Deltoide posterior */}
        <path data-muscle="ombros" d={DELT} {...muscleProps('ombros', active)} />
        {/* Tríceps */}
        <path data-muscle="triceps" d={TRICEPS} {...muscleProps('triceps', active)} />
        {/* Dorsal (latíssimo) */}
        <path data-muscle="lats" d={LAT} {...muscleProps('lats', active)} />
        {/* Glúteo */}
        <path data-muscle="gluteos" d={GLUTEO} {...muscleProps('gluteos', active)} />
        {/* Posterior de coxa */}
        <path data-muscle="posterior" d={POSTERIOR} {...muscleProps('posterior', active)} />
        {/* Panturrilha */}
        <path data-muscle="panturrilha" d={PANTURRILHA} {...muscleProps('panturrilha', active)} />

        {/* Detalhes de definição (só com o músculo ativo) */}
        {active.has('triceps') && (
          <g {...detailProps()}>
            <path d="M 50,112 C 53,117 57,118 60,115" />
            <path d="M 50,126 C 53,131 57,132 60,129" />
            <path d="M 50,140 C 53,145 57,146 60,143" />
          </g>
        )}
        {active.has('lats') && (
          <g {...detailProps()}>
            <path d="M 62,120 C 66,134 70,148 78,158" />
            <path d="M 72,108 C 76,122 80,136 88,148" />
          </g>
        )}
        {active.has('gluteos') && <path d="M 71,197 C 78,202 90,205 100,205" {...detailProps()} />}
        {active.has('posterior') && (
          <g {...detailProps()}>
            <path d="M 71,232 C 76,242 82,252 90,258" />
            <path d="M 71,248 C 76,258 82,268 90,274" />
          </g>
        )}
        {active.has('panturrilha') && <path d="M 75,320 C 74,336 74,352 76,368" {...detailProps()} />}
      </Mirror>

      {/* Lombar (coluna central) */}
      <path data-muscle="lombar" d={LOMBAR} {...muscleProps('lombar', active)} />
      {active.has('lombar') && (
        <g stroke={SEAM_SOFT} strokeWidth={1.2} opacity={0.9}>
          <path d="M 94,134 L 106,134" />
          <path d="M 94,146 L 106,146" />
          <path d="M 94,158 L 106,158" />
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
