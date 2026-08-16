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
import type {
  BodyMeasurement,
  ExerciseCatalogItem,
  Settings,
  Workout,
  WorkoutExercise,
  WorkoutFormState,
} from '../../types';
import { getSettings, saveSettings } from '../settingsService';
import type {
  BodyMeasurementRow,
  Database,
  WorkoutExerciseRow,
  WorkoutRow,
  WorkoutSetRow,
} from '../../types/supabase';
import { parseLocalDate } from '../../utils/date';
import { computeAvgEffort, computeVolume, parseNum } from '../../utils/calc';
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
    mode: 'academia' | 'calistenia' | 'cardio' | null;
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
      .map((e) => {
        // Cardio: uma única série com duração/distância (sem peso/reps).
        const isCardio = local.mode === 'cardio' && e.timeMin != null;
        const sets = isCardio
          ? [
              {
                set_number: 1,
                repetitions: null,
                weight: null,
                weight_unit: 'kg' as const,
                duration_seconds: Math.round(e.timeMin! * 60),
                distance: e.distanceKm ?? null,
                rest_seconds: null,
                effort_level: null,
                completed: true,
                notes: null,
              },
            ]
          : e.sets
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
              }));
        return {
          exercise_name: e.name,
          order_index: e.order,
          notes: e.notes || null,
          effort_level: e.effort,
          sets,
        };
      }),
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
// Medidas corporais: local → nuvem
// ---------------------------------------------------------------------------

/**
 * Converte uma medição local no payload do banco (espelha o tipo do app).
 * O mapa COMPLETO de valores vai em `notes` (JSON) para preservar medidas
 * personalizadas; as colunas padrão (peso, braço…) ficam preenchidas para
 * compatibilidade com outras ferramentas/consultas.
 */
export function toCloudMeasurement(local: BodyMeasurement): {
  measured_at: string;
  weight: number | null;
  body_fat_percentage: number | null;
  chest: number | null;
  waist: number | null;
  arm: number | null;
  thigh: number | null;
  calf: number | null;
  notes: string | null;
} {
  const v = local.values ?? {};
  return {
    measured_at: local.date, // YYYY-MM-DD (Postgres converte para timestamptz)
    weight: v.weight ?? null,
    body_fat_percentage: v.bodyFat ?? null,
    chest: v.chest ?? null,
    waist: v.waist ?? null,
    arm: v.arm ?? null,
    thigh: v.thigh ?? null,
    calf: v.calf ?? null,
    notes: JSON.stringify(v),
  };
}

/** Reconstitui o mapa de valores a partir de uma linha da nuvem. */
export function measurementFromCloud(cloud: BodyMeasurementRow): Record<string, number | null> {
  // O JSON completo (inclui medidas personalizadas) tem prioridade.
  try {
    const parsed = JSON.parse(cloud.notes ?? '') as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, number | null>;
    }
  } catch {
    // notes não é JSON → usa as colunas padrão abaixo
  }
  return {
    weight: cloud.weight ?? null,
    bodyFat: cloud.body_fat_percentage ?? null,
    chest: cloud.chest ?? null,
    waist: cloud.waist ?? null,
    arm: cloud.arm ?? null,
    thigh: cloud.thigh ?? null,
    calf: cloud.calf ?? null,
  };
}

/** Empurra UMA medição local para a nuvem. Retorna o cloudId. */
export async function pushMeasurement(sb: Sb, userId: string, local: BodyMeasurement): Promise<string> {
  const { data, error } = await sb
    .from('body_measurements')
    .insert({ user_id: userId, ...toCloudMeasurement(local) })
    .select('id')
    .single();
  if (error || !data) {
    throw new Error(`Falha ao enviar medição de ${local.date}: ${error?.message ?? 'sem resposta'}`);
  }
  if (local.id != null) {
    await db.syncMap.put({ key: `measurement:${local.id}`, cloudId: data.id, entity: 'measurement' });
  }
  return data.id;
}

/** Baixa as medições da nuvem que ainda não existem localmente. */
export async function pullMeasurements(sb: Sb, userId: string): Promise<number> {
  const { data: cloud, error } = await sb
    .from('body_measurements')
    .select('*')
    .eq('user_id', userId)
    .order('measured_at', { ascending: false });
  if (error) throw new Error(`Falha ao baixar medidas: ${error.message}`);
  if (!cloud || cloud.length === 0) return 0;

  const mapped = await db.syncMap.where('entity').equals('measurement').toArray();
  const knownCloudIds = new Set(mapped.map((m) => m.cloudId));
  const pending = cloud.filter((m) => !knownCloudIds.has(m.id));
  if (pending.length === 0) return 0;

  let imported = 0;
  await db.transaction('rw', db.measurements, db.syncMap, async () => {
    for (const m of pending) {
      // Evita duplicar no mesmo dia (a nuvem pode ter mais de uma por dia).
      const sameDay = await db.measurements.where('date').equals(m.measured_at.slice(0, 10)).first();
      if (sameDay) continue;
      const localId = await db.measurements.add({
        date: m.measured_at.slice(0, 10),
        createdAt: new Date(m.created_at).getTime(),
        values: measurementFromCloud(m),
      });
      await db.syncMap.put({ key: `measurement:${localId}`, cloudId: m.id, entity: 'measurement' });
      imported++;
    }
  });
  return imported;
}

// ---------------------------------------------------------------------------
// Catálogo de exercícios personalizados + perfil (nome/foto)
// ---------------------------------------------------------------------------

/** Item criado pelo usuário = sem `mode` (o seed sempre define a modalidade). */
export function isCustomCatalogItem(item: ExerciseCatalogItem): boolean {
  return item.mode == null;
}

/** Payload de perfil para a nuvem (só campos preenchidos localmente). */
export function toCloudProfileUpdate(settings: Settings): { full_name?: string; avatar_url?: string } {
  const update: { full_name?: string; avatar_url?: string } = {};
  const name = (settings.username ?? '').trim();
  if (name) update.full_name = name;
  if (settings.avatarDataUrl) update.avatar_url = settings.avatarDataUrl;
  return update;
}

/** O que preencher no LOCAL a partir da nuvem (só quando o local está vazio). */
export function profilePullPatch(
  settings: Settings,
  profile: { full_name: string | null; avatar_url: string | null }
): Partial<Settings> {
  const patch: Partial<Settings> = {};
  if (!(settings.username ?? '').trim() && profile.full_name) patch.username = profile.full_name;
  if (!settings.avatarDataUrl && profile.avatar_url && profile.avatar_url.startsWith('data:image/')) {
    patch.avatarDataUrl = profile.avatar_url;
  }
  return patch;
}

/**
 * Sincroniza o catálogo personalizado: empurra os exercícios CRIADOS pelo
 * usuário (sem `mode`) e baixa os exercícios personalizados da nuvem que
 * ainda não existem localmente (dedup por nome, sem duplicar o seed padrão).
 */
export async function syncCatalog(sb: Sb, userId: string): Promise<{ pushed: number; pulled: number }> {
  const local = await db.exerciseCatalog.toArray();
  const mapped = await db.syncMap.where('entity').equals('exercise').toArray();
  const mappedKeys = new Set(mapped.map((m) => m.key));

  // Push: exercícios criados pelo usuário ainda não enviados.
  const toPush = local.filter(
    (c) => isCustomCatalogItem(c) && (c.id == null || !mappedKeys.has(`exercise:${c.id}`))
  );
  let pushed = 0;
  for (const item of toPush) {
    // Não duplica: usa o exercício existente com o mesmo nome (global ou do usuário).
    const { data: found } = await sb
      .from('exercises')
      .select('id')
      .ilike('name', item.name)
      .limit(1)
      .maybeSingle();
    let cloudId: string;
    if (found) {
      cloudId = found.id;
    } else {
      const { data: created, error } = await sb
        .from('exercises')
        .insert({ name: item.name, muscle_group: item.muscleGroup || 'Outros', created_by: userId })
        .select('id')
        .single();
      if (error || !created) {
        throw new Error(`Falha ao enviar exercício "${item.name}": ${error?.message ?? 'sem resposta'}`);
      }
      cloudId = created.id;
    }
    if (item.id != null) {
      await db.syncMap.put({ key: `exercise:${item.id}`, cloudId, entity: 'exercise' });
    }
    pushed++;
  }

  // Pull: exercícios personalizados do usuário que ainda não existem localmente.
  const { data: cloud, error } = await sb.from('exercises').select('*').eq('created_by', userId);
  if (error) throw new Error(`Falha ao baixar exercícios: ${error.message}`);
  const localNames = new Set(local.map((c) => c.name.trim().toLowerCase()));
  let pulled = 0;
  for (const ex of cloud ?? []) {
    if (localNames.has(ex.name.trim().toLowerCase())) continue;
    const localId = await db.exerciseCatalog.add({
      name: ex.name,
      muscleGroup: ex.muscle_group ?? 'Outros',
      favorite: false,
      lastWeight: null,
      lastReps: null,
      timesUsed: 0,
    });
    await db.syncMap.put({ key: `exercise:${localId}`, cloudId: ex.id, entity: 'exercise' });
    localNames.add(ex.name.trim().toLowerCase());
    pulled++;
  }
  return { pushed, pulled };
}

/**
 * Sincroniza o perfil (nome e foto): envia o nome/avatar local para a nuvem e
 * preenche o local apenas se estiver vazio (o que foi definido em um aparelho
 * aparece no outro; nunca sobrescreve o que o usuário já preencheu aqui).
 */
export async function syncProfile(sb: Sb, userId: string): Promise<void> {
  const settings = await getSettings();
  const update = toCloudProfileUpdate(settings);
  if (Object.keys(update).length > 0) {
    const { error } = await sb.from('profiles').upsert({ id: userId, ...update }, { onConflict: 'id' });
    if (error) throw new Error(`Falha ao salvar perfil: ${error.message}`);
  }

  const { data: profile, error: pError } = await sb
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', userId)
    .maybeSingle();
  if (pError) throw new Error(`Falha ao ler perfil: ${pError.message}`);
  if (profile) {
    const patch = profilePullPatch(settings, profile);
    if (Object.keys(patch).length > 0) await saveSettings(patch);
  }
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
        const rawSets = setsByExercise.get(we.id) ?? [];
        // Cardio na nuvem: série única com duração/distância → tempo/distância.
        const cardioSet = rawSets.find((s) => (s.duration_seconds ?? 0) > 0);
        const timeMin = cardioSet && cardioSet.duration_seconds != null ? cardioSet.duration_seconds / 60 : null;
        const sets = rawSets.map((s) => ({
          id: `set-${s.id}`,
          weight: s.weight != null ? Number(s.weight) : null,
          reps: s.repetitions,
        }));
        return {
          id: `ex-${we.id}`,
          name: we.exercise_name,
          sets: timeMin != null && sets.length === 0 ? [] : sets,
          effort: we.effort_level,
          notes: we.notes ?? '',
          order: we.order_index,
          timeMin,
          distanceKm: timeMin != null ? (cardioSet?.distance ?? null) : null,
        };
      });

      const local: Workout = {
        date: cloud.workout_date,
        weekday: parseLocalDate(cloud.workout_date).getDay(),
        name: cloud.name,
        type: cloud.type ?? '',
        mode: cloud.mode === 'calistenia' ? 'calistenia' : cloud.mode === 'cardio' ? 'cardio' : cloud.mode === 'academia' ? 'academia' : undefined,
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
  | {
      status: 'ok';
      pushed: number;
      pulled: number;
      measurementsPushed: number;
      measurementsPulled: number;
      catalogPushed: number;
      catalogPulled: number;
    }
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

    // Medidas corporais: empurra as locais ainda não enviadas e baixa as da nuvem.
    const localMeasurements = await db.measurements.toArray();
    const mappedM = await db.syncMap.where('entity').equals('measurement').toArray();
    const mappedMKeys = new Set(mappedM.map((m) => m.key));
    const toPushM = localMeasurements.filter((m) => m.id == null || !mappedMKeys.has(`measurement:${m.id}`));

    let measurementsPushed = 0;
    for (const m of toPushM) {
      await pushMeasurement(sb, user.id, m);
      measurementsPushed++;
    }
    const measurementsPulled = await pullMeasurements(sb, user.id);

    // Catálogo personalizado + perfil (nome/foto) — dados seguem a conta.
    const catalog = await syncCatalog(sb, user.id);
    await syncProfile(sb, user.id);

    return {
      status: 'ok',
      pushed,
      pulled,
      measurementsPushed,
      measurementsPulled,
      catalogPushed: catalog.pushed,
      catalogPulled: catalog.pulled,
    };
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
        timeMin: form.mode === 'cardio' ? parseNum(e.timeMin ?? '') : null,
        distanceKm: form.mode === 'cardio' ? parseNum(e.distanceKm ?? '') : null,
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
