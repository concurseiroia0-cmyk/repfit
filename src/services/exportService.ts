import { format } from 'date-fns';
import { db } from '../db/db';
import type { BodyMeasurement, ExerciseCatalogItem, Photo, Workout } from '../types';
import { blobToDataUrl, dataUrlToBlob } from '../utils/storage';
import { getSettings, saveSettings } from './settingsService';

export const EXPORT_APP_NAME = 'repfit';
/** Marcadores aceitos na importação (backups antigos usavam o nome anterior). */
export const EXPORT_APP_NAMES = new Set(['repfit', 'diario-de-treino']);
export const EXPORT_VERSION = 2;

export interface ExportPayload {
  app: string;
  version: number;
  exportedAt: string;
  settings: unknown;
  workouts: Workout[];
  exerciseCatalog: ExerciseCatalogItem[];
  measurements: BodyMeasurement[];
  photos: Array<{
    id?: number;
    workoutId: string;
    dataUrl: string;
    width: number;
    height: number;
    createdAt: number;
  }>;
}

/** Exporta todos os dados (incluindo fotos em base64) para um arquivo JSON. */
export async function exportAllData(): Promise<void> {
  const [workouts, catalog, measurements, photos, settings] = await Promise.all([
    db.workouts.toArray(),
    db.exerciseCatalog.toArray(),
    db.measurements.toArray(),
    db.photos.toArray(),
    getSettings(),
  ]);

  const photosOut = await Promise.all(
    photos.map(async (p) => ({
      id: p.id,
      workoutId: p.workoutId,
      dataUrl: await blobToDataUrl(p.blob),
      width: p.width,
      height: p.height,
      createdAt: p.createdAt,
    }))
  );

  const payload: ExportPayload = {
    app: EXPORT_APP_NAME,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    settings,
    workouts,
    exerciseCatalog: catalog,
    measurements,
    photos: photosOut,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `meus-treinos-${format(new Date(), 'dd-MM-yyyy')}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);

  // Marca a data do último backup para os lembretes.
  await saveSettings({ lastBackupAt: Date.now() });
}

export interface ImportResult {
  workouts: number;
  photos: number;
  catalog: number;
  measurements: number;
}

/** Importa dados de um JSON exportado, substituindo todos os dados atuais. */
export async function importAllData(text: string): Promise<ImportResult> {
  const data = JSON.parse(text) as Partial<ExportPayload>;
  if (!data || !data.app || !EXPORT_APP_NAMES.has(data.app) || !Array.isArray(data.workouts)) {
    throw new Error('Arquivo inválido: não parece ser um backup do RepFit.');
  }

  const workouts = data.workouts as Workout[];
  const catalog = Array.isArray(data.exerciseCatalog) ? (data.exerciseCatalog as ExerciseCatalogItem[]) : [];
  const measurements = Array.isArray(data.measurements) ? (data.measurements as BodyMeasurement[]) : [];
  const photosRaw = Array.isArray(data.photos) ? data.photos : [];

  const photoRecords: Photo[] = [];
  for (const p of photosRaw) {
    if (!p?.dataUrl) continue;
    const blob = await dataUrlToBlob(p.dataUrl);
    photoRecords.push({
      id: p.id,
      workoutId: p.workoutId,
      blob,
      width: p.width,
      height: p.height,
      createdAt: p.createdAt,
    });
  }

  await db.transaction('rw', db.workouts, db.exerciseCatalog, db.photos, db.measurements, db.settings, async () => {
    await Promise.all([db.workouts.clear(), db.exerciseCatalog.clear(), db.photos.clear(), db.measurements.clear()]);
    if (workouts.length) await db.workouts.bulkAdd(workouts);
    if (catalog.length) await db.exerciseCatalog.bulkAdd(catalog);
    if (photoRecords.length) await db.photos.bulkAdd(photoRecords);
    if (measurements.length) await db.measurements.bulkAdd(measurements);
    if (data.settings && typeof data.settings === 'object') {
      await db.settings.put({ key: 'main', value: data.settings });
    }
  });

  return { workouts: workouts.length, photos: photoRecords.length, catalog: catalog.length, measurements: measurements.length };
}

/** Apaga todos os dados do app. */
export async function clearAllData(): Promise<void> {
  await db.transaction('rw', db.workouts, db.exerciseCatalog, db.photos, db.measurements, db.settings, async () => {
    await Promise.all([
      db.workouts.clear(),
      db.exerciseCatalog.clear(),
      db.photos.clear(),
      db.measurements.clear(),
      db.settings.clear(),
    ]);
  });
  clearDraftLocal();
}

function clearDraftLocal(): void {
  try {
    localStorage.removeItem('diario.rascunho.v1');
  } catch {
    // ignora
  }
}
