import type { Settings, Workout } from '../types';
import { sumVolume } from './calc';
import { addDays } from 'date-fns';
import { parseLocalDate, toDateString } from './date';

export type WeeklyGoal = NonNullable<Settings['weeklyGoal']>;

export interface WeeklyGoalProgress {
  type: WeeklyGoal['type'];
  /** Progresso atual na unidade da meta (treinos, kg ou minutos). */
  value: number;
  target: number;
  /** 0..100 (limitado). */
  percent: number;
  done: boolean;
}

/**
 * Progresso da semana (a partir de `weekStart`, YYYY-MM-DD — normalmente a
 * segunda-feira) em relação à meta. O volume usa os valores em kg do treino
 * (a conversão para lb é só visual, feita na UI).
 */
export function weeklyGoalProgress(
  workouts: Workout[] | undefined,
  goal: WeeklyGoal | undefined,
  weekStart: string
): WeeklyGoalProgress | null {
  if (!goal || !workouts) return null;
  // Semana = [weekStart, weekStart + 7 dias): treinos da segunda à próxima.
  const weekEnd = toDateString(addDays(parseLocalDate(weekStart), 7));
  const week = workouts.filter((w) => w.date >= weekStart && w.date < weekEnd);
  let value = 0;
  if (goal.type === 'frequency') {
    value = week.length;
  } else if (goal.type === 'volume') {
    value = Math.round(sumVolume(week) * 10) / 10;
  } else {
    value = week.reduce((a, w) => a + (w.durationMin ?? 0), 0);
  }
  const target = Math.max(1, goal.target);
  const percent = Math.min(100, Math.round((value / target) * 100));
  return { type: goal.type, value, target, percent, done: value >= target };
}
