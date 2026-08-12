/**
 * Seleção e processamento LOCAL de fotos para os cards compartilháveis.
 * Nada é enviado para servidor: a foto vira um dataURL em memória,
 * redimensionada (máx. 1920px) e com a orientação EXIF corrigida.
 * O dataURL é descartado quando o modal fecha.
 */
import type { SharePhoto } from './types';

/** Abre o seletor nativo (câmera ou galeria) e resolve o arquivo escolhido. */
export function pickPhotoFile(capture: boolean): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (capture) input.setAttribute('capture', 'environment');
    let done = false;
    const finish = (f: File | null) => {
      if (done) return;
      done = true;
      window.removeEventListener('focus', onFocus);
      resolve(f);
    };
    const onFocus = () => {
      // Seletor fechou sem arquivo → cancelamento (não trava a promessa).
      window.setTimeout(() => finish(null), 400);
    };
    input.onchange = () => finish(input.files?.[0] ?? null);
    window.addEventListener('focus', onFocus);
    input.click();
  });
}

/** Lê o arquivo respeitando a orientação EXIF e reduz para no máx. 1920px. */
export async function processPhotoFile(file: File): Promise<SharePhoto | null> {
  try {
    const source = await readBitmap(file);
    const maxDim = 1920;
    const ratio = Math.min(1, maxDim / Math.max(source.width, source.height));
    const width = Math.max(1, Math.round(source.width * ratio));
    const height = Math.max(1, Math.round(source.height * ratio));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas-unavailable');
    ctx.drawImage(source as CanvasImageSource, 0, 0, width, height);
    if (typeof (source as ImageBitmap).close === 'function') (source as ImageBitmap).close();
    const url = canvas.toDataURL('image/jpeg', 0.85);
    return { url, scale: 1, panX: 0, panY: 0 };
  } catch {
    // Fallback: carrega sem redimensionar (formato exótico, por exemplo).
    try {
      const url = await fileToDataURL(file);
      return { url, scale: 1, panX: 0, panY: 0 };
    } catch {
      return null;
    }
  }
}

async function readBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      // 'from-image' aplica a rotação EXIF automaticamente.
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      /* cai no fallback */
    }
  }
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image-load-failed'));
    };
    img.src = url;
  });
}

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('read-failed'));
    reader.readAsDataURL(file);
  });
}

export function clampNum(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Limite do arraste (em % do card) para o zoom atual. */
export function maxPan(scale: number): number {
  return ((scale - 1) / 2) * 100;
}
