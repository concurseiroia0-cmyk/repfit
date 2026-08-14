// ============================================================================
// Sincronização IndexedDB ↔ Supabase (arquitetura preparada — não altera o
// fluxo offline atual).
// ----------------------------------------------------------------------------
// Arquitetura:
//   Usuário → App → IndexedDB (Dexie) → [com internet] → Supabase
//
// Regras:
//   * O IndexedDB continua sendo o banco local e ÚNICO que a UI lê — nada aqui
//     é chamado pelos fluxos de salvar atuais (não quebra o offline).
//   * syncAll() é o ponto de entrada: empurra o que ainda não foi sincronizado
//     e baixa o que está na nuvem. Pode ser chamado por um botão "Sincronizar"
//     ou por um efeito quando detectar internet + login.
//   * O mapa local-id → cloud-id fica em IndexedDB (tabela syncMap, v3).
//
// Fase futura: fotos (storage workout-photos) e medidas.
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import { db } from '../../db/db';
import type { Workout, WorkoutExercise, WorkoutFormState } from '../../types';
import type {
  Database,
  WorkoutExerciseRow,
  WorkoutRow,
  WorkoutSetRow,
} from '../../types/supabase';
import { parseLocalDate } from '../../utils/date';
import { computeAvgEffort, computeVolume } from '../../utils/calc';
import { getSupabase, getCurrentUser } from './client';

type Sb = SupabaseClient<Database>;

// ---------------------------------------------------------------------------
// Mapeamento puro (testável): treino local → payload da nuvem
// ---------------------------------------------------------------------------

export interface CloudSetPayload {
  set_number: number;
  repetitions: number | null;
  weight: number | null;
  weight_unit: 'kg';
  duration_seconds: number | null;
  distance: number | null;
  rest_seconds: number | null;
  effort_level: number | null;
  completed: boolean;
  notes: string | null;
}

export interface CloudExercisePayload {
  exercise_name: string;
  order_index: number;
  notes: string | null;
  effort_level: number | null;
  sets: CloudSetPayload[];
}

export interface CloudWorkoutPayload {
  workout: {
    name: string;
    type: string | null;
    workout_date: string;
    duration_seconds: number | null;
    notes: string | null;
    effort_level: number | null;
    mode: 'academia' | 'calistenia' | null;
  };
  exercises: CloudExercisePayload[];
}

/** Converte um treino local (Workout) no payload do banco na nuvem. */
export function toCloudWorkout(local: Workout): CloudWorkoutPayload {
  return {
    workout: {
      name: local.name,
      type: local.type || null,
      workout_date: local.date,
      duration_seconds: local.durationMin != null ? Math.round(local.durationMin * 60) : null,
      notes: local.notes || null,
      effort_level: local.avgEffort,
      mode: local.mode ?? null,
    },
    exercises: local.exercises
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((e) => ({
        exercise_name: e.name,
        order_index: e.order,
        notes: e.notes || null,
        effort_level: e.effort,
        sets: e.sets
          .slice()
          .sort((a, b) => a.id.localeCompare(b.id))
          .map((s, i) => ({
            set_number: i + 1,
            repetitions: s.reps,
            weight: s.weight,
            weight_unit: 'kg' as const,
            duration_seconds: null,
            distance: null,
            rest_seconds: null,
            effort_level: null,
            completed: true,
            notes: null,
          })),
      })),
  };
}

// ---------------------------------------------------------------------------
// Push: local → nuvem
// ---------------------------------------------------------------------------

/** Empurra UM treino local para a nuvem. Retorna o cloudId. */
export async function pushWorkout(
  sb: Sb,
  userId: string,
  local: Workout
): Promise<string> {
  const payload = toCloudWorkout(local);

  const { data: workout, error: workoutError } = await sb
    .from('workouts')
    .insert({
      user_id: userId,
      ...payload.workout,
    })
    .select('id')
    .single();
  if (workoutError || !workout) {
    throw new Error(`Falha ao enviar treino "${local.name}": ${workoutError?.message ?? 'sem resposta'}`);
  }
  const workoutId = workout.id;

  for (const ex of payload.exercises) {
    // Upsert do catálogo de exercícios (busca por nome, cria se não existir).
    const { data: found } = await sb
      .from('exercises')
      .select('id')
      .ilike('name', ex.exercise_name)
      .limit(1)
      .maybeSingle();
    let exerciseId: string | null;
    if (found) {
      exerciseId = found.id;
    } else {
      const { data: created, error: createError } = await sb
        .from('exercises')
        .insert({ name: ex.exercise_name, created_by: userId })
        .select('id')
        .single();
      if (createError || !created) {
        throw new Error(`Falha ao criar exercício "${ex.exercise_name}": ${createError?.message ?? ''}`);
      }
      exerciseId = created.id;
    }

    const { data: we, error: weError } = await sb
      .from('workout_exercises')
      .insert({
        workout_id: workoutId,
        exercise_id: exerciseId,
        exercise_name: ex.exercise_name,
        order_index: ex.order_index,
        notes: ex.notes,
        effort_level: ex.effort_level,
      })
      .select('id')
      .single();
    if (weError || !we) {
      throw new Error(`Falha ao salvar exercício "${ex.exercise_name}" no treino: ${weError?.message ?? ''}`);
    }

    if (ex.sets.length > 0) {
      const { error: setsError } = await sb
        .from('workout_sets')
        .insert(ex.sets.map((s) => ({ workout_exercise_id: we.id, ...s })));
      if (setsError) {
        throw new Error(`Falha ao salvar séries de "${ex.exercise_name}": ${setsError.message}`);
      }
    }
  }

  // Registra o mapa local → nuvem (evita reenviar na próxima sync).
  if (local.id != null) {
    await db.syncMap.put({ key: `workout:${local.id}`, cloudId: workoutId, entity: 'workout' });
  }
  return workoutId;
}

// ---------------------------------------------------------------------------
// Pull: nuvem → local
// ---------------------------------------------------------------------------

/** Baixa os treinos da nuvem que ainda não existem localmente. */
export async function pullWorkouts(sb: Sb, userId: string): Promise<number> {
  const { data: cloudWorkouts, error: wError } = await sb
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .order('workout_date', { ascending: false });
  if (wError) throw new Error(`Falha ao baixar treinos: ${wError.message}`);
  if (!cloudWorkouts || cloudWorkouts.length === 0) return 0;

  const mapped = await db.syncMap.where('entity').equals('workout').toArray();
  const knownCloudIds = new Set(mapped.map((m) => m.cloudId));
  const pending = cloudWorkouts.filter((w) => !knownCloudIds.has(w.id));
  if (pending.length === 0) return 0;

  const pendingIds = pending.map((w) => w.id);

  const { data: cloudExercises, error: weError } = await sb
    .from('workout_exercises')
    .select('*')
    .in('workout_id', pendingIds)
    .order('order_index', { ascending: true });
  if (weError) throw new Error(`Falha ao baixar exercícios: ${weError.message}`);

  const weIds = (cloudExercises ?? []).map((e) => e.id);
  let cloudSets: WorkoutSetRow[] = [];
  if (weIds.length > 0) {
    const { data: sets, error: sError } = await sb
      .from('workout_sets')
      .select('*')
      .in('workout_exercise_id', weIds)
      .order('set_number', { ascending: true });
    if (sError) throw new Error(`Falha ao baixar séries: ${sError.message}`);
    cloudSets = sets ?? [];
  }

  const exercisesByWorkout = new Map<string, WorkoutExerciseRow[]>();
  for (const e of cloudExercises ?? []) {
    const list = exercisesByWorkout.get(e.workout_id) ?? [];
    list.push(e);
    exercisesByWorkout.set(e.workout_id, list);
  }
  const setsByExercise = new Map<string, WorkoutSetRow[]>();
  for (const s of cloudSets) {
    const list = setsByExercise.get(s.workout_exercise_id) ?? [];
    list.push(s);
    setsByExercise.set(s.workout_exercise_id, list);
  }

  let imported = 0;
  await db.transaction('rw', db.workouts, db.syncMap, async () => {
    for (const cloud of pending) {
      const exercises: WorkoutExercise[] = (exercisesByWorkout.get(cloud.id) ?? []).map((we) => {
        const sets = (setsByExercise.get(we.id) ?? []).map((s) => ({
          id: `set-${s.id}`,
          weight: s.weight != null ? Number(s.weight) : null,
          reps: s.repetitions,
        }));
        return {
          id: `ex-${we.id}`,
          name: we.exercise_name,
          sets,
          effort: we.effort_level,
          notes: we.notes ?? '',
          order: we.order_index,
        };
      });

      const local: Workout = {
        date: cloud.workout_date,
        weekday: parseLocalDate(cloud.workout_date).getDay(),
        name: cloud.name,
        type: cloud.type ?? '',
        mode: cloud.mode === 'calistenia' ? 'calistenia' : cloud.mode === 'academia' ? 'academia' : undefined,
        notes: cloud.notes ?? '',
        exercises,
        photoId: null, // fotos: fase futura (storage workout-photos)
        durationMin: cloud.duration_seconds != null ? cloud.duration_seconds / 60 : null,
        restSec: null,
        totalVolume: computeVolume(exercises),
        avgEffort: computeAvgEffort(exercises),
        createdAt: new Date(cloud.created_at).getTime(),
        updatedAt: new Date(cloud.updated_at).getTime(),
      };

      const localId = await db.workouts.add(local);
      await db.syncMap.put({ key: `workout:${localId}`, cloudId: cloud.id, entity: 'workout' });
      imported++;
    }
  });

  return imported;
}

// ---------------------------------------------------------------------------
// syncAll: ponto de entrada (push pendentes + pull)
// ---------------------------------------------------------------------------

export type SyncResult =
  | { status: 'ok'; pushed: number; pulled: number }
  | { status: 'skipped'; reason: 'not-configured' | 'signed-out' }
  | { status: 'error'; message: string };

/**
 * Sincroniza tudo: envia treinos locais ainda não enviados e baixa os da
 * nuvem. Nunca lança — retorna um resultado descritivo. Sem Supabase
 * configurado ou sem login, não faz nada (offline intacto).
 */
export async function syncAll(): Promise<SyncResult> {
  const sb = getSupabase();
  if (!sb) return { status: 'skipped', reason: 'not-configured' };
  const user = await getCurrentUser();
  if (!user) return { status: 'skipped', reason: 'signed-out' };

  try {
    const local = await db.workouts.toArray();
    const mapped = await db.syncMap.where('entity').equals('workout').toArray();
    const mappedKeys = new Set(mapped.map((m) => m.key));
    const toPush = local.filter((w) => w.id == null || !mappedKeys.has(`workout:${w.id}`));

    let pushed = 0;
    for (const w of toPush) {
      await pushWorkout(sb, user.id, w);
      pushed++;
    }

    const pulled = await pullWorkouts(sb, user.id);
    return { status: 'ok', pushed, pulled };
  } catch (err) {
    return {
      status: 'error',
      message: err instanceof Error ? err.message : 'Erro desconhecido na sincronização',
    };
  }
}

/** Um rascunho de treino (ainda não salvo) também pode ser enviado. */
export function draftToWorkout(form: WorkoutFormState, now: number): Workout {
  return {
    date: form.date,
    weekday: parseLocalDate(form.date).getDay(),
    name: form.name,
    type: form.type,
    mode: form.mode,
    notes: form.notes,
    exercises: form.exercises
      .filter((e) => e.name.trim())
      .map((e, i) => ({
        id: e.id,
        name: e.name.trim(),
        sets: e.sets
          .filter((s) => s.weight.trim() !== '' || s.reps.trim() !== '')
          .map((s) => ({
            id: s.id,
            weight: s.weight.trim() === '' ? null : Number(s.weight.replace(',', '.')),
            reps: s.reps.trim() === '' ? null : Number(s.reps.replace(',', '.')),
          })),
        effort: e.effort,
        notes: e.notes,
        order: i,
      })),
    photoId: null,
    durationMin: form.durationMin ? Number(form.durationMin) : null,
    restSec: form.restSec > 0 ? form.restSec : null,
    totalVolume: 0,
    avgEffort: null,
    createdAt: now,
    updatedAt: now,
  };
}
