import { db } from '../db/db';
import type { Photo } from '../types';

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;

/** Comprime/redimensiona a imagem (máx ~1600px) e devolve um Blob JPEG. */
export async function compressImageFile(file: Blob): Promise<{ blob: Blob; width: number; height: number }> {
  const bmp = await createImageBitmap(file);
  let { width, height } = bmp;
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  width = Math.max(1, Math.round(width * scale));
  height = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas não suportado neste navegador.');
  ctx.drawImage(bmp, 0, 0, width, height);
  if (typeof bmp.close === 'function') bmp.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Falha ao comprimir a imagem.'))),
      'image/jpeg',
      JPEG_QUALITY
    );
  });
  return { blob, width, height };
}

/** Salva uma foto como Blob no IndexedDB e devolve o registro. */
export async function addPhoto(workoutId: string, file: Blob): Promise<Photo> {
  const { blob, width, height } = await compressImageFile(file);
  const photo: Photo = { workoutId, blob, width, height, createdAt: Date.now() };
  const id = await db.photos.add(photo);
  return { ...photo, id };
}

export async function getPhoto(id: number): Promise<Photo | undefined> {
  return db.photos.get(id);
}

export async function deletePhoto(id: number): Promise<void> {
  await db.photos.delete(id);
}

/** Move uma foto de rascunho para um treino salvo. */
export async function relinkPhoto(photoId: string | null, workoutId: string): Promise<void> {
  if (!photoId) return;
  const photo = await db.photos.get(Number(photoId));
  if (photo) {
    await db.photos.update(photo.id!, { workoutId });
  }
}
