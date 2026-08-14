/**
 * Foto de perfil do usuário.
 * A imagem é CENTRALIZADA em um quadrado e reduzida para 256×256 em JPEG
 * (~15–30 KB como dataURL) — ocupa pouco espaço no dispositivo e continua
 * legível em qualquer lugar (perfil, cards, exportação).
 */
import { pickPhotoFile } from '../shareCards/photo';

/** Abre o seletor nativo (câmera ou galeria) e resolve o dataURL comprimido. */
export async function pickAvatar(capture: boolean): Promise<string | null> {
  const file = await pickPhotoFile(capture);
  if (!file) return null;
  return await processAvatarFile(file);
}

/**
 * Centraliza em um quadrado (recorta o excesso) e reduz para 256×256 em
 * JPEG 0.82. Qualquer Blob/File serve (galeria ou câmera).
 */
export async function processAvatarFile(blob: Blob): Promise<string | null> {
  try {
    const source = await readBitmap(blob);
    const side = Math.min(source.width, source.height);
    const sx = Math.floor((source.width - side) / 2);
    const sy = Math.floor((source.height - side) / 2);
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas-unavailable');
    // Centraliza e cobre o quadrado 256×256.
    ctx.drawImage(source as CanvasImageSource, sx, sy, side, side, 0, 0, 256, 256);
    if (typeof (source as ImageBitmap).close === 'function') (source as ImageBitmap).close();
    return canvas.toDataURL('image/jpeg', 0.82);
  } catch {
    return null;
  }
}

async function readBitmap(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      // 'from-image' aplica a rotação EXIF automaticamente.
      return await createImageBitmap(blob, { imageOrientation: 'from-image' });
    } catch {
      /* cai no fallback */
    }
  }
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(blob);
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
