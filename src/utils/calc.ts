import type { Unit, Workout, WorkoutExercise } from '../types';

/** Soma do volume (séries × reps × carga) de todos os exercícios. */
export function computeVolume(exercises: WorkoutExercise[]): number {
  let total = 0;
  for (const e of exercises) {
    for (const s of e.sets) {
      total += (s.weight ?? 0) * (s.reps ?? 0);
    }
  }
  return Math.round(total * 10) / 10;
}

/** Esforço médio do treino (1–6), null se nenhum exercício tiver esforço. */
export function computeAvgEffort(exercises: WorkoutExercise[]): number | null {
  const efforts = exercises.map((e) => e.effort).filter((v): v is number => v != null);
  if (efforts.length === 0) return null;
  const avg = efforts.reduce((a, b) => a + b, 0) / efforts.length;
  return Math.round(avg * 10) / 10;
}

/** Converte peso em kg para a unidade de exibição. */
export function kgToUnit(kg: number, unit: Unit): number {
  return unit === 'lb' ? kg * 2.2046226218 : kg;
}

/** Converte valor digitado na unidade de exibição para kg. */
export function unitToKg(v: number, unit: Unit): number {
  return unit === 'lb' ? v / 2.2046226218 : v;
}

/** Formata número no padrão pt-BR (22.5 -> "22,5"). */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(n);
}

/** Formata peso em kg para exibição na unidade escolhida. */
export function formatWeight(kg: number | null | undefined, unit: Unit): string {
  if (kg == null) return '—';
  return `${formatNumber(kgToUnit(kg, unit))} ${unit}`;
}

/** Converte string digitada (aceita vírgula) em número. */
export function parseNum(s: string): number | null {
  if (!s || !s.trim()) return null;
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/** Converte string digitada na unidade de exibição para kg. */
export function displayToKg(s: string, unit: Unit): number | null {
  const n = parseNum(s);
  return n == null ? null : Math.round(unitToKg(n, unit) * 10) / 10;
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const v = bytes / 1024 ** i;
  return `${v.toFixed(v >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}

/** Pluraliza: pluralize(5, 'treino', 'treinos') -> '5 treinos'. */
export function pluralize(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

/** Volume do treino somado para um exercício específico. */
export function exerciseVolume(e: WorkoutExercise): number {
  let total = 0;
  for (const s of e.sets) {
    total += (s.weight ?? 0) * (s.reps ?? 0);
  }
  return Math.round(total * 10) / 10;
}

/** Soma de volumes de uma lista de treinos (ex.: volume da semana). */
export function sumVolume(workouts: Workout[]): number {
  return Math.round(workouts.reduce((a, w) => a + (w.totalVolume || 0), 0) * 10) / 10;
}

/** Formata segundos como m:ss (ex.: 95 -> '1:35'). */
export function formatSeconds(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

/** Formata um total de segundos como '5 min' / '1 h 2 min'. */
export function formatDurationShort(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h} h ${m % 60} min`;
  return `${m} min`;
}
