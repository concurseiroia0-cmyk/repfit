/**
 * Testes do GERADOR DE CARDS compartilháveis.
 *
 * Valida a camada de dados que alimenta os templates: `selectWorkoutShareData`
 * (totais, exercícios, recordes, evolução, foto do treino — tudo calculado
 * dos dados reais no IndexedDB, sem rede) e `formatShareStats` (formatação
 * segura: nulos/NaN nunca viram "NaN"/"undefined" no card).
 */
import 'fake-indexeddb/auto';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db/db';
import { saveSettings } from '../services/settingsService';
import type { Workout, WorkoutExercise } from '../types';
import { selectWorkoutShareData } from './selectWorkoutShareData';
import {
  dateLabel,
  dateLabelShort,
  digitCount,
  fmtBig,
  fmtInt,
  fmtNum,
  monogram,
  safe,
  shareFileName,
  slugify,
} from './formatShareStats';

// ---------------------------------------------------------------------------
// Ajudantes
// ---------------------------------------------------------------------------

let seq = 0;
function makeWorkout(overrides: Partial<Workout> = {}): Workout {
  seq += 1;
  return {
    date: '2026-08-12',
    weekday: 3,
    name: `Treino ${seq}`,
    type: 'Peito + Tríceps',
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

function ex(name: string, sets: { weight?: number | null; reps?: number | null }[]): WorkoutExercise {
  return {
    id: `ex-${name}-${Math.random()}`,
    name,
    order: 0,
    effort: null,
    notes: '',
    sets: sets.map((s, i) => ({
      id: `set-${name}-${i}`,
      weight: s.weight != null ? s.weight : null,
      reps: s.reps != null ? s.reps : null,
    })),
  };
}

/** Recursivamente verifica que não há NaN/Infinity nem strings NaN/undefined. */
function expectClean(value: unknown, path = 'root'): void {
  if (value === null || value === undefined) return;
  if (typeof value === 'number') {
    expect(Number.isFinite(value), `${path} deve ser finito`).toBe(true);
    return;
  }
  if (typeof value === 'string') {
    expect(['NaN', 'undefined', 'null'].includes(value), `${path} não pode conter "${value}"`).toBe(false);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => expectClean(v, `${path}[${i}]`));
    return;
  }
  if (typeof value === 'object') {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      expectClean(v, `${path}.${k}`);
    }
  }
}

// ---------------------------------------------------------------------------
// selectWorkoutShareData
// ---------------------------------------------------------------------------

describe('selectWorkoutShareData (dados do card)', () => {
  beforeEach(async () => {
    await Promise.all([db.workouts.clear(), db.photos.clear(), db.settings.clear()]);
  });

  afterAll(async () => {
    await db.close();
  });

  it('calcula totais reais: exercícios, séries, reps, volume, duração e esforço', async () => {
    await saveSettings({ username: 'Ana' });
    const id = (await db.workouts.add(
      makeWorkout({
        name: 'Peito Forte',
        date: '2026-08-12',
        durationMin: 50,
        avgEffort: 3,
        photoId: '42',
        totalVolume: 1180,
        exercises: [
          ex('Supino Reto', [
            { weight: 50, reps: 10 },
            { weight: 55, reps: 8 },
          ]),
          ex('Rosca Direta', [{ weight: 20, reps: 12 }]),
        ],
      })
    )) as number;

    const d = await selectWorkoutShareData(id);
    expect(d).not.toBeNull();
    expect(d!.workoutName).toBe('Peito Forte');
    expect(d!.dateLabel).toBe('12 AGO 2026');
    expect(d!.username).toBe('Ana');
    expect(d!.photoId).toBe(42);
    expect(d!.hasLoad).toBe(true);
    expect(d!.averageEffort).toBe(3);
    expect(d!.totals).toEqual({
      exercises: 2,
      sets: 3,
      reps: 30,
      volumeKg: 1180,
      durationMin: 50,
    });
    // Maior carga e volume por exercício.
    expect(d!.exercises[0].weightKg).toBe(55);
    expect(d!.exercises[0].volumeKg).toBe(940);
    expectClean(d);
  });

  it('treino sem carga: nunca mostra "0 kg" — volume/weights viram null', async () => {
    const id = (await db.workouts.add(
      makeWorkout({
        name: 'Só reps',
        totalVolume: 0,
        exercises: [ex('Flexão', [{ weight: null, reps: 20 }])],
      })
    )) as number;

    const d = await selectWorkoutShareData(id);
    expect(d!.hasLoad).toBe(false);
    expect(d!.totals.volumeKg).toBeNull();
    expect(d!.exercises[0].weightKg).toBeNull();
    expect(d!.exercises[0].volumeKg).toBeNull();
    // Pode existir recorde de reps, mas NUNCA um recorde de carga (0 kg).
    expect(d!.record?.unit).not.toBe('kg');
    expectClean(d);
  });

  it('lista até 5 exercícios e conta o restante em moreExercises', async () => {
    const names = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const id = (await db.workouts.add(
      makeWorkout({
        name: 'Full body',
        exercises: names.map((n) => ex(n, [{ weight: 10, reps: 10 }])),
      })
    )) as number;

    const d = await selectWorkoutShareData(id);
    expect(d!.exercises).toHaveLength(5);
    expect(d!.exercises.map((e) => e.name)).toEqual(['A', 'B', 'C', 'D', 'E']);
    expect(d!.moreExercises).toBe(2);
    expect(d!.totals.exercises).toBe(7);
  });

  it('detecta recorde de verdade com valor anterior e delta', async () => {
    // Treino antigo: Supino 50 kg. Novo: Supino 60 kg (mesmo volume de treino
    // para não poluir com o recorde de "maior volume em um treino").
    await db.workouts.add(
      makeWorkout({
        date: '2026-07-01',
        totalVolume: 200,
        exercises: [ex('Supino Reto', [{ weight: 50, reps: 8 }])],
      })
    );
    const newId = (await db.workouts.add(
      makeWorkout({
        date: '2026-08-01',
        totalVolume: 200,
        exercises: [ex('Supino Reto', [{ weight: 60, reps: 8 }])],
      })
    )) as number;

    const d = await selectWorkoutShareData(newId);
    expect(d!.record).not.toBeNull();
    expect(d!.record!.sublabel).toBe('Supino Reto');
    expect(d!.record!.value).toBeGreaterThan(0);
    expect(d!.record!.prevValue).toBeGreaterThan(0);
    expect(d!.record!.delta).toBeGreaterThan(0);
    expectClean(d);
  });

  it('sem melhora de recorde → record fica null', async () => {
    await db.workouts.add(
      makeWorkout({
        date: '2026-07-01',
        totalVolume: 480,
        exercises: [ex('Supino Reto', [{ weight: 60, reps: 8 }])],
      })
    );
    const newId = (await db.workouts.add(
      makeWorkout({
        date: '2026-08-01',
        totalVolume: 400,
        exercises: [ex('Supino Reto', [{ weight: 55, reps: 8 }])],
      })
    )) as number;

    const d = await selectWorkoutShareData(newId);
    expect(d!.record).toBeNull();
  });

  it('evolução: monta os 3 últimos registros do exercício com delta %', async () => {
    const dates = ['2026-06-01', '2026-07-01', '2026-08-01'];
    const weights = [60, 65, 70];
    for (let i = 0; i < dates.length; i++) {
      await db.workouts.add(
        makeWorkout({
          date: dates[i],
          totalVolume: weights[i],
          exercises: [ex('Agachamento Livre', [{ weight: weights[i], reps: 8 }])],
        })
      );
    }
    const all = await db.workouts.toArray();
    const targetId = all[all.length - 1].id as number;

    const d = await selectWorkoutShareData(targetId);
    expect(d!.evolution).not.toBeNull();
    expect(d!.evolution!.exercise).toBe('Agachamento Livre');
    expect(d!.evolution!.points).toHaveLength(3);
    expect(d!.evolution!.points[0].weightKg).toBe(60);
    expect(d!.evolution!.points[2].weightKg).toBe(70);
    expect(d!.evolution!.deltaPercent).toBe(16.7);
    expect(d!.evolution!.deltaReps).toBeNull();
  });

  it('evolução: sem histórico suficiente → null (estado vazio elegante)', async () => {
    const id = (await db.workouts.add(
      makeWorkout({
        date: '2026-08-01',
        exercises: [ex('Rosca Martelo', [{ weight: 12, reps: 10 }])],
      })
    )) as number;

    const d = await selectWorkoutShareData(id);
    expect(d!.evolution).toBeNull();
  });

  it('repassa o photoId da foto salva do treino', async () => {
    const withPhoto = (await db.workouts.add(makeWorkout({ photoId: '7' }))) as number;
    const withoutPhoto = (await db.workouts.add(makeWorkout({ photoId: null }))) as number;

    expect((await selectWorkoutShareData(withPhoto))!.photoId).toBe(7);
    expect((await selectWorkoutShareData(withoutPhoto))!.photoId).toBeNull();
  });

  it('repassa a modalidade salva do treino (academia/calistenia)', async () => {
    const acad = (await db.workouts.add(makeWorkout({ mode: 'academia' }))) as number;
    const cali = (await db.workouts.add(makeWorkout({ mode: 'calistenia' }))) as number;
    const none = (await db.workouts.add(makeWorkout({}))) as number;

    expect((await selectWorkoutShareData(acad))!.mode).toBe('academia');
    expect((await selectWorkoutShareData(cali))!.mode).toBe('calistenia');
    expect((await selectWorkoutShareData(none))!.mode).toBeNull();
  });

  it('treino inexistente → null', async () => {
    expect(await selectWorkoutShareData(999_999)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// formatShareStats
// ---------------------------------------------------------------------------

describe('formatShareStats (formatação segura do card)', () => {
  it('fmtInt/fmtNum nunca viram NaN/undefined', () => {
    for (const v of [null, undefined, NaN, Infinity, -Infinity]) {
      expect(fmtInt(v)).toBe('—');
      expect(fmtNum(v)).toBe('—');
      expect(fmtBig(v)).toBe('—');
      expect(digitCount(v)).toBe(0);
    }
    expect(fmtInt(1234)).toBe('1.234');
    expect(fmtNum(60.5)).toBe('60,5');
    expect(fmtNum(60)).toBe('60');
  });

  it('fmtBig usa notação compacta para números grandes', () => {
    expect(fmtBig(6_000)).toBe('6.000');
    expect(fmtBig(1_200_000)).toBe('1,2 mi');
  });

  it('safe nunca devolve "undefined"/"null"', () => {
    expect(safe(null)).toBe('');
    expect(safe(undefined)).toBe('');
    expect(safe('undefined')).toBe('');
    expect(safe('null')).toBe('');
    expect(safe('Treino C')).toBe('Treino C');
  });

  it('datas: rótulo longo e curto em português', () => {
    expect(dateLabel('2026-08-12')).toBe('12 AGO 2026');
    expect(dateLabelShort('2026-08-12')).toBe('12 AGO');
  });

  it('slugify remove acentos e gera nome de arquivo seguro', () => {
    expect(slugify('Treino de Peito + Tríceps')).toBe('treino-de-peito-triceps');
    expect(slugify('   ')).toBe('treino');
    // O nome do arquivo já vem prefixado com "treino-" (igual ao app real).
    expect(shareFileName('Treino Peito', '2026-08-12')).toBe('treino-treino-peito-12-08-2026.png');
    // Sem nome, o slug cai no fallback 'treino' → prefixo + fallback.
    expect(shareFileName('', '2026-08-12')).toBe('treino-treino-12-08-2026.png');
  });

  it('monograma: primeira letra maiúscula, "R" como fallback', () => {
    expect(monogram('ana')).toBe('A');
    expect(monogram('')).toBe('R');
    expect(monogram(null as unknown as string)).toBe('R');
  });
});
