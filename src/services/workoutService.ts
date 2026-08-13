import { db } from '../db/db';
import type { Workout } from '../types';
import { computeAvgEffort, computeVolume } from '../utils/calc';
import { parseLocalDate } from '../utils/date';
import { uid } from '../utils/misc';
import { computeRecords, diffRecords, type RecordEntry } from './recordsService';

/** Todos os treinos, do mais recente para o mais antigo (data desc). */
export function workoutsLive() {
  return db.workouts.orderBy('date').reverse().toArray();
}

export async function getWorkout(id: number): Promise<Workout | undefined> {
  return db.workouts.get(id);
}

export async function deleteWorkout(id: number): Promise<void> {
  await db.transaction('rw', db.workouts, db.photos, async () => {
    await db.photos.where('workoutId').equals(String(id)).delete();
    await db.workouts.delete(id);
  });
}

function normalize(w: Workout): Workout {
  return {
    ...w,
    restSec: w.restSec ?? null,
    totalVolume: computeVolume(w.exercises),
    avgEffort: computeAvgEffort(w.exercises),
  };
}

/**
 * Cria ou atualiza um treino. Atualiza o catálogo de exercícios e
 * retorna os recordes novos conquistados (para mostrar o toast).
 */
export async function saveWorkout(
  input: Workout
): Promise<{ workout: Workout; newRecords: RecordEntry[] }> {
  const before = await db.workouts.toArray();
  const prevRecords = computeRecords(before);

  const now = Date.now();
  const record = normalize({ ...input, updatedAt: now });
  let id: number;

  if (record.id != null) {
    const existing = await db.workouts.get(record.id);
    record.createdAt = existing?.createdAt ?? now;
    await db.workouts.put(record);
    id = record.id;
  } else {
    record.createdAt = now;
    id = await db.workouts.add(record as Workout);
  }

  await updateCatalogFromWorkout({ ...record, id });

  const after = await db.workouts.toArray();
  const newRecords = diffRecords(computeRecords(after), prevRecords);
  return { workout: { ...record, id }, newRecords };
}

async function updateCatalogFromWorkout(w: Workout): Promise<void> {
  for (const ex of w.exercises) {
    const name = ex.name.trim();
    if (!name) continue;
    const existing = await db.exerciseCatalog.where('name').equalsIgnoreCase(name).first();
    const maxWeight = ex.sets.reduce((m, s) => Math.max(m, s.weight ?? 0), 0);
    const maxReps = ex.sets.reduce((m, s) => Math.max(m, s.reps ?? 0), 0);
    if (existing && existing.id != null) {
      await db.exerciseCatalog.update(existing.id, {
        lastWeight: maxWeight > 0 ? maxWeight : existing.lastWeight,
        lastReps: maxReps > 0 ? maxReps : existing.lastReps,
        timesUsed: existing.timesUsed + 1,
      });
    } else {
      await db.exerciseCatalog.add({
        name,
        muscleGroup: 'Outros',
        favorite: false,
        lastWeight: maxWeight > 0 ? maxWeight : null,
        lastReps: maxReps > 0 ? maxReps : null,
        timesUsed: 1,
      });
    }
  }
}

/** Cria um novo treino a partir de um treino antigo, com a data fornecida. */
export function workoutFromTemplate(src: Workout, date: string): Workout {
  return {
    date,
    weekday: parseLocalDate(date).getDay(),
    name: src.name,
    type: src.type,
    mode: src.mode,
    notes: src.notes,
    exercises: src.exercises.map((e, i) => ({
      ...e,
      id: uid(),
      order: i,
      sets: e.sets.map((s) => ({ ...s, id: uid() })),
    })),
    photoId: null,
    durationMin: null,
    restSec: null,
    totalVolume: 0,
    avgEffort: null,
    createdAt: 0,
    updatedAt: 0,
  };
}

/** Nomes de exercícios já usados em treinos (para o autocomplete). */
export async function usedExerciseNames(): Promise<string[]> {
  const workouts = await db.workouts.toArray();
  const names = new Set<string>();
  for (const w of workouts) {
    for (const e of w.exercises) {
      if (e.name.trim()) names.add(e.name.trim());
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}
