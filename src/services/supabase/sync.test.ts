import { describe, expect, it } from 'vitest';
import type { BodyMeasurement, Workout } from '../../types';
import { draftToWorkout, measurementFromCloud, toCloudMeasurement, toCloudWorkout } from './sync';

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

function localMeasurement(overrides: Partial<BodyMeasurement> = {}): BodyMeasurement {
  return {
    date: '2026-08-10',
    createdAt: 1_700_000_000_000,
    values: { weight: 82.5, arm: 36, waist: 88, chest: 104, thigh: 58, calf: 39 },
    ...overrides,
  };
}

describe('toCloudMeasurement (medição local → nuvem)', () => {
  it('mapeia as colunas padrão e preserva o mapa completo em notes (JSON)', () => {
    const payload = toCloudMeasurement(localMeasurement());
    expect(payload.measured_at).toBe('2026-08-10');
    expect(payload.weight).toBe(82.5);
    expect(payload.arm).toBe(36);
    expect(payload.waist).toBe(88);
    expect(payload.chest).toBe(104);
    expect(payload.thigh).toBe(58);
    expect(payload.calf).toBe(39);
    expect(JSON.parse(payload.notes ?? '')).toEqual({
      weight: 82.5,
      arm: 36,
      waist: 88,
      chest: 104,
      thigh: 58,
      calf: 39,
    });
  });

  it('trata medidas personalizadas (preserva no JSON mesmo sem coluna no banco)', () => {
    const payload = toCloudMeasurement(
      localMeasurement({ values: { weight: 70, 'custom-abc': 25, bodyFat: 15 } })
    );
    expect(payload.weight).toBe(70);
    expect(payload.body_fat_percentage).toBe(15);
    const restored = JSON.parse(payload.notes ?? '');
    expect(restored['custom-abc']).toBe(25);
    expect(restored.bodyFat).toBe(15);
  });
});

describe('measurementFromCloud (nuvem → medição local)', () => {
  it('reconstitui o mapa completo a partir do JSON em notes', () => {
    const values = measurementFromCloud({
      id: 'm1',
      user_id: 'u1',
      measured_at: '2026-08-10T00:00:00Z',
      weight: 82.5,
      body_fat_percentage: null,
      chest: null,
      waist: null,
      arm: null,
      thigh: null,
      calf: null,
      notes: JSON.stringify({ weight: 82.5, arm: 36, 'custom-x': 12 }),
      created_at: '2026-08-10T00:00:00Z',
      updated_at: '2026-08-10T00:00:00Z',
    });
    expect(values).toEqual({ weight: 82.5, arm: 36, 'custom-x': 12 });
  });

  it('sem JSON válido, monta pelas colunas padrão', () => {
    const values = measurementFromCloud({
      id: 'm1',
      user_id: 'u1',
      measured_at: '2026-08-10T00:00:00Z',
      weight: 70,
      body_fat_percentage: 15,
      chest: 100,
      waist: 80,
      arm: 34,
      thigh: 55,
      calf: 37,
      notes: null,
      created_at: '2026-08-10T00:00:00Z',
      updated_at: '2026-08-10T00:00:00Z',
    });
    expect(values).toEqual({
      weight: 70,
      bodyFat: 15,
      chest: 100,
      waist: 80,
      arm: 34,
      thigh: 55,
      calf: 37,
    });
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
