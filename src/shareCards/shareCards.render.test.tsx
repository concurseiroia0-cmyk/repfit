/**
 * Testes dos TEMPLATES RENDERIZADOS.
 *
 * Diferente do shareCards.test.ts (que valida a camada de dados), aqui os
 * templates são de fato renderizados (renderToStaticMarkup, sem DOM) para:
 *  1. Garantir que nenhum template quebra ao renderizar (smoke test de todos
 *     os 4 templates × 3 formatos, com e sem foto);
 *  2. Regressão do bug "foto preta no PNG": o nó exportado pelo html-to-image
 *     NUNCA pode ter `transform: scale()` — o html-to-image dimensiona o
 *     canvas por `clientWidth` (que ignora transforms), então um transform no
 *     nó exportado gerava um PNG de 2160×2700 quase todo preto/transparente
 *     com o card encolhido no canto.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ShareCardCanvas } from './ShareCardCanvas';
import { coverRect, panToTranslate } from './exportShareCard';
import { SHARE_FORMATS } from './types';
import type { ShareCardData, ShareCustomization, SharePhoto, ShareTemplateId } from './types';

// ---------------------------------------------------------------------------
// Dados mínimos realistas do card
// ---------------------------------------------------------------------------

const CUSTOM: ShareCustomization = {
  showAvatar: true,
  showVolume: true,
  showEffort: true,
  showRecord: true,
  showExercises: true,
};

function makeData(): ShareCardData {
  return {
    workoutName: 'Peito Forte',
    workoutType: 'Peito + Tríceps',
    mode: 'academia',
    dateLabel: '12 AGO 2026',
    photoId: null,
    username: 'Ana',
    avatarUrl: null,
    unit: 'kg',
    totals: { exercises: 2, sets: 4, reps: 38, volumeKg: 1180, durationMin: 50 },
    averageEffort: 3,
    exercises: [
      { name: 'Supino Reto', sets: 3, reps: 10, weightKg: 55, volumeKg: 1650 },
      { name: 'Rosca Direta', sets: 1, reps: 8, weightKg: 20, volumeKg: 160 },
    ],
    moreExercises: 2,
    record: {
      key: 'supino',
      label: 'Supino Reto',
      sublabel: 'Supino Reto',
      value: 55,
      unit: 'kg',
      prevValue: 50,
      delta: 10,
      date: '2026-08-12',
    },
    evolution: null,
    hasLoad: true,
    muscles: ['peito', 'triceps', 'biceps'],
  };
}

const PHOTO: SharePhoto = {
  url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  scale: 1,
  panX: 0,
  panY: 0,
};

const ALL_TEMPLATES: ShareTemplateId[] = ['glass', 'performance', 'minimal', 'posterMinimal', 'muscleMap'];

function render(template: ShareTemplateId, scale: number, photo: SharePhoto | null = null): string {
  return renderToStaticMarkup(
    <ShareCardCanvas
      data={makeData()}
      template={template}
      format={SHARE_FORMATS[0]}
      scale={scale}
      photo={photo}
      custom={CUSTOM}
      overlay={0.42}
      logoUrl={null}
    />
  );
}

// ---------------------------------------------------------------------------
// Smoke tests: todos os templates × formatos renderizam sem quebrar
// ---------------------------------------------------------------------------

describe('templates renderizados (smoke test)', () => {
  it('renderiza os 5 templates com o conteúdo do treino', () => {
    for (const tpl of ALL_TEMPLATES) {
      const html = render(tpl, 0.25);
      expect(html, `template ${tpl} deve renderizar`).toContain('Peito Forte');
      expect(html, `template ${tpl} deve ter a data`).toContain('12 AGO 2026');
      expect(html, `template ${tpl} deve ter o selo de modalidade`).toContain('Academia');
    }
  });

  it('sem modalidade salva → nenhum selo de academia/calistenia no card', () => {
    const d = { ...makeData(), mode: null };
    for (const tpl of ALL_TEMPLATES) {
      const html = renderToStaticMarkup(
        <ShareCardCanvas
          data={d}
          template={tpl}
          format={SHARE_FORMATS[0]}
          scale={0.25}
          photo={null}
          custom={CUSTOM}
          overlay={0.42}
          logoUrl={null}
        />
      );
      expect(html, `template ${tpl}`).not.toContain('Academia');
      expect(html, `template ${tpl}`).not.toContain('Calistenia');
      expect(html, `template ${tpl}`).not.toContain('🏋️');
      expect(html, `template ${tpl}`).not.toContain('🤸');
    }
  });

  it('renderiza nos 3 formatos (feed, square, story)', () => {
    for (const fmt of SHARE_FORMATS) {
      for (const tpl of ALL_TEMPLATES) {
        const html = renderToStaticMarkup(
          <ShareCardCanvas
            data={makeData()}
            template={tpl}
            format={fmt}
            scale={0.25}
            photo={null}
            custom={CUSTOM}
            overlay={0.42}
            logoUrl={null}
          />
        );
        expect(html, `${tpl}@${fmt.id}`).toContain('Peito Forte');
        expect(html, `${tpl}@${fmt.id}`).toContain(`width:${fmt.width}px;height:${fmt.height}px`);
      }
    }
  });

  it('com foto: o dataURL da foto aparece no card (fundo do template)', () => {
    for (const tpl of ALL_TEMPLATES) {
      const html = render(tpl, 0.25, PHOTO);
      expect(html, `template ${tpl} deve embutir a foto`).toContain(PHOTO.url);
    }
  });

  it('o overlay do slider CHEGA ao card (nenhum template pode sobrescrever com valor fixo)', () => {
    // Regressão: os templates sobrescreviam overlay={0.5|0.4|...} e o slider
    // "Escurecer" do modal não fazia nada — e a foto saía invisível no export.
    const html = renderToStaticMarkup(
      <ShareCardCanvas
        data={makeData()}
        template="glass"
        format={SHARE_FORMATS[0]}
        scale={0.25}
        photo={PHOTO}
        custom={CUSTOM}
        overlay={0.7}
        logoUrl={null}
      />
    );
    expect(html).toContain('rgba(0,0,0,0.7)');
    // e com outro valor, muda junto
    const html2 = renderToStaticMarkup(
      <ShareCardCanvas
        data={makeData()}
        template="performance"
        format={SHARE_FORMATS[0]}
        scale={0.25}
        photo={PHOTO}
        custom={CUSTOM}
        overlay={0.15}
        logoUrl={null}
      />
    );
    expect(html2).toContain('rgba(0,0,0,0.15)');
  });

  it('sem foto: nenhum dataURL de foto vaza para o card', () => {
    for (const tpl of ALL_TEMPLATES) {
      const html = render(tpl, 0.25, null);
      expect(html, `template ${tpl}`).not.toContain(PHOTO.url);
    }
  });

  it('com logo carregada: a marca d\'água (logo embutida) aparece nos templates (exceto Mapa muscular)', () => {
    const LOGO_URL = 'data:image/png;base64,AAAA'; // só um marcador
    const WITHOUT_LOGO: ShareTemplateId[] = ['muscleMap']; // card limpo, sem marca
    for (const tpl of ALL_TEMPLATES) {
      const html = renderToStaticMarkup(
        <ShareCardCanvas
          data={makeData()}
          template={tpl}
          format={SHARE_FORMATS[0]}
          scale={0.25}
          photo={null}
          custom={CUSTOM}
          overlay={0.42}
          logoUrl={LOGO_URL}
        />
      );
      if (WITHOUT_LOGO.includes(tpl)) {
        // O Mapa muscular é um card LIMPO: nenhuma marca d'água nem rodapé.
        expect(html, `template ${tpl} não pode ter a marca d'água`).not.toContain(LOGO_URL);
        expect(html, `template ${tpl} não pode ter o rodapé da marca`).not.toContain('RepFit');
      } else {
        // O dataURL da logo só existe no card por causa da marca d'água.
        expect(html, `template ${tpl} deve ter a marca d'água`).toContain(LOGO_URL);
      }
    }
  });

  it('sem logo: nenhuma marca d\'água no card', () => {
    const LOGO_URL = 'data:image/png;base64,AAAA';
    for (const tpl of ALL_TEMPLATES) {
      const html = render(tpl, 0.25, null);
      expect(html, `template ${tpl}`).not.toContain(LOGO_URL);
    }
  });

  it('com foto de perfil: o avatar aparece em img circular no template Glass', () => {
    const AVATAR_URL = 'data:image/jpeg;base64,BBBB';
    const html = renderToStaticMarkup(
      <ShareCardCanvas
        data={{ ...makeData(), avatarUrl: AVATAR_URL }}
        template="glass"
        format={SHARE_FORMATS[0]}
        scale={0.25}
        photo={null}
        custom={CUSTOM}
        overlay={0.42}
        logoUrl={null}
      />
    );
    expect(html).toContain(AVATAR_URL);
    expect(html).toContain('border-radius:50%');
  });
});

// ---------------------------------------------------------------------------
// Regressão: o nó exportado NUNCA tem transform de escala (foto preta no PNG)
// ---------------------------------------------------------------------------

describe('estrutura do nó exportado (regressão: PNG preto)', () => {
  it('o transform: scale() fica em um wrapper intermediário, nunca no nó exportado', () => {
    const html = render('glass', 0.25, PHOTO);

    // Existe um wrapper com a escala da prévia:
    const scaledDiv = html.match(/<div style="[^"]*transform:scale\(0\.25\)[^"]*">/);
    expect(scaledDiv, 'deve existir um wrapper com transform: scale(0.25)').not.toBeNull();

    // Imediatamente após esse wrapper vem o NÓ EXPORTADO (o que o
    // html-to-image rasteriza) — e ele não pode ter transform:
    const after = html.slice((scaledDiv as RegExpMatchArray).index! + scaledDiv![0].length);
    expect(after.startsWith('<div style="width:1080px;height:1350px">')).toBe(true);
  });

  it('o nó exportado tem o tamanho real do formato e nenhum transform (qualquer escala)', () => {
    for (const scale of [0.1, 0.25, 0.6, 1]) {
      const html = render('glass', scale, PHOTO);
      const scaledDiv = html.match(new RegExp(`<div style="[^"]*transform:scale\\(${scale}\\)[^"]*">`));
      expect(scaledDiv, `escala ${scale}: deve haver wrapper com o scale`).not.toBeNull();
      const after = html.slice((scaledDiv as RegExpMatchArray).index! + scaledDiv![0].length);
      expect(after.startsWith('<div style="width:1080px;height:1350px">'), `escala ${scale}`).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Geometria da foto na exportação (regressão: foto preta no PNG)
// ---------------------------------------------------------------------------

/**
 * A foto do usuário é desenhada por Canvas 2D na exportação (o <img> dentro
 * do SVG foreignObject é frágil e sai preto em alguns navegadores/WebViews).
 * A geometria precisa reproduzir EXATAMENTE o CSS do card:
 * object-fit: cover + translate(-50% + pan) + scale com origem no centro.
 */
describe('exportShareCard: geometria da foto (cover/pan/zoom)', () => {
  it('coverRect: imagem mais larga que o box → corta as laterais (cover)', () => {
    // Imagem 1200×600 em box 1080×1350: cobre por altura (1350/600 = 2.25).
    const r = coverRect(1200, 600, 1080, 1350);
    expect(r.sw).toBeCloseTo(480); // 1080 / 2.25
    expect(r.sh).toBeCloseTo(600);
    expect(r.sx).toBeCloseTo((1200 - 480) / 2); // corta lados iguais
    expect(r.sy).toBe(0);
  });

  it('coverRect: imagem mais alta que o box → corta o topo/base (cover)', () => {
    // Imagem 600×1200 em box 1080×1350: cobre por largura (1080/600 = 1.8).
    const r = coverRect(600, 1200, 1080, 1350);
    expect(r.sw).toBeCloseTo(600);
    expect(r.sh).toBeCloseTo(750); // 1350 / 1.8
    expect(r.sx).toBe(0);
    expect(r.sy).toBeCloseTo((1200 - 750) / 2); // corta topo/base iguais
  });

  it('coverRect: imagem na mesma proporção → usa tudo, sem corte', () => {
    const r = coverRect(900, 1125, 1080, 1350);
    expect(r.sw).toBeCloseTo(900);
    expect(r.sh).toBeCloseTo(1125);
    expect(r.sx).toBe(0);
    expect(r.sy).toBe(0);
  });

  it('panToTranslate: pan 0 → centro da imagem no meio do card', () => {
    // translate(calc(-50% + 0%)) scale(1) em box 1080×1350 → tx=-540, ty=-675
    expect(panToTranslate(0, 0, 1080, 1350)).toEqual({ tx: -540, ty: -675 });
  });

  it('panToTranslate: pan em % desloca o centro na direção do pan', () => {
    // panX=+10% → tx = -540 + 108 = -432; panY=-5% → ty = -675 - 67.5 = -742.5
    expect(panToTranslate(10, -5, 1080, 1350)).toEqual({ tx: -432, ty: -742.5 });
  });

  it('panToTranslate: centro final bate com o CSS (width/2 + pan%·width)', () => {
    // O centro da imagem exportada deve cair em (width/2 + pan%·width):
    // width + tx === width/2 + panX%·width (a composição soma width ao tx).
    const { tx, ty } = panToTranslate(20, 0, 1080, 1350);
    expect(1080 + tx).toBeCloseTo(540 + 216);
    expect(1350 + ty).toBeCloseTo(675);
  });
});
