// Extrai os personagens da referência FITFOLIO como assets transparentes.
// - Corpos: chroma-key do fundo preto; músculos vermelhos viram cinza do corpo.
// - Camadas de destaque: só os músculos vermelhos, recolorição para o amarelo
//   do app (#F5C518), o resto transparente — para ligar/desligar por treino.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { PNG } from 'pngjs';

const SRC = 'ref-fitfolio.png';
const OUT = 'public/share';
mkdirSync(OUT, { recursive: true });

const png = PNG.sync.read(readFileSync(SRC));
const { width: W, height: H, data } = png;
const px = (x, y) => {
  const i = (y * W + x) * 4;
  return [data[i], data[i + 1], data[i + 2]];
};
const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

// Músculo destacado na referência (vermelho-laranja) — para as camadas de destaque.
const isRedStrong = (r, g, b) => r > 60 && r > g * 1.45 && r > b * 1.25 && lum(r, g, b) > 25;
// Qualquer tom avermelhado (incluindo bordas de antialiasing) — neutralizado no corpo.
const isRedWeak = (r, g, b) => r > g * 1.25 && r > b * 1.15 && r > 20 && lum(r, g, b) > 12;

// Caixas de recorte das figuras (medidas na análise): a coluna central (painel
// + stats, x 232..435) fica de fora; margens viram transparentes no chroma-key.
const front = { x0: 95, x1: 232, y0: 148, y1: 548 };
const back = { x0: 450, x1: 590, y0: 148, y1: 548 };
console.log('frente bbox:', front, '→', front.x1 - front.x0 + 1, 'x', front.y1 - front.y0 + 1);
console.log('costas bbox:', back, '→', back.x1 - back.x0 + 1, 'x', back.y1 - back.y0 + 1);

// Faixas de músculo por figura (coordenadas da IMAGEM).
const BANDS = {
  front: { quads: [336, 425], calves: [438, 505] },
  back: { glutes: [318, 480], calves: [482, 520] },
};

// Recolorir vermelho → amarelo do app (#F5C518), preservando a sombra (luminância).
function redToYellow(r, g, b) {
  const l = lum(r, g, b);
  const f = Math.min(1.12, Math.max(0.32, l / 95));
  return [Math.round(245 * f), Math.round(197 * f), Math.round(24 * f)];
}

function alphaFor(r, g, b) {
  const l = lum(r, g, b);
  if (l <= 11) return 0;
  if (l >= 30) return 255;
  return Math.round(((l - 11) / 19) * 255); // borda suave
}

function cropAs(side, { redTo, redOnly = false, band = null }) {
  const { x0, x1, y0, y1 } = side === 'L' ? front : back;
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
  const out = new PNG({ width: cw, height: ch });
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const sx = x0 + x, sy = y0 + y;
      const [r, g, b] = px(sx, sy);
      const inBand = !band || (sy >= band[0] && sy <= band[1]);
      const o = (y * cw + x) * 4;
      if (redOnly) {
        if (isRedStrong(r, g, b) && inBand) {
          const [yr, yg, yb] = redToYellow(r, g, b);
          out.data[o] = yr; out.data[o + 1] = yg; out.data[o + 2] = yb;
          out.data[o + 3] = alphaFor(r, g, b);
        } else {
          out.data[o] = 0; out.data[o + 1] = 0; out.data[o + 2] = 0; out.data[o + 3] = 0;
        }
      } else if (isRedWeak(r, g, b)) {
        // corpo sem destaque: vermelho (e bordas avermelhadas) → cinza do corpo
        out.data[o] = redTo ? redTo[0] : 63; out.data[o + 1] = redTo ? redTo[1] : 63; out.data[o + 2] = redTo ? redTo[2] : 63;
        out.data[o + 3] = alphaFor(r, g, b);
      } else {
        out.data[o] = r; out.data[o + 1] = g; out.data[o + 2] = b;
        out.data[o + 3] = alphaFor(r, g, b);
      }
    }
  }
  return out;
}

const jobs = [
  ['muscle-front-body.png', cropAs('L', {})],
  ['muscle-front-quads.png', cropAs('L', { redOnly: true, band: BANDS.front.quads })],
  ['muscle-front-calves.png', cropAs('L', { redOnly: true, band: BANDS.front.calves })],
  ['muscle-back-body.png', cropAs('R', {})],
  ['muscle-back-glutes.png', cropAs('R', { redOnly: true, band: BANDS.back.glutes })],
  ['muscle-back-calves.png', cropAs('R', { redOnly: true, band: BANDS.back.calves })],
];
for (const [name, img] of jobs) {
  writeFileSync(`${OUT}/${name}`, PNG.sync.write(img));
  console.log(`ok ${OUT}/${name} (${img.width}x${img.height})`);
}
