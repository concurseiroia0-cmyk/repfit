import { describe, expect, it } from 'vitest';
import type { Workout } from '../types';
import { weeklyGoalProgress } from './goals';

function workout(date: string, overrides: Partial<Workout> = {}): Workout {
  return {
    date,
    weekday: 0,
    name: 'T',
    type: '',
    notes: '',
    exercises: [],
    photoId: null,
    durationMin: null,
    restSec: null,
    totalVolume: 0,
    avgEffort: null,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

const WEEK = '2026-08-10'; // segunda-feira

describe('weeklyGoalProgress', () => {
  it('frequência: conta treinos da semana (ignora os de fora)', () => {
    const workouts = [
      workout('2026-08-10'),
      workout('2026-08-12'),
      workout('2026-08-15'),
      workout('2026-08-09'), // domingo anterior — fora
      workout('2026-08-17'), // semana seguinte — fora
    ];
    const p = weeklyGoalProgress(workouts, { type: 'frequency', target: 3 }, WEEK);
    expect(p).not.toBeNull();
    expect(p!.value).toBe(3);
    expect(p!.percent).toBe(100);
    expect(p!.done).toBe(true);
  });

  it('frequência: meta não batida → percentual proporcional', () => {
    const workouts = [workout('2026-08-10'), workout('2026-08-12')];
    const p = weeklyGoalProgress(workouts, { type: 'frequency', target: 4 }, WEEK);
    expect(p!.value).toBe(2);
    expect(p!.percent).toBe(50);
    expect(p!.done).toBe(false);
  });

  it('volume: soma totalVolume (kg) da semana', () => {
    const workouts = [
      workout('2026-08-10', { totalVolume: 6000 }),
      workout('2026-08-12', { totalVolume: 5400.25 }),
    ];
    const p = weeklyGoalProgress(workouts, { type: 'volume', target: 12000 }, WEEK);
    expect(p!.value).toBe(11400.3);
    expect(p!.percent).toBe(95);
    expect(p!.done).toBe(false);
  });

  it('volume: passa da meta → 100% e done', () => {
    const workouts = [workout('2026-08-10', { totalVolume: 13000 })];
    const p = weeklyGoalProgress(workouts, { type: 'volume', target: 12000 }, WEEK);
    expect(p!.value).toBe(13000);
    expect(p!.percent).toBe(100);
    expect(p!.done).toBe(true);
  });

  it('duração: soma durationMin da semana', () => {
    const workouts = [
      workout('2026-08-11', { durationMin: 75 }),
      workout('2026-08-13', { durationMin: 90 }),
      workout('2026-08-14', { durationMin: null }), // sem duração — ignorado
    ];
    const p = weeklyGoalProgress(workouts, { type: 'duration', target: 150 }, WEEK);
    expect(p!.value).toBe(165);
    expect(p!.percent).toBe(100);
    expect(p!.done).toBe(true);
  });

  it('sem meta ou sem dados → null', () => {
    expect(weeklyGoalProgress([], undefined, WEEK)).toBeNull();
    expect(weeklyGoalProgress(undefined, { type: 'frequency', target: 3 }, WEEK)).toBeNull();
  });
});
