// Gera os ícones do RepFit a partir da logo fornecida (PNG RGBA, sem dependências).
// Decodifica o PNG (zlib embutido), padroniza para quadrado, redimensiona
// (bilinear) e re-encoda com o encoder próprio.
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = process.argv[2] || path.join(ROOT, 'scripts', 'logo-original.png');
const OUT = path.join(ROOT, 'public');

// ---------- encoder PNG (mesmo do gen-icons) ----------
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
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  const stride = width * 4 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0;
    rgba.copy(raw, y * stride + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ---------- decoder PNG (RGBA, 8 bits, sem interlace) ----------
function decodePNG(buf) {
  let pos = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    pos += 12 + len;
  }
  if (bitDepth !== 8 || (colorType !== 6 && colorType !== 2)) {
    throw new Error(`PNG não suportado: bitDepth=${bitDepth} colorType=${colorType}`);
  }
  const bytesPerPx = colorType === 6 ? 4 : 3;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * bytesPerPx;
  const out = Buffer.alloc(width * height * 4);
  const prev = Buffer.alloc(stride);

  const paeth = (a, b, c) => {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    if (pa <= pb && pa <= pc) return a;
    if (pb <= pc) return b;
    return c;
  };

  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const line = Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= bytesPerPx ? line[x - bytesPerPx] : 0;
      const b = prev[x];
      const c = x >= bytesPerPx ? prev[x - bytesPerPx] : 0;
      let v = row[x];
      if (filter === 1) v = (v + a) & 0xff;
      else if (filter === 2) v = (v + b) & 0xff;
      else if (filter === 3) v = (v + ((a + b) >> 1)) & 0xff;
      else if (filter === 4) v = (v + paeth(a, b, c)) & 0xff;
      line[x] = v;
    }
    for (let x = 0; x < width; x++) {
      const si = x * bytesPerPx;
      const di = (y * width + x) * 4;
      out[di] = line[si];
      out[di + 1] = line[si + 1];
      out[di + 2] = line[si + 2];
      out[di + 3] = colorType === 6 ? line[si + 3] : 255;
    }
    prev.set(line);
  }
  return { width, height, rgba: out };
}

// ---------- redimensionamento bilinear ----------
function resize(rgba, srcW, srcH, dstW, dstH) {
  const out = Buffer.alloc(dstW * dstH * 4);
  const xRatio = srcW / dstW;
  const yRatio = srcH / dstH;
  for (let y = 0; y < dstH; y++) {
    const srcY = (y + 0.5) * yRatio - 0.5;
    const y0 = Math.max(0, Math.floor(srcY));
    const y1 = Math.min(srcH - 1, y0 + 1);
    const fy = srcY - y0;
    for (let x = 0; x < dstW; x++) {
      const srcX = (x + 0.5) * xRatio - 0.5;
      const x0 = Math.max(0, Math.floor(srcX));
      const x1 = Math.min(srcW - 1, x0 + 1);
      const fx = srcX - x0;
      const di = (y * dstW + x) * 4;
      for (let c = 0; c < 4; c++) {
        const p00 = rgba[(y0 * srcW + x0) * 4 + c];
        const p10 = rgba[(y0 * srcW + x1) * 4 + c];
        const p01 = rgba[(y1 * srcW + x0) * 4 + c];
        const p11 = rgba[(y1 * srcW + x1) * 4 + c];
        const top = p00 + (p10 - p00) * fx;
        const bottom = p01 + (p11 - p01) * fx;
        out[di + c] = Math.round(top + (bottom - top) * fy);
      }
    }
  }
  return out;
}

// ---------- main ----------
const src = decodePNG(fs.readFileSync(SRC));
const { width: W, height: H, rgba } = src;

// RECORTE: remove a área transparente ao redor do conteúdo (o squircle passa
// a preencher o ícone inteiro, de borda a borda — sem "parte escura" em
// volta). A base de cálculo é a caixa dos pixels visíveis.
let minX = W, minY = H, maxX = -1, maxY = -1;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    if (rgba[(y * W + x) * 4 + 3] > 160) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}
const cw = maxX - minX + 1;
const ch = maxY - minY + 1;
const side = Math.max(cw, ch);
const crop = Buffer.alloc(side * side * 4); // alpha 0
for (let y = 0; y < ch; y++) {
  for (let x = 0; x < cw; x++) {
    const si = ((minY + y) * W + (minX + x)) * 4;
    const di = (y * side + x) * 4;
    crop[di] = rgba[si];
    crop[di + 1] = rgba[si + 1];
    crop[di + 2] = rgba[si + 2];
    crop[di + 3] = rgba[si + 3];
  }
}
console.log(`logo: ${W}x${H} -> conteudo ${cw}x${ch} (recortado para ${side}x${side})`);

// Estende 1px para fora copiando a borda: garante que as laterais fiquem
// opacas até a beirada após o redimensionamento (sem halo semi-transparente).
const ext = 1;
const es = side + ext * 2;
const square = Buffer.alloc(es * es * 4);
for (let y = 0; y < es; y++) {
  for (let x = 0; x < es; x++) {
    const sx = Math.min(side - 1, Math.max(0, x - ext));
    const sy = Math.min(side - 1, Math.max(0, y - ext));
    const si = (sy * side + sx) * 4;
    const di = (y * es + x) * 4;
    square[di] = crop[si];
    square[di + 1] = crop[si + 1];
    square[di + 2] = crop[si + 2];
    square[di + 3] = crop[si + 3];
  }
}

fs.mkdirSync(OUT, { recursive: true });
const targets = [
  // O squircle preenche o ícone inteiro — sem fundo preto em volta.
  { name: 'icon-512.png', size: 512, blackBg: false },
  { name: 'maskable-512.png', size: 512, blackBg: false },
  { name: 'brand-logo.png', size: 512, blackBg: false },
  { name: 'icon-192.png', size: 192, blackBg: false },
  { name: 'apple-touch-icon.png', size: 180, blackBg: false },
  { name: 'favicon.png', size: 64, blackBg: false },
];
for (const t of targets) {
  let resized = resize(square, es, es, t.size, t.size);
  if (t.blackBg) {
    // Fundo preto opaco: alguns navegadores/iOS não renderizam transparência.
    for (let i = 0; i < resized.length; i += 4) {
      if (resized[i + 3] < 255) {
        resized[i] = 0;
        resized[i + 1] = 0;
        resized[i + 2] = 0;
        resized[i + 3] = 255;
      }
    }
  }
  fs.writeFileSync(path.join(OUT, t.name), encodePNG(t.size, t.size, resized));
  console.log(`gerado ${t.name}`);
}
