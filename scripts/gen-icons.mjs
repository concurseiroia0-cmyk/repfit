// Gera os ícones PNG do PWA (sem dependências externas).
// Usa apenas zlib embutido do Node para codificar PNGs.
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../public');

// ---------- encoder PNG ----------
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const stride = width * 4 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0; // filtro "None"
    rgba.copy(raw, y * stride + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ---------- desenho ----------
function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}
function mix(c1, c2, t) {
  return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
}

function inRoundRect(x, y, rx, ry, rw, rh, r) {
  const left = rx + r;
  const right = rx + rw - r;
  const top = ry + r;
  const bottom = ry + rh - r;
  if (x < rx || x > rx + rw || y < ry || y > ry + rh) return false;
  if (x >= left && x <= right) return true;
  if (y >= top && y <= bottom) return true;
  const cx = x < left ? left : right;
  const cy = y < top ? top : bottom;
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

// Cores (identidade: dourado sobre preto)
const BG_TOP = [0x0a, 0x0a, 0x0b]; // quase preto
const BG_BOTTOM = [0x18, 0x16, 0x12]; // preto levemente quente
const BOLT = [0xfb, 0xbf, 0x24]; // amber-400

// Relâmpago (polígono)
const BOLT_POINTS = [
  [0.58, 0.06],
  [0.28, 0.52],
  [0.45, 0.52],
  [0.36, 0.94],
  [0.74, 0.42],
  [0.55, 0.42],
  [0.66, 0.06],
];

function pointInPolygon(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0];
    const yi = pts[i][1];
    const xj = pts[j][0];
    const yj = pts[j][1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

// Desenha o relâmpago. `scale` encolhe o desenho (para o maskable), `rounded` define raio do fundo.
function drawIcon(size, scale, rounded) {
  const S = 4; // supersampling 2x2
  const buf = Buffer.alloc(size * size * 4);
  const unit = size * scale; // área útil
  const off = (size - unit) / 2;

  const boltPts = BOLT_POINTS.map(([x, y]) => [off + x * unit, off + y * unit]);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let rAcc = 0;
      let gAcc = 0;
      let bAcc = 0;
      for (let sy = 0; sy < S; sy++) {
        for (let sx = 0; sx < S; sx++) {
          const px = x + (sx + 0.5) / S;
          const py = y + (sy + 0.5) / S;
          const t = py / size;
          const bg = mix(BG_TOP, BG_BOTTOM, t);
          let color = bg;
          if (rounded === null || inRoundRect(px, py, 0, 0, size, size, rounded * size)) {
            if (pointInPolygon(px, py, boltPts)) {
              color = BOLT;
            }
          }
          rAcc += color[0];
          gAcc += color[1];
          bAcc += color[2];
        }
      }
      const i = (y * size + x) * 4;
      buf[i] = Math.round(rAcc / (S * S));
      buf[i + 1] = Math.round(gAcc / (S * S));
      buf[i + 2] = Math.round(bAcc / (S * S));
      buf[i + 3] = 255;
    }
  }
  return buf;
}

fs.mkdirSync(OUT, { recursive: true });

const targets = [
  { name: 'icon-192.png', size: 192, scale: 0.92, rounded: 0.18 },
  { name: 'icon-512.png', size: 512, scale: 0.92, rounded: 0.18 },
  { name: 'maskable-512.png', size: 512, scale: 0.72, rounded: null },
  { name: 'apple-touch-icon.png', size: 180, scale: 0.92, rounded: 0.18 },
];

for (const t of targets) {
  const buf = drawIcon(t.size, t.scale, t.rounded);
  const png = encodePNG(t.size, t.size, buf);
  fs.writeFileSync(path.join(OUT, t.name), png);
  console.log(`gerado ${t.name} (${png.length} bytes)`);
}
