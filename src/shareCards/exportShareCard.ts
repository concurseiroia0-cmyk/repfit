import { toPng } from 'html-to-image';
import { ACCENT, CARD_BG, GLASS, GLASS_BORDER, SUB } from './glassStyles';
import { fmtBig, fmtInt, fmtNum, monogram, safe } from './formatShareStats';
import type { ShareCardData, ShareFormat, ShareTemplateId } from './types';

/**
 * Exporta o nó do card como PNG nítido (pixelRatio 2 → 2160px de largura).
 * O card NÃO usa backdrop-filter (vidro simulado com camadas), então o
 * html-to-image reproduz exatamente o que a prévia mostra.
 */
export async function exportShareCard(node: HTMLElement): Promise<Blob> {
  const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });
  const res = await fetch(dataUrl);
  return await res.blob();
}

/**
 * Fallback de segurança: se o html-to-image falhar por qualquer motivo,
 * desenha um card genérico premium no Canvas 2D (100% offline, sem
 * dependências externas). Visual simplificado mas fiel à identidade:
 * fundo escuro + manchas amarelas + vidro.
 */
export async function exportShareCardFallback(
  data: ShareCardData,
  format: ShareFormat,
  _template: ShareTemplateId
): Promise<Blob> {
  const { width, height } = format;
  const canvas = document.createElement('canvas');
  canvas.width = width * 2;
  canvas.height = height * 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas-unsupported');
  ctx.scale(2, 2);
  const s = width / 1080; // escala tipográfica base (1080 = referência)

  // ---- Fundo profundo + manchas amarelas desfocadas (gradientes radiais) ----
  ctx.fillStyle = CARD_BG;
  ctx.fillRect(0, 0, width, height);
  const blob = (x: number, y: number, r: number, a: number) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(245,197,24,${a})`);
    g.addColorStop(1, 'rgba(245,197,24,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  blob(width * 0.05, height * 0.02, width * 0.32, 0.1);
  blob(width * 0.98, height * 0.85, width * 0.36, 0.07);
  blob(width * 0.9, height * 0.35, width * 0.24, 0.05);

  const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };
  const panel = (x: number, y: number, w: number, h: number, r = 22 * s) => {
    roundRect(x, y, w, h, r);
    ctx.fillStyle = GLASS;
    ctx.fill();
    ctx.strokeStyle = GLASS_BORDER;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  };
  const text = (t: string, x: number, y: number, size: number, color = '#fff', weight = 700, align: CanvasTextAlign = 'left') => {
    ctx.font = `${weight} ${size}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(t, x, y);
  };
  const line = (t: string, x: number, y: number, size: number, color = '#fff', weight = 700) =>
    text(t, x, y, size, color, weight, 'left');

  const pad = 52 * s;
  const y0 = 120 * s;

  // Cabeçalho: monograma + nome + data
  const av = 72 * s;
  roundRect(pad, y0, av, av, av / 2);
  ctx.fillStyle = ACCENT;
  ctx.fill();
  text(monogram(data.username), pad + av / 2, y0 + av / 2 + 14 * s, 32 * s, '#0B0B0B', 900, 'center');
  line(data.username.trim() || 'Treino concluído', pad + av + 20 * s, y0 + 34 * s, 28 * s, '#fff', 800);
  line(data.dateLabel, pad + av + 20 * s, y0 + 62 * s, 21 * s, SUB, 600);

  // Selo + título
  line(safe(data.workoutName).toUpperCase(), pad, y0 + 160 * s, 52 * s, '#fff', 900);

  // Métricas
  const metrics: { n: string; l: string }[] = [
    { n: fmtInt(data.totals.exercises), l: 'Exercícios' },
    { n: fmtInt(data.totals.sets), l: 'Séries' },
    { n: fmtInt(data.totals.reps), l: 'Repetições' },
  ];
  if (data.totals.volumeKg != null && data.totals.volumeKg > 0) {
    metrics.push({ n: fmtBig(data.totals.volumeKg), l: 'Volume' });
  } else if (data.totals.durationMin != null) {
    metrics.push({ n: fmtInt(data.totals.durationMin), l: 'Duração (min)' });
  }
  const mw = (width - pad * 2 - 16 * s * (metrics.length - 1)) / metrics.length;
  metrics.forEach((m, i) => {
    const x = pad + i * (mw + 16 * s);
    panel(x, y0 + 210 * s, mw, 150 * s, 22 * s);
    text(m.n, x + mw / 2, y0 + 210 * s + 70 * s, 52 * s, '#fff', 900, 'center');
    text(m.l, x + mw / 2, y0 + 210 * s + 118 * s, 21 * s, SUB, 600, 'center');
  });

  // Exercícios
  const rows = data.exercises.slice(0, 4);
  let ry = y0 + 210 * s + 190 * s;
  rows.forEach((ex) => {
    panel(pad, ry, width - pad * 2, 92 * s, 20 * s);
    line(safe(ex.name), pad + 24 * s, ry + 58 * s, 27 * s, '#fff', 700);
    const meta = `${ex.weightKg != null ? `${fmtNum(ex.weightKg)} ${data.unit} · ` : ''}${fmtInt(ex.sets)}×${fmtInt(ex.reps)}`;
    text(meta, width - pad - 24 * s, ry + 58 * s, 25 * s, SUB, 700, 'right');
    ry += 92 * s + 14 * s;
  });
  const hidden = data.moreExercises + Math.max(0, data.exercises.length - 4);
  if (hidden > 0) {
    text(`+ ${hidden} ${hidden === 1 ? 'exercício' : 'exercícios'}`, width / 2, ry + 30 * s, 24 * s, SUB, 600, 'center');
  }

  // Rodapé da marca
  const fy = height - 56 * s;
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(0, fy - 30 * s, width, 1);
  const bsw = 30 * s;
  roundRect(width / 2 - 150 * s, fy - 22 * s, 300 * s, 44 * s, 22 * s);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fill();
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 4 * s;
  ctx.beginPath();
  ctx.moveTo(width / 2 - bsw, fy + 2 * s);
  ctx.lineTo(width / 2 + bsw, fy + 2 * s);
  ctx.stroke();
  text('RepFit', width / 2 + 24 * s, fy + 10 * s, 24 * s, '#fff', 800, 'left');
  text('— seus dados, só seus', width / 2 + 24 * s + 120 * s, fy + 10 * s, 19 * s, SUB, 600, 'left');

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob-failed'))), 'image/png');
  });
}
