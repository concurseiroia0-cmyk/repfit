import Dexie, { type Table } from 'dexie';
import type { BodyMeasurement, ExerciseCatalogItem, Photo, Settings, SyncMapEntry, Workout } from '../types';

/**
 * Banco local (IndexedDB) do RepFit.
 * Estrutura versionada: incrementar o número da versão e adicionar
 * migrações em .upgrade() quando o modelo mudar.
 *
 * Obs.: o nome interno do banco ('diario-de-treino') é mantido de propósito —
 * renomeá-lo criaria um banco novo e esconderia os dados já salvos.
 */
export class DiarioDB extends Dexie {
  workouts!: Table<Workout, number>;
  exerciseCatalog!: Table<ExerciseCatalogItem, number>;
  photos!: Table<Photo, number>;
  settings!: Table<{ key: string; value: unknown }, string>;
  measurements!: Table<BodyMeasurement, number>;
  /** Mapa id-local → id-na-nuvem (usado pela sincronização Supabase). */
  syncMap!: Table<SyncMapEntry, string>;

  constructor() {
    super('diario-de-treino');
    this.version(1).stores({
      workouts: '++id, date, name, type, createdAt, [date+type]',
      exerciseCatalog: '++id, name, favorite, timesUsed',
      photos: '++id, workoutId',
      settings: 'key',
    });
    this.version(2).stores({
      workouts: '++id, date, name, type, createdAt, [date+type]',
      exerciseCatalog: '++id, name, favorite, timesUsed',
      photos: '++id, workoutId',
      settings: 'key',
      measurements: '++id, date, createdAt',
    });
    this.version(3).stores({
      workouts: '++id, date, name, type, createdAt, [date+type]',
      exerciseCatalog: '++id, name, favorite, timesUsed',
      photos: '++id, workoutId',
      settings: 'key',
      measurements: '++id, date, createdAt',
      syncMap: 'key, cloudId, entity',
    });
  }
}

export const db = new DiarioDB();

// Tratamento amigável de erros de armazenamento.
db.on('blocked', () => {
  console.warn('[RepFit] Banco bloqueado por outra aba.');
});
