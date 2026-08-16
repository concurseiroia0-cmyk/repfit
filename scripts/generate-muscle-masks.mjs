// Gera máscaras de destaque amarelas (#F5C518, cor do app) para TODOS os
// grupos musculares desenhados nos personagens da referência.
//
// Os polígonos abaixo foram traçados sobre os assets (front 138x401, back
// 141x401) seguindo a anatomia desenhada na própria figura. Cada máscara é:
//   · recortada pela silhueta do corpo (nunca vaza para fora);
//   · modulada pela luminância do corpo (as linhas de separação dos músculos
//     continuam visíveis dentro do destaque — mesmo estilo dos destaques
//     vermelhos da referência);
//   · amarela na cor do app.
import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';

const OUT = 'public/share';
const YELLOW = [245, 197, 24];

function loadBody(file) {
  const png = PNG.sync.read(readFileSync(file));
  const { width, height, data } = png;
  return {
    width,
    height,
    alphaAt: (x, y) => data[(y * width + x) * 4 + 3],
    lumAt: (x, y) => {
      const i = (y * width + x) * 4;
      return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    },
  };
}

/** Ponto dentro de um polígono? (ray casting) */
function inPoly(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function makeMask(body, polys) {
  const { width, height } = body;
  const out = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4;
      const ba = body.alphaAt(x, y);
      if (ba < 12) {
        out.data[o + 3] = 0;
        continue;
      }
      let hit = false;
      for (const poly of polys) {
        if (inPoly(x, y, poly)) {
          hit = true;
          break;
        }
      }
      if (!hit) {
        out.data[o + 3] = 0;
        continue;
      }
      // Cor amarela modulada pela luminância do corpo: as separações dos
      // músculos (tons escuros) continuam visíveis dentro do destaque.
      const l = body.lumAt(x, y);
      const f = Math.min(1.12, Math.max(0.5, 0.55 + (l / 150) * 0.6));
      out.data[o] = Math.min(255, Math.round(YELLOW[0] * f));
      out.data[o + 1] = Math.min(255, Math.round(YELLOW[1] * f));
      out.data[o + 2] = Math.min(255, Math.round(YELLOW[2] * f));
      out.data[o + 3] = ba; // preserva a borda suave da silhueta
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Polígonos (coordenadas dos assets) — front 138x401, back 141x401
// ---------------------------------------------------------------------------
const frontBody = loadBody('public/share/muscle-front-body.png');
const backBody = loadBody('public/share/muscle-back-body.png');

const REGIONS = {
  // ---- FRONTAL ----
  'muscle-front-peito.png': {
    body: frontBody,
    polys: [
      // placa peitoral esquerda
      [[40, 112], [66, 112], [68, 128], [62, 150], [52, 158], [42, 150], [36, 130]],
      // placa peitoral direita
      [[72, 112], [98, 112], [102, 130], [96, 150], [86, 158], [76, 150], [70, 128]],
    ],
  },
  'muscle-front-ombros.png': {
    body: frontBody,
    polys: [
      // deltoide esquerdo (capuz arredondado)
      [[22, 84], [44, 80], [48, 96], [46, 114], [38, 120], [26, 112], [20, 96]],
      // deltoide direito
      [[94, 80], [116, 84], [118, 96], [112, 112], [100, 120], [92, 114], [90, 96]],
    ],
  },
  'muscle-front-biceps.png': {
    body: frontBody,
    polys: [
      // braço esquerdo (bíceps)
      [[8, 104], [24, 100], [30, 118], [28, 144], [22, 154], [10, 148], [4, 130]],
      // braço direito (bíceps)
      [[114, 100], [130, 104], [134, 130], [128, 148], [116, 154], [110, 144], [108, 118]],
    ],
  },
  'muscle-front-trapezio.png': {
    body: frontBody,
    polys: [
      // trapézio: inclinação pescoço → ombros (visto de frente)
      [[46, 70], [92, 70], [96, 84], [100, 98], [92, 106], [46, 106], [38, 98], [42, 84]],
    ],
  },
  'muscle-front-abs.png': {
    body: frontBody,
    polys: [
      // abdômen (six-pack)
      [[50, 162], [88, 162], [92, 190], [90, 224], [48, 224], [46, 190]],
    ],
  },
  'muscle-front-obliquos.png': {
    body: frontBody,
    polys: [
      // oblíquo esquerdo
      [[34, 172], [48, 166], [50, 200], [48, 230], [36, 226], [30, 200]],
      // oblíquo direito
      [[90, 166], [104, 172], [108, 200], [102, 226], [90, 230], [88, 200]],
    ],
  },
  // ---- TRASEIRO ----
  'muscle-back-trapezio.png': {
    body: backBody,
    polys: [
      // trapézio superior esquerdo
      [[34, 66], [56, 66], [58, 84], [54, 102], [42, 106], [32, 96], [30, 80]],
      // trapézio superior direito
      [[85, 66], [107, 66], [111, 80], [109, 96], [99, 106], [87, 102], [83, 84]],
    ],
  },
  'muscle-back-ombros.png': {
    body: backBody,
    polys: [
      // deltoide posterior esquerdo
      [[18, 84], [40, 80], [44, 96], [42, 112], [32, 118], [22, 110], [14, 96]],
      // deltoide posterior direito
      [[97, 80], [123, 84], [127, 96], [119, 110], [109, 118], [99, 112], [97, 96]],
    ],
  },
  'muscle-back-triceps.png': {
    body: backBody,
    polys: [
      // braço esquerdo (tríceps, lado externo)
      [[4, 104], [20, 100], [26, 120], [26, 170], [20, 190], [8, 184], [2, 150]],
      // braço direito (tríceps, lado externo)
      [[121, 100], [137, 104], [139, 150], [133, 184], [121, 190], [115, 170], [115, 120]],
    ],
  },
  'muscle-back-lats.png': {
    body: backBody,
    polys: [
      // latíssimo esquerdo (asa)
      [[36, 104], [60, 106], [64, 130], [60, 170], [52, 198], [38, 196], [32, 160], [30, 126]],
      // latíssimo direito (asa)
      [[81, 106], [105, 104], [111, 126], [109, 160], [103, 196], [89, 198], [81, 170], [77, 130]],
    ],
  },
  'muscle-back-lombar.png': {
    body: backBody,
    polys: [
      // lombar esquerda
      [[42, 198], [64, 200], [66, 228], [62, 256], [46, 258], [38, 240]],
      // lombar direita
      [[77, 200], [99, 198], [103, 240], [95, 258], [79, 256], [75, 228]],
    ],
  },
};

for (const [name, { body, polys }] of Object.entries(REGIONS)) {
  const img = makeMask(body, polys);
  writeFileSync(`${OUT}/${name}`, PNG.sync.write(img));
  console.log(`ok ${OUT}/${name} (${img.width}x${img.height})`);
}
