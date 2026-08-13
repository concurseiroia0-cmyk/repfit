import { toCanvas } from 'html-to-image';
import { ACCENT, CARD_BG, GLASS, GLASS_BORDER, SUB } from './glassStyles';
import { fmtBig, fmtInt, fmtNum, monogram, safe } from './formatShareStats';
import type { ShareCardData, ShareFormat, SharePhoto, ShareTemplateId } from './types';

/**
 * Exporta o nó do card como PNG nítido (pixelRatio 2 → 2160px de largura).
 *
 * Por que este pipeline existe (bug "imagem preta no WhatsApp"):
 *  1. O html-to-image desenha o card via SVG foreignObject, e a renderização
 *     de <img> dentro desse SVG é FRÁGIL — em alguns navegadores/WebViews
 *     (típicos de celular) o <img> sai preto, e o data URL do SVG explode de
 *     tamanho quando embute uma foto grande, fazendo o SVG nem carregar.
 *     Resultado: imagem "completamente preta" compartilhada no WhatsApp.
 *  2. Solução: o DESIGN (texto, painéis, overlays, gradientes) é exportado
 *     pelo html-to-image SEM a foto (SVG pequeno, confiável — provado pelos
 *     cards sem foto), e a FOTO do usuário é desenhada por Canvas 2D por
 *     baixo (100% determinístico, sem CORS, sem foreignObject). O design é
 *     composto por cima com o buraco da foto transparente, mantendo
 *     exatamente o visual da prévia.
 *  3. Todas as imagens/fontes são aguardadas antes de capturar.
 *  4. A exportação usa toCanvas + toBlob (sem dataURL gigante no fetch).
 *  5. O resultado é VERIFICADO: PNG preto/vazio (ou foto perdida) → re-try →
 *     erro → o modal cai no fallback avisando o usuário (nunca compartilha
 *     preto em silêncio).
 *
 * O card NÃO usa backdrop-filter (vidro simulado com camadas), então o
 * html-to-image reproduz exatamente o que a prévia mostra.
 */
export async function exportShareCard(
  node: HTMLElement,
  photo?: SharePhoto | null
): Promise<Blob> {
  // 1) Aguarda fontes do card (a foto NÃO depende do DOM — vem do estado).
  await ensureAssetsReady(node);

  // 2) Carrega a foto do ESTADO do modal (dataURL) numa Image nova e aguarda a
  //    decodificação — a foto nunca depende do <img> do DOM nem de onload
  //    pendente. Geomeria (cover/pan/zoom) vem do estado, não do CSS.
  //    Em celulares baratos a decodificação pode demorar: uma re-tentativa
  //    cobre o caso de timeout/primeira falha.
  let prepared: PreparedPhoto | null = null;
  if (photo) {
    try {
      prepared = await preparePhotoFromState(node, photo);
    } catch {
      await new Promise((r) => setTimeout(r, 350));
      prepared = await preparePhotoFromState(node, photo);
    }
  }

  // 3) Nó a exportar: com foto → clone com o "buraco" transparente da foto
  //    (overlays/design intactos); sem foto → o próprio nó.
  const target = prepared ? hollowOutPhoto(node) : node;

  try {
    const pixelRatios = [2, 1]; // 2× nítido; re-try em 1× (menos memória no celular)
    for (let attempt = 0; attempt < pixelRatios.length; attempt++) {
      try {
        // Design sem foto: transparente quando há foto (para compor por cima),
        // opaco (CARD_BG) quando não há — cantos nunca ficam "preto".
        const design = await toCanvas(target, {
          pixelRatio: pixelRatios[attempt],
          backgroundColor: prepared ? undefined : CARD_BG,
          cacheBust: true,
        });
        // O design precisa ter conteúdo (texto/painéis) — nunca preto/vazio.
        assertCanvasHasContent(design, 'design');
        const final = prepared ? composePhotoUnderDesign(design, prepared) : design;
        assertCanvasHasContent(final, 'final');
        if (prepared) assertPhotoPresent(final, design);
        const blob = await canvasToBlob(final);
        return blob;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[share-card] tentativa', attempt + 1, 'falhou:', err);
        // Um único re-try cobre corridas de carregamento/memória (em 1×).
        if (attempt < pixelRatios.length - 1) {
          await new Promise((r) => setTimeout(r, 300));
          continue;
        }
        throw err;
      }
    }
    throw new Error('export-failed');
  } finally {
    if (target !== node) target.remove();
  }
}

/**
 * Aguarda fontes e imagens do nó antes de exportar — evita capturar com a
 * foto/fonte ainda carregando (que renderiza vazio/preto no SVG).
 */
async function ensureAssetsReady(node: HTMLElement): Promise<void> {
  try {
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    await fonts?.ready;
  } catch {
    /* navegador sem FontFaceSet — segue */
  }
  const imgs = Array.from(node.querySelectorAll('img'));
  await Promise.all(
    imgs.map((img) =>
      typeof img.decode === 'function' ? img.decode().catch(() => undefined) : Promise.resolve()
    )
  );
  // Dois frames: garante que o layout/fontes foram re-aplicados.
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))));
  // Pequena pausa de estabilização: garante que tudo está 100% renderizado
  // antes da captura (em WebViews de celular o layout pode terminar depois).
  await new Promise((r) => setTimeout(r, 300));
}

// ---------------------------------------------------------------------------
// Foto (Canvas 2D)
// ---------------------------------------------------------------------------

/** Retângulo-fonte do "object-fit: cover" para um box W×H. */
export function coverRect(
  naturalW: number,
  naturalH: number,
  boxW: number,
  boxH: number
): { sx: number; sy: number; sw: number; sh: number } {
  const cov = Math.max(boxW / naturalW, boxH / naturalH);
  const sw = boxW / cov;
  const sh = boxH / cov;
  return { sx: (naturalW - sw) / 2, sy: (naturalH - sh) / 2, sw, sh };
}

/**
 * Reproduz a translação CSS do <img> do card a partir do ESTADO da foto
 * (panX/panY em % do card). O <img> usa `left/top: 50%` + `transform:
 * translate(calc(-50% + panX%), calc(-50% + panY%)) scale(scale)` com origem
 * no centro do box (que em coordenadas do card fica em (width, height)) — ou
 * seja, o centro da imagem cai em (width/2 + panX%·width, height/2 +
 * panY%·height). A função devolve o deslocamento (tx, ty) que, somado ao
 * translate(width, height) da composição em canvas, produz exatamente a
 * mesma posição. Não lê CSS (a foto vem do estado, não do DOM).
 */
export function panToTranslate(
  panX: number,
  panY: number,
  width: number,
  height: number
): { tx: number; ty: number } {
  return {
    tx: -width / 2 + (panX / 100) * width,
    ty: -height / 2 + (panY / 100) * height,
  };
}

interface PreparedPhoto {
  img: HTMLImageElement;
  width: number;
  height: number;
  scale: number;
  panX: number;
  panY: number;
  radius: number;
}

/**
 * Carrega a foto do ESTADO do modal (dataURL local) numa Image nova e aguarda
 * a decodificação. A foto da exportação NUNCA depende do <img> do DOM (que
 * pode ainda estar carregando/decodificando no celular) — se a URL for
 * inválida, lança erro para o fluxo cair no fallback com aviso, em vez de
 * exportar o card sem a foto ("fundo preto com texto").
 */
async function preparePhotoFromState(
  node: HTMLElement,
  photo: SharePhoto
): Promise<PreparedPhoto> {
  const frame = node.firstElementChild as HTMLElement | null;
  const width = node.clientWidth;
  const height = node.clientHeight;
  if (!frame || width <= 0 || height <= 0) throw new Error('export-node-unmeasured');

  // Reusa o <img> JÁ carregado e exibido no preview quando possível (mesma
  // src) — a foto não é recarregada/decodificada do zero no celular. Se não
  // der, carrega uma Image nova do dataURL (a foto vem do estado, nunca da
  // rede → sem CORS).
  const domImg = frame.querySelector('img');
  let img: HTMLImageElement;
  if (domImg && domImg.complete && domImg.naturalWidth > 0 && domImg.src === photo.url) {
    img = domImg;
  } else {
    img = await loadPhotoImage(photo.url);
  }
  const scale = Number.isFinite(photo.scale) && photo.scale > 0 ? photo.scale : 1;
  const radius = parseFloat(getComputedStyle(frame).borderRadius) || 0;
  return { img, width, height, scale, panX: photo.panX, panY: photo.panY, radius };
}

/** Carrega e decodifica uma imagem (dataURL/blob URL) com timeout. */
function loadPhotoImage(url: string, timeoutMs = 8000): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = window.setTimeout(() => reject(new Error('photo-load-timeout')), timeoutMs);
    img.onload = () => {
      window.clearTimeout(timer);
      if (img.naturalWidth > 0) resolve(img);
      else reject(new Error('photo-invalid'));
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error('photo-load-failed'));
    };
    img.src = url;
  });
}

/**
 * Clona o nó e abre um "buraco" transparente onde a foto fica: remove o
 * <img> e zera os fundos do frame e da camada de foto. Os overlays de
 * escurecimento (rgba + gradientes) ficam NO DESIGN — quando o design é
 * composto por cima da foto, escurecem exatamente como na prévia.
 * O clone é colocado num wrapper offscreen (a posição do nó exportado nunca
 * é tocada: um nó raiz com position != static quebra a renderização de
 * imagens no foreignObject em alguns navegadores).
 */
function hollowOutPhoto(node: HTMLElement): HTMLElement {
  const clone = node.cloneNode(true) as HTMLElement;
  const frame = clone.firstElementChild as HTMLElement | null;
  const layer = (frame?.firstElementChild as HTMLElement | null) ?? null;
  const img = layer?.querySelector('img');
  img?.remove();
  if (frame) frame.style.background = 'transparent';
  if (layer) layer.style.background = 'transparent';
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `position:absolute;left:-10000px;top:0;width:${node.clientWidth}px;height:${node.clientHeight}px;`;
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);
  return clone;
}

/**
 * Desenha a foto com a MESMA geometria do CSS do card (object-fit: cover +
 * translate(calc(-50% + panX%)) scale(scale) com origem no centro do box).
 * O ctx já deve estar em unidades CSS do card (o scale 2× já aplicado). Usado
 * na composição principal e no fallback Canvas 2D — a foto nunca depende do
 * foreignObject do html-to-image.
 */
function drawPhotoCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  panX: number,
  panY: number,
  scale: number
): void {
  const { sx, sy, sw, sh } = coverRect(img.naturalWidth, img.naturalHeight, width, height);
  const { tx, ty } = panToTranslate(panX, panY, width, height);
  ctx.translate(width + tx, height + ty);
  ctx.scale(scale, scale);
  ctx.drawImage(img, sx, sy, sw, sh, -width / 2, -height / 2, width, height);
}

/**
 * Desenha a foto (cover/pan/zoom) num canvas 2× e compõe o design por cima.
 * O design tem o buraco transparente → a foto aparece; os overlays do design
 * escurecem a foto igual à prévia. Cantos respeitam o raio do card.
 */
function composePhotoUnderDesign(design: HTMLCanvasElement, photo: PreparedPhoto): HTMLCanvasElement {
  const { img, width, height, panX, panY, scale, radius } = photo;
  const final = document.createElement('canvas');
  final.width = design.width;
  final.height = design.height;
  const ratio = final.width / width; // 2× no pixelRatio 2, 1× no retry
  const ctx = final.getContext('2d');
  if (!ctx) throw new Error('canvas-unsupported');

  // --- Foto (canvas 2D — sem foreignObject) ---
  ctx.save();
  clipRoundedCard(ctx, final.width, final.height, radius * ratio);
  ctx.scale(ratio, ratio); // desenha em unidades CSS do card
  drawPhotoCover(ctx, img, width, height, panX, panY, scale);
  ctx.restore();

  // --- Design por cima (texto/painéis/overlays com o buraco da foto) ---
  ctx.drawImage(design, 0, 0);
  return final;
}

/** Recorta o canvas no formato do card (cantos arredondados). */
function clipRoundedCard(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  radius: number
): void {
  if (radius <= 0) return;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.arcTo(width, 0, width, height, radius);
  ctx.arcTo(width, height, 0, height, radius);
  ctx.arcTo(0, height, 0, 0, radius);
  ctx.arcTo(0, 0, width, 0, radius);
  ctx.closePath();
  ctx.clip();
}

/**
 * Verifica que o canvas gerado não saiu preto/vazio. Lança erro para que a
 * exportação re-tente ou caia no fallback — nunca compartilhar preto em
 * silêncio. `label` é só para distinguir no erro.
 */
function assertCanvasHasContent(canvas: HTMLCanvasElement, label: string): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error(`export-canvas-unavailable:${label}`);

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const total = canvas.width * canvas.height;
  let lit = 0;
  let sum = 0;
  const step = 8; // amostra a cada 8px — suficiente e rápido
  for (let i = 0; i < data.length; i += 4 * step) {
    const lum = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) | 0;
    sum += lum;
    if (lum > 25) lit++;
  }
  const sampled = total / step;
  if (lit / sampled < 0.005 || sum / sampled < 4) {
    throw new Error(`export-black:${label}`);
  }
}

/**
 * Verifica que a FOTO foi realmente desenhada no canvas final — o bug do
 * celular ("template com fundo preto"): o design sai com o buraco da foto
 * transparente (ou, em alguns WebViews, o foreignObject pinta o buraco de
 * PRETO) e a foto some sem erro visível. Compara a opacidade do design com
 * a do final: onde o design NÃO era opaco mas o final é opaco, a foto
 * preencheu o buraco. Sem isso → erro → re-try → fallback com a foto
 * (nunca compartilhar "fundo preto com template" em silêncio).
 */
function assertPhotoPresent(final: HTMLCanvasElement, design: HTMLCanvasElement): void {
  const ctxF = final.getContext('2d');
  const ctxD = design.getContext('2d');
  if (!ctxF || !ctxD) throw new Error('export-canvas-unavailable:photo');
  const dF = ctxF.getImageData(0, 0, final.width, final.height).data;
  const dD = ctxD.getImageData(0, 0, design.width, design.height).data;
  let filled = 0;
  let n = 0;
  const step = 64; // amostra a cada 64px — suficiente e rápido
  for (let i = 0; i < dF.length; i += 4 * step) {
    n++;
    // design não-opaco (buraco/overlays) + final opaco = foto cobriu o buraco
    if (dD[i + 3] < 250 && dF[i + 3] > 240) filled++;
  }
  if (filled / n < 0.02) {
    throw new Error('export-photo-missing');
  }
}

/** Canvas → Blob PNG (preferido sobre dataURL gigante). */
function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob-failed'))), 'image/png');
  });
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
  _template: ShareTemplateId,
  photo?: SharePhoto | null
): Promise<Blob> {
  const { width, height } = format;
  const canvas = document.createElement('canvas');
  canvas.width = width * 2;
  canvas.height = height * 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas-unsupported');
  ctx.scale(2, 2);
  const s = width / 1080; // escala tipográfica base (1080 = referência)

  // Cantos arredondados como na prévia (mesmo clip da composição principal).
  ctx.save();
  clipRoundedCard(ctx, width, height, 32);

  // ---- Fundo: foto do usuário (cover/pan/zoom, igual à prévia) ou, sem
  //      foto, o fundo premium (CARD_BG + manchas amarelas). Mesmo que o
  //      html-to-image falhe, a foto NUNCA desaparece do card. ----
  ctx.fillStyle = CARD_BG;
  ctx.fillRect(0, 0, width, height);
  let photoImg: HTMLImageElement | null = null;
  if (photo) {
    try {
      // timeout curto: fallback precisa ser rápido (é o caminho de exceção)
      photoImg = await loadPhotoImage(photo.url, 3000);
    } catch {
      photoImg = null;
    }
  }
  if (photo && photoImg) {
    const scale = Number.isFinite(photo.scale) && photo.scale > 0 ? photo.scale : 1;
    drawPhotoCover(ctx, photoImg, width, height, photo.panX, photo.panY, scale);
    // Escurece para o texto ficar legível (equivalente ao overlay da prévia).
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, width, height);
  } else {
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
  }
  ctx.restore();

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
