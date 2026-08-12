import { toPng } from 'html-to-image';
import { ACCENT, CARD_BG, GLASS, GLASS_BORDER, SUB } from './glassStyles';
import { fmtInt, fmtNum, monogram, safe } from './formatShareStats';
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
 * desenha o card no Canvas 2D (100% offline, sem dependências externas).
 * Visual simplificado mas fiel: fundo escuro + manchas amarelas + vidro.
 */
export async function exportShareCardFallback(
  data: ShareCardData,
  format: ShareFormat,
  template: ShareTemplateId
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

  const pad = 52 * s;
  const line = (t: string, x: number, y: number, size: number, color = '#fff', weight = 700) =>
    text(t, x, y, size, color, weight, 'left');

  if (template === 'record' && data.record) {
    const rec = data.record;
    const cx = width / 2;
    // Topo discreto
    line('NOVO RECORDE', cx, 150 * s, 26 * s, ACCENT, 900);
    line(data.dateLabel, cx, 190 * s, 22 * s, SUB, 600);
    // Centro
    line(safe(rec.sublabel || data.workoutName), cx, height * 0.42, 44 * s, SUB, 800);
    const value = rec.unit === 'kg' ? `${fmtNum(rec.value)} ${data.unit}` : `${fmtNum(rec.value)} ${rec.unit || ''}`;
    line(value, cx, height * 0.55, 150 * s, ACCENT, 900);
    if (rec.delta != null && rec.delta > 0) {
      const d = `+${fmtNum(rec.delta)} ${rec.unit === 'kg' ? data.unit : rec.unit || ''}`;
      roundRect(cx - 150 * s, height * 0.62, 300 * s, 64 * s, 999);
      ctx.fillStyle = ACCENT;
      ctx.fill();
      text(d, cx, height * 0.62 + 43 * s, 30 * s, '#0B0B0B', 900, 'center');
    }
  } else if (template === 'evolution' && data.evolution && data.evolution.points.length >= 2) {
    const evo = data.evolution;
    const cx = width / 2;
    line('MINHA EVOLUÇÃO', pad, 120 * s, 24 * s, ACCENT, 900);
    line(safe(evo.exercise), pad, 180 * s, 56 * s, '#fff', 900);
    // Barras
    const values = evo.points.map((p) => p.weightKg ?? p.reps);
    const max = Math.max(1, ...values);
    const barW = 92 * s;
    const areaH = height * 0.34;
    const baseY = height * 0.78;
    const gap = (width - barW * evo.points.length) / (evo.points.length + 1);
    evo.points.forEach((p, i) => {
      const h = Math.max(14 * s, (values[i] / max) * areaH);
      const x = gap + i * (barW + gap);
      roundRect(x, baseY - h, barW, h, barW / 2);
      ctx.fillStyle = i === evo.points.length - 1 ? ACCENT : 'rgba(245,197,24,0.35)';
      ctx.fill();
      const v = p.weightKg != null ? `${fmtNum(p.weightKg)} ${data.unit}` : `${fmtNum(p.reps)} reps`;
      text(v, x + barW / 2, baseY - h - 14 * s, 22 * s, SUB, 700, 'center');
      text(p.dateLabel.slice(0, 5), x + barW / 2, baseY + 34 * s, 21 * s, SUB, 700, 'center');
    });
    const fl = evo.deltaPercent != null ? `EVOLUÇÃO · +${fmtNum(evo.deltaPercent, 0)}% de carga` : `EVOLUÇÃO · +${fmtNum(evo.deltaReps ?? 0, 0)} reps`;
    roundRect(width / 2 - 260 * s, height - 140 * s, 520 * s, 60 * s, 999);
    ctx.fillStyle = 'rgba(245,197,24,0.14)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(245,197,24,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    text(fl, width / 2, height - 100 * s, 25 * s, ACCENT, 800, 'center');
  } else {
    // Template 1 — Treino concluído (e fallback genérico para os demais)
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
    const selo = `${data.workoutName}`;
    line(selo.toUpperCase(), pad, y0 + 160 * s, 54 * s, '#fff', 900);
    // Métricas
    const metrics: { n: string; l: string }[] = [
      { n: fmtInt(data.totals.exercises), l: 'Exercícios' },
      { n: fmtInt(data.totals.sets), l: 'Séries' },
      { n: fmtInt(data.totals.reps), l: 'Repetições' },
    ];
    if (data.totals.volumeKg != null && data.totals.volumeKg > 0) {
      metrics.push({ n: fmtNum(data.totals.volumeKg), l: 'Volume' });
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
  }

  // Rodapé da marca
  const fy = height - 56 * s;
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(0, fy - 30 * s, width, 1);
  const bsw = 30 * s;
  roundRect(width / 2 - 150 * s, fy - 22 * s, 300 * s, 44 * s, 22 * s);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fill();
  // haltere simples
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
