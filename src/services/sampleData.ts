import { addDays, subWeeks } from 'date-fns';
import { db } from '../db/db';
import type { Workout, WorkoutExercise } from '../types';
import { toDateString } from '../utils/date';
import { uid } from '../utils/misc';
import { saveWorkout } from './workoutService';

interface SamplePlan {
  name: string;
  type: string;
  /** Onde o treino foi feito — academia ou calistenia. */
  mode: 'academia' | 'calistenia';
  exercises: string[];
}

const PLANS: SamplePlan[] = [
  { name: 'Treino A', type: 'Peito + Tríceps', mode: 'academia', exercises: ['Supino Reto', 'Supino Inclinado', 'Crucifixo', 'Tríceps Corda'] },
  { name: 'Treino B', type: 'Costas + Bíceps', mode: 'academia', exercises: ['Puxada Frontal', 'Remada Curvada', 'Rosca Direta'] },
  { name: 'Treino C', type: 'Pernas', mode: 'academia', exercises: ['Agachamento Livre', 'Leg Press', 'Cadeira Extensora', 'Mesa Flexora'] },
  { name: 'Treino D', type: 'Ombros', mode: 'academia', exercises: ['Desenvolvimento Militar', 'Elevação Lateral'] },
];

const BASE_WEIGHTS: Record<string, number> = {
  'Supino Reto': 40,
  'Supino Inclinado': 30,
  Crucifixo: 12,
  'Tríceps Corda': 20,
  'Puxada Frontal': 45,
  'Remada Curvada': 50,
  'Rosca Direta': 15,
  'Agachamento Livre': 60,
  'Leg Press': 140,
  'Cadeira Extensora': 35,
  'Mesa Flexora': 30,
  'Desenvolvimento Militar': 25,
  'Elevação Lateral': 8,
};

const BASE_REPS: Record<string, number> = {
  'Supino Reto': 8,
  'Supino Inclinado': 10,
  Crucifixo: 12,
  'Tríceps Corda': 12,
  'Puxada Frontal': 10,
  'Remada Curvada': 10,
  'Rosca Direta': 12,
  'Agachamento Livre': 8,
  'Leg Press': 12,
  'Cadeira Extensora': 12,
  'Mesa Flexora': 10,
  'Desenvolvimento Militar': 10,
  'Elevação Lateral': 15,
};

/**
 * Cria um histórico de exemplo claramente identificado como "dados de exemplo".
 * Só deve ser chamado quando o usuário clicar explicitamente no botão.
 */
export async function createSampleData(): Promise<number> {
  const days: Date[] = [];
  const start = subWeeks(new Date(), 9);
  for (let i = 0; i < 63; i++) {
    const d = addDays(start, i);
    const dow = d.getDay();
    if (dow === 1 || dow === 3 || dow === 5) days.push(d); // seg, qua, sex
  }

  let count = 0;
  for (let week = 0; week < 9; week++) {
    for (const day of days.slice(week * 3, week * 3 + 3)) {
      if (day > new Date()) continue;
      const plan = PLANS[(week + count) % PLANS.length];
      const exercises: WorkoutExercise[] = plan.exercises.map((name, ei) => {
        const base = BASE_WEIGHTS[name] ?? 20;
        const progress = week * 1.5 + ei * 0.5;
        const weight = Math.round((base + progress) * 2) / 2;
        const reps = (BASE_REPS[name] ?? 10) + (week % 3 === 0 ? 2 : 0);
        return {
          id: uid(),
          name,
          order: ei,
          effort: 3 + ((week + ei) % 3),
          notes: '',
          sets: [
            { id: uid(), weight, reps },
            { id: uid(), weight, reps: Math.max(6, reps - 2) },
          ],
        };
      });
      const date = toDateString(day);
      const workout: Workout = {
        date,
        weekday: day.getDay(),
        name: plan.name,
        type: plan.type,
        mode: plan.mode,
        exercises,
        notes: 'Treino de exemplo',
        photoId: null,
        durationMin: 55 + (count % 3) * 10,
        restSec: exercises.reduce((a, e) => a + e.sets.length, 0) * 80 + (count % 3) * 20,
        totalVolume: 0,
        avgEffort: null,
        createdAt: 0,
        updatedAt: 0,
      };
      await saveWorkout(workout);
      count++;
    }
  }

  // Medidas corporais semanais de exemplo (peso descendo, braço subindo…).
  const weights = [78, 77.6, 77.2, 76.8, 76.4, 76, 75.6, 75.2, 74.8];
  const arms = [35, 35.2, 35.5, 35.7, 36, 36.1, 36.4, 36.7, 36.9];
  for (let w = 0; w < weights.length; w++) {
    const day = addDays(start, w * 7);
    await db.measurements.add({
      date: toDateString(day),
      createdAt: day.getTime(),
      values: {
        weight: weights[w],
        arm: arms[w],
        waist: 84 - w * 0.4,
        chest: 102 + w * 0.2,
        thigh: 58 + w * 0.1,
        calf: 37.5 + w * 0.05,
      },
    });
  }

  return count;
}
