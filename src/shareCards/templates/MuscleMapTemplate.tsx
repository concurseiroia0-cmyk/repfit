/**
 * TEMPLATE — MAPA MUSCULAR (réplica da referência FITFOLIO)
 *
 * Reconstruído a partir da IMAGEM DE REFERÊNCIA (não da figura antiga):
 *  · fundo preto puro (com a foto do usuário escurecida quando houver);
 *  · logo da marca no topo — elemento separado e editável (logoUrl);
 *  · personagens FRONTAL e TRASEIRO recortados da própria referência como
 *    assets PNG transparentes (public/share/muscle-*.png), mantendo o mesmo
 *    desenho, anatomia, pose, contornos e cores — posicionados nas mesmas
 *    regiões da imagem: frente à esquerda, costas à direita;
 *  · coluna central com as 4 estatísticas empilhadas (EXERCÍCIOS · VOL. ·
 *    RECORDES · DURAÇÃO) — número branco grande + rótulo branco abaixo,
 *    exatamente como na referência;
 *  · músculos trabalhados pintados na cor do app (amarelo) sobre o corpo
 *    cinza, via camadas transparentes sobrepostas aos assets — só o que a
 *    referência destaca (quadríceps/canela na frente; glúteos/posterior/
 *    panturrilha atrás), ligado/desligado conforme o treino;
 *  · textos e números são HTML (perfeitamente legíveis e editáveis);
 *  · o card sai como PNG em alta resolução (prévia === PNG).
 */

import { fmtBig, fmtInt } from '../formatShareStats';
import type { ShareTemplateProps } from '../types';
import type { MuscleId } from '../muscleMap';
import { ShareCardFrame } from './shared';

const BASE = import.meta.env.BASE_URL;

/** Assets transparentes recortados da referência (corpo + camadas de músculo). */
const ASSETS = {
  frontBody: `${BASE}share/muscle-front-body.png`,
  backBody: `${BASE}share/muscle-back-body.png`,
  front: {
    peito: `${BASE}share/muscle-front-peito.png`,
    ombros: `${BASE}share/muscle-front-ombros.png`,
    biceps: `${BASE}share/muscle-front-biceps.png`,
    antebraco: `${BASE}share/muscle-front-antebraco.png`,
    trapezio: `${BASE}share/muscle-front-trapezio.png`,
    abs: `${BASE}share/muscle-front-abs.png`,
    obliquos: `${BASE}share/muscle-front-obliquos.png`,
    quadriceps: `${BASE}share/muscle-front-quads.png`,
    tibialis: `${BASE}share/muscle-front-calves.png`,
  },
  back: {
    trapezio: `${BASE}share/muscle-back-trapezio.png`,
    ombros: `${BASE}share/muscle-back-ombros.png`,
    triceps: `${BASE}share/muscle-back-triceps.png`,
    antebraco: `${BASE}share/muscle-back-antebraco.png`,
    lats: `${BASE}share/muscle-back-lats.png`,
    lombar: `${BASE}share/muscle-back-lombar.png`,
    gluteos: `${BASE}share/muscle-back-glutes.png`,
    posterior: `${BASE}share/muscle-back-glutes.png`,
    panturrilha: `${BASE}share/muscle-back-calves.png`,
  },
} as const;

/** Proporção largura/altura dos assets recortados (frente e costas). */
const FRONT_RATIO = 138 / 401;
const BACK_RATIO = 141 / 401;

/** Músculo → camada de destaque em cada vista (todos os grupos desenhados). */
const FRONT_LAYERS: [MuscleId, string][] = [
  ['peito', ASSETS.front.peito],
  ['ombros', ASSETS.front.ombros],
  ['biceps', ASSETS.front.biceps],
  ['antebraco', ASSETS.front.antebraco],
  ['trapezio', ASSETS.front.trapezio],
  ['abs', ASSETS.front.abs],
  ['obliquos', ASSETS.front.obliquos],
  ['quadriceps', ASSETS.front.quadriceps],
  ['tibialis', ASSETS.front.tibialis],
];
const BACK_LAYERS: [MuscleId, string][] = [
  ['trapezio', ASSETS.back.trapezio],
  ['ombros', ASSETS.back.ombros],
  ['triceps', ASSETS.back.triceps],
  ['antebraco', ASSETS.back.antebraco],
  ['lats', ASSETS.back.lats],
  ['lombar', ASSETS.back.lombar],
  ['gluteos', ASSETS.back.gluteos],
  ['posterior', ASSETS.back.posterior],
  ['panturrilha', ASSETS.back.panturrilha],
];

/** Camadas de destaque ativas para um conjunto de músculos (sem duplicatas). */
function activeLayers(table: [MuscleId, string][], active: Set<MuscleId>): string[] {
  const seen = new Set<string>();
  for (const [m, src] of table) {
    if (active.has(m)) seen.add(src);
  }
  return [...seen];
}

/**
 * Personagem da referência: o corpo (cinza escuro, contorno branco) com as
 * camadas de músculo amarelas sobrepostas. Assets do mesmo recorte — basta
 * empilhar com posição absoluta.
 */
function Figure({
  body,
  layers,
  width,
  ratio,
}: {
  body: string;
  layers: string[];
  width: number;
  ratio: number;
}) {
  const fill: React.CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%' };
  return (
    <div style={{ position: 'relative', width, height: Math.round(width / ratio), flexShrink: 0 }}>
      <img src={body} alt="" draggable={false} style={fill} />
      {layers.map((src) => (
        <img key={src} src={src} alt="" draggable={false} style={fill} />
      ))}
    </div>
  );
}

/**
 * Coluna central de dados (réplica da referência): número branco GRANDE em
 * cima, rótulo branco menor abaixo, blocos espaçados uniformemente.
 */
function StatsColumn({
  stats,
  numSize,
  labelSize,
  gap,
}: {
  stats: { value: string; label: string }[];
  numSize: number;
  labelSize: number;
  gap: number;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap }}>
      {stats.map((s) => (
        <div key={s.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              fontSize: numSize,
              fontWeight: 700,
              lineHeight: 1,
              color: '#fff',
              letterSpacing: '0.02em',
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
            }}
          >
            {s.value}
          </div>
          <div
            style={{
              marginTop: Math.round(numSize * 0.55),
              fontSize: labelSize,
              fontWeight: 500,
              lineHeight: 1,
              color: '#E8E8E8',
              letterSpacing: '0.18em',
              whiteSpace: 'nowrap',
            }}
          >
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Wordmark "RepFit" no topo — fonte Hammersmith One (pedida pelo usuário),
 * embutida no app (public/fonts) e incluída no PNG exportado. */
function BrandWordmark({ size }: { size: number }) {
  return (
    <div
      style={{
        fontFamily: "'Hammersmith One', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontWeight: 400,
        fontSize: size,
        lineHeight: 1,
        color: '#fff',
        letterSpacing: '0.22em',
        textAlign: 'center',
        textShadow: '0 6px 30px rgba(0,0,0,0.35)',
        pointerEvents: 'none',
      }}
    >
      RepFit
    </div>
  );
}

/**
 * Card do mapa muscular — réplica da referência FITFOLIO:
 * logo → [personagem frontal | 4 stats | personagem traseiro].
 * Personagens nas mesmas regiões da imagem (frente à esquerda, costas à
 * direita, coluna central para os dados); músculos em amarelo do app.
 */
export function MuscleMapTemplate(props: ShareTemplateProps) {
  const { data, format, custom, photo } = props;
  const active = new Set<MuscleId>(data.muscles ?? []);

  // Escala a partir da referência (652px de largura → largura do card, 1080).
  // No story (bem alto) os personagens crescem mais para preencher a altura,
  // sem encostar na coluna central de dados.
  const tall = format.height >= 1700;
  const scale = tall ? 2.0 : 1.656;
  const figW = Math.round(138 * scale);
  const backW = Math.round(141 * scale);
  const numSize = Math.round(31 * scale);
  const labelSize = Math.round(13 * scale);
  const statGap = Math.round(46 * scale);
  // Wordmark "RepFit": cap height ~24px na referência 652px.
  const wordmarkSize = Math.round(26 * scale);

  const hasVolume = custom.showVolume && data.totals.volumeKg != null && data.totals.volumeKg > 0;
  const stats = [
    { value: fmtInt(data.totals.exercises), label: 'Exercícios' },
    { value: hasVolume ? fmtBig(data.totals.volumeKg ?? 0) : '—', label: 'Vol.' },
    { value: custom.showRecord && data.record ? '1' : '—', label: 'Recordes' },
    { value: data.totals.durationMin != null ? fmtInt(data.totals.durationMin) : '—', label: 'Duração' },
  ];

  return (
    <ShareCardFrame
      {...props}
      // Sem foto: preto puro como a referência. Com foto: transparente como os
      // outros templates — só o overlay do slider escurece (nenhuma camada extra).
      darken={photo ? undefined : { background: 'linear-gradient(180deg, #000, #000)' }}
      footer={null}
    >
      {/* Brilho radial sutil ao centro (por cima do fundo ou da foto) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(52% 46% at 50% 52%, rgba(245,197,24,0.10), rgba(245,197,24,0) 70%)',
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
          // Sem padding horizontal: as figuras são posicionadas em % da
          // largura TOTAL do card (mesmas posições da referência).
          padding: `${tall ? 96 : 72}px 0 0`,
        }}
      >
        {/* Wordmark "RepFit" (Hammersmith One) no topo */}
        <BrandWordmark size={wordmarkSize} />

        {/* Personagens da referência + coluna central de dados */}
        <div style={{ position: 'relative', flex: 1, width: '100%', minHeight: 0 }}>
          <div
            style={{
              position: 'absolute',
              left: `${(95 / 652) * 100}%`,
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            <Figure body={ASSETS.frontBody} layers={activeLayers(FRONT_LAYERS, active)} width={figW} ratio={FRONT_RATIO} />
          </div>
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
            <StatsColumn stats={stats} numSize={numSize} labelSize={labelSize} gap={statGap} />
          </div>
          <div
            style={{
              position: 'absolute',
              right: `${(62 / 652) * 100}%`,
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            <Figure body={ASSETS.backBody} layers={activeLayers(BACK_LAYERS, active)} width={backW} ratio={BACK_RATIO} />
          </div>
        </div>
      </div>
    </ShareCardFrame>
  );
}
