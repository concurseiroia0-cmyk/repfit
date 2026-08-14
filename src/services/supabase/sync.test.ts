import { describe, expect, it } from 'vitest';
import type { Workout } from '../../types';
import { draftToWorkout, toCloudWorkout } from './sync';

function localWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
    id: 42,
    date: '2026-08-10',
    weekday: 1,
    name: 'Treino de Peito',
    type: 'Push',
    mode: 'academia',
    notes: 'Bom treino',
    exercises: [
      {
        id: 'ex-1',
        name: 'Supino Reto',
        order: 0,
        effort: 4,
        notes: '',
        sets: [
          { id: 's-1', weight: 40, reps: 10 },
          { id: 's-2', weight: 42.5, reps: 8 },
        ],
      },
      {
        id: 'ex-2',
        name: 'Crucifixo',
        order: 1,
        effort: null,
        notes: '',
        sets: [{ id: 's-3', weight: 20, reps: 12 }],
      },
    ],
    photoId: null,
    durationMin: 75,
    restSec: 90,
    totalVolume: 0,
    avgEffort: null,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

describe('toCloudWorkout (mapeamento local → nuvem)', () => {
  it('mapeia os campos do treino', () => {
    const payload = toCloudWorkout(localWorkout());
    expect(payload.workout).toEqual({
      name: 'Treino de Peito',
      type: 'Push',
      workout_date: '2026-08-10',
      duration_seconds: 4500, // 75 min
      notes: 'Bom treino',
      effort_level: null,
      mode: 'academia',
    });
  });

  it('mapeia exercícios em ordem com sets numerados e peso em kg', () => {
    const payload = toCloudWorkout(localWorkout());
    expect(payload.exercises).toHaveLength(2);
    expect(payload.exercises[0].exercise_name).toBe('Supino Reto');
    expect(payload.exercises[0].order_index).toBe(0);
    expect(payload.exercises[0].sets).toEqual([
      { set_number: 1, repetitions: 10, weight: 40, weight_unit: 'kg', duration_seconds: null, distance: null, rest_seconds: null, effort_level: null, completed: true, notes: null },
      { set_number: 2, repetitions: 8, weight: 42.5, weight_unit: 'kg', duration_seconds: null, distance: null, rest_seconds: null, effort_level: null, completed: true, notes: null },
    ]);
    expect(payload.exercises[1].exercise_name).toBe('Crucifixo');
    expect(payload.exercises[1].order_index).toBe(1);
  });

  it('trata campos ausentes como null (não inventa dados)', () => {
    const payload = toCloudWorkout(
      localWorkout({ notes: '', durationMin: null, mode: undefined, avgEffort: null })
    );
    expect(payload.workout.notes).toBeNull();
    expect(payload.workout.duration_seconds).toBeNull();
    expect(payload.workout.mode).toBeNull();
    expect(payload.workout.effort_level).toBeNull();
  });
});

describe('draftToWorkout (rascunho do formulário → treino enviável)', () => {
  it('converte rascunho em Workout com séries filtradas e vírgula → ponto', () => {
    const w = draftToWorkout(
      {
        date: '2026-08-12',
        name: 'Treino',
        type: 'Pull',
        notes: '',
        durationMin: '60',
        mode: 'calistenia',
        restSec: 0,
        exercises: [
          {
            id: 'e1',
            name: 'Barra Fixa',
            effort: null,
            notes: '',
            sets: [
              { id: 's1', weight: '', reps: '10' }, // sem peso → entra com weight null
              { id: 's2', weight: '22,5', reps: '8' },
              { id: 's3', weight: '', reps: '' }, // vazio → descartado
            ],
          },
        ],
      },
      1_700_000_000_000
    );
    expect(w.date).toBe('2026-08-12');
    expect(w.mode).toBe('calistenia');
    expect(w.durationMin).toBe(60);
    expect(w.exercises).toHaveLength(1);
    expect(w.exercises[0].sets).toEqual([
      { id: 's1', weight: null, reps: 10 },
      { id: 's2', weight: 22.5, reps: 8 },
    ]);
  });

  it('descarta exercícios sem nome', () => {
    const w = draftToWorkout(
      {
        date: '2026-08-12',
        name: 'Treino',
        type: '',
        notes: '',
        durationMin: '',
        mode: 'academia',
        restSec: 0,
        exercises: [
          { id: 'e1', name: '   ', effort: null, notes: '', sets: [] },
          { id: 'e2', name: 'Agachamento', effort: null, notes: '', sets: [] },
        ],
      },
      1
    );
    expect(w.exercises).toHaveLength(1);
    expect(w.exercises[0].name).toBe('Agachamento');
  });
});
