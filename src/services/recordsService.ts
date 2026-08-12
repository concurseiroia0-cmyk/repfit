import type { Workout } from '../types';
import { longestStreak } from '../utils/date';
import { exerciseVolume } from '../utils/calc';

export interface RecordEntry {
  key: string;
  label: string;
  /** Sublabel opcional, ex.: nome do exercício. */
  sublabel?: string;
  value: number;
  unit: 'kg' | 'reps' | 'dias' | '';
  date: string;
  workoutId: number | null;
}

interface Track {
  maxWeight: { v: number; date: string; workoutId: number | null };
  maxReps: { v: number; date: string; workoutId: number | null };
  maxExVolume: { v: number; date: string; workoutId: number | null };
}

/** Calcula todos os recordes pessoais a partir dos treinos reais. */
export function computeRecords(workouts: Workout[]): RecordEntry[] {
  const byName = new Map<string, Track>();
  let maxWorkoutVolume: RecordEntry | null = null;
  let maxWorkoutVolumeVal = 0;

  for (const w of workouts) {
    if (w.totalVolume > maxWorkoutVolumeVal) {
      maxWorkoutVolumeVal = w.totalVolume;
      maxWorkoutVolume = {
        key: 'maior-volume-treino',
        label: 'Maior volume em um treino',
        value: w.totalVolume,
        unit: 'kg',
        date: w.date,
        workoutId: w.id ?? null,
      };
    }
    for (const e of w.exercises) {
      const t = byName.get(e.name) ?? {
        maxWeight: { v: 0, date: w.date, workoutId: w.id ?? null },
        maxReps: { v: 0, date: w.date, workoutId: w.id ?? null },
        maxExVolume: { v: 0, date: w.date, workoutId: w.id ?? null },
      };
      let exVol = 0;
      for (const s of e.sets) {
        const weight = s.weight ?? 0;
        const reps = s.reps ?? 0;
        exVol += weight * reps;
        if (weight > t.maxWeight.v) {
          t.maxWeight = { v: weight, date: w.date, workoutId: w.id ?? null };
        }
        if (reps > t.maxReps.v) {
          t.maxReps = { v: reps, date: w.date, workoutId: w.id ?? null };
        }
      }
      const vol = exerciseVolume(e);
      if (vol > t.maxExVolume.v) {
        t.maxExVolume = { v: vol, date: w.date, workoutId: w.id ?? null };
      }
      byName.set(e.name, t);
    }
  }

  const out: RecordEntry[] = [];
  const names = [...byName.keys()].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  for (const name of names) {
    const t = byName.get(name)!;
    if (t.maxWeight.v > 0) {
      out.push({
        key: `carga:${name.toLowerCase()}`,
        label: 'Maior carga',
        sublabel: name,
        value: t.maxWeight.v,
        unit: 'kg',
        date: t.maxWeight.date,
        workoutId: t.maxWeight.workoutId,
      });
    }
    if (t.maxReps.v > 0) {
      out.push({
        key: `reps:${name.toLowerCase()}`,
        label: 'Maior nº de repetições',
        sublabel: name,
        value: t.maxReps.v,
        unit: 'reps',
        date: t.maxReps.date,
        workoutId: t.maxReps.workoutId,
      });
    }
    if (t.maxExVolume.v > 0) {
      out.push({
        key: `volume-ex:${name.toLowerCase()}`,
        label: 'Maior volume no exercício',
        sublabel: name,
        value: t.maxExVolume.v,
        unit: 'kg',
        date: t.maxExVolume.date,
        workoutId: t.maxExVolume.workoutId,
      });
    }
  }
  if (maxWorkoutVolume) out.push(maxWorkoutVolume);

  const streak = longestStreak(workouts.map((w) => w.date));
  if (streak > 1) {
    out.push({
      key: 'maior-sequencia',
      label: 'Maior sequência de treinos',
      value: streak,
      unit: 'dias',
      date: '',
      workoutId: null,
    });
  }

  // Ordena: primeiro os de carga/volume (mais relevantes), depois o resto.
  out.sort((a, b) => {
    const rank = (u: string) => (u === 'kg' ? 0 : u === 'reps' ? 1 : 2);
    return rank(a.unit) - rank(b.unit) || b.value - a.value;
  });

  return out;
}

/** Retorna os recordes que subiram entre `before` e `after`. */
export function diffRecords(after: RecordEntry[], before: RecordEntry[]): RecordEntry[] {
  const beforeMap = new Map(before.map((r) => [r.key, r.value]));
  return after.filter((r) => (beforeMap.get(r.key) ?? 0) < r.value);
}
