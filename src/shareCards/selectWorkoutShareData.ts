import { db } from '../db/db';
import { getSettings } from '../services/settingsService';
import { computeRecords } from '../services/recordsService';
import { exerciseVolume } from '../utils/calc';
import type { Workout, WorkoutExercise } from '../types';
import { dateLabel } from './formatShareStats';
import type { ShareCardData, ShareEvolution, ShareEvolutionPoint, ShareExercise, ShareRecord } from './types';

/**
 * Lê o treino real + histórico (IndexedDB) e devolve os dados prontos para os
 * templates. Nenhuma chamada de rede. Retorna null se o treino não existir.
 */
export async function selectWorkoutShareData(workoutId: number): Promise<ShareCardData | null> {
  const workout = await db.workouts.get(workoutId);
  if (!workout) return null;
  const [all, settings] = await Promise.all([db.workouts.toArray(), getSettings()]);

  // ---- Totais ----
  let sets = 0;
  let reps = 0;
  for (const e of workout.exercises) {
    sets += e.sets.length;
    for (const s of e.sets) reps += s.reps ?? 0;
  }
  const hasLoad = workout.exercises.some((e) => e.sets.some((s) => (s.weight ?? 0) > 0));
  const volumeKg = workout.totalVolume > 0 ? workout.totalVolume : null;

  // ---- Exercícios principais (ordem do treino, até 5) ----
  const allExercises: ShareExercise[] = workout.exercises.map((e) => {
    let w = 0;
    let r = 0;
    const vol = exerciseVolume(e);
    for (const s of e.sets) {
      w = Math.max(w, s.weight ?? 0);
      r += s.reps ?? 0;
    }
    return {
      name: e.name.trim(),
      sets: e.sets.length,
      reps: r,
      weightKg: w > 0 ? w : null,
      volumeKg: vol > 0 ? vol : null,
    };
  });
  const moreExercises = Math.max(0, allExercises.length - 5);
  const exercises = allExercises.slice(0, 5);

  // ---- Recordes ----
  const current = computeRecords(all);
  const prevMap = new Map(computeRecords(all.filter((w) => w.id !== workoutId)).map((r) => [r.key, r.value]));
  const mine = current
    .filter((r) => r.workoutId === workoutId && (prevMap.get(r.key) ?? 0) < r.value)
    .map((r) => {
      const prevValue = prevMap.get(r.key) ?? null;
      return {
        key: r.key,
        label: r.label,
        sublabel: r.sublabel,
        value: r.value,
        unit: r.unit,
        date: r.date,
        prevValue,
        delta: prevValue != null ? Math.round((r.value - prevValue) * 10) / 10 : null,
      } as ShareRecord;
    });
  let record: ShareRecord | null = null;
  if (mine.length > 0) {
    // Prefere o recorde de carga (kg); entre iguais, o maior delta.
    record = [...mine].sort((a, b) => {
      const rank = (u: string) => (u === 'kg' ? 0 : u === 'reps' ? 1 : 2);
      return rank(a.unit) - rank(b.unit) || (b.delta ?? 0) - (a.delta ?? 0);
    })[0] ?? null;
  }

  // ---- Evolução (exercício que mais evoluiu neste treino) ----
  const evolution = computeEvolution(workout, all);

  return {
    workoutName: workout.name.trim(),
    workoutType: workout.type,
    mode: workout.mode ?? null,
    dateLabel: dateLabel(workout.date),
    photoId: workout.photoId != null ? Number(workout.photoId) : null,
    username: settings.username,
    avatarUrl: null, // o app ainda não tem avatar
    unit: settings.unit,
    totals: {
      exercises: workout.exercises.length,
      sets,
      reps,
      volumeKg,
      durationMin: workout.durationMin,
    },
    averageEffort: workout.avgEffort != null && workout.avgEffort > 0 ? workout.avgEffort : null,
    exercises,
    moreExercises,
    record,
    evolution,
    hasLoad,
  };
}

/** Histórico de um exercício (data + maior carga × maior reps por treino). */
function exerciseHistory(name: string, all: Workout[]): ShareEvolutionPoint[] {
  const out: ShareEvolutionPoint[] = [];
  const sorted = [...all].sort((a, b) => a.date.localeCompare(b.date));
  for (const w of sorted) {
    const e = w.exercises.find((x) => x.name.toLowerCase() === name.toLowerCase());
    if (!e) continue;
    let wkg = 0;
    let reps = 0;
    for (const s of e.sets) {
      wkg = Math.max(wkg, s.weight ?? 0);
      reps = Math.max(reps, s.reps ?? 0);
    }
    out.push({ dateLabel: dateLabel(w.date), weightKg: wkg > 0 ? wkg : null, reps });
  }
  return out;
}

function computeEvolution(workout: Workout, all: Workout[]): ShareEvolution | null {
  // Exercício deste treino com mais evolução de carga no histórico.
  let best: WorkoutExercise | null = null;
  let bestDelta = -1;
  for (const e of workout.exercises) {
    const hist = exerciseHistory(e.name, all).filter((p) => p.weightKg != null);
    if (hist.length < 2) continue;
    const first = hist[0].weightKg ?? 0;
    const last = hist[hist.length - 1].weightKg ?? 0;
    const delta = last - first;
    if (delta > bestDelta) {
      bestDelta = delta;
      best = e;
    }
  }
  if (!best) {
    // Fallback: primeiro exercício com histórico (mesmo sem carga → reps).
    for (const e of workout.exercises) {
      const hist = exerciseHistory(e.name, all);
      if (hist.length >= 2) {
        best = e;
        break;
      }
    }
    if (!best) return null;
  }

  const points = exerciseHistory(best.name, all).slice(-3);
  const withLoad = points.some((p) => p.weightKg != null);
  const first = points[0];
  const last = points[points.length - 1];
  let deltaPercent: number | null = null;
  let deltaReps: number | null = null;

  if (withLoad && first.weightKg && last.weightKg && first.weightKg > 0) {
    deltaPercent = Math.round(((last.weightKg - first.weightKg) / first.weightKg) * 1000) / 10;
  } else if (first.reps > 0 && last.reps > 0) {
    deltaReps = last.reps - first.reps;
  }

  return {
    exercise: best.name,
    points,
    deltaPercent,
    deltaReps,
  };
}

export { exerciseVolume };
