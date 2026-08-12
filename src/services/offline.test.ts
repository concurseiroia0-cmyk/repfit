/**
 * Testes de MODO OFFLINE.
 *
 * Simula a queda da rede (fetch/XHR quebrados + navigator.onLine = false) e
 * valida que o RepFit continua 100% funcional: treinos, medidas, catálogo,
 * rascunhos e configurações — tudo local (IndexedDB/localStorage), sem
 * nenhuma chamada de rede. Também confere que o service worker pré-carrega
 * o app inteiro para o carregamento funcionar sem internet.
 */
import 'fake-indexeddb/auto';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../db/db';
import { seedCatalogIfEmpty } from '../db/seed';
import type { Workout } from '../types';
import { clearDraft, loadDraft, saveDraft } from './draftService';
import { deleteMeasurement, measurementsLive, saveMeasurement } from './measurementService';
import { deleteWorkout, getWorkout, saveWorkout, workoutsLive } from './workoutService';

// ---------------------------------------------------------------------------
// Ajudantes
// ---------------------------------------------------------------------------

function makeWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
    date: '2026-08-12',
    weekday: 3,
    name: 'Treino offline',
    type: 'Peito + Tríceps',
    notes: 'Teste sem rede',
    exercises: [
      {
        id: 'ex-1',
        name: 'Supino Reto',
        order: 0,
        effort: 3,
        notes: '',
        sets: [
          { id: 'set-1', weight: 50, reps: 10 },
          { id: 'set-2', weight: 55, reps: 8 },
        ],
      },
    ],
    photoId: null,
    durationMin: 45,
    restSec: 90,
    totalVolume: 0,
    avgEffort: null,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

function makeStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => void map.clear(),
  };
}

function networkCalls(): number {
  const f = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
  const x = globalThis.XMLHttpRequest as unknown as ReturnType<typeof vi.fn>;
  return (f?.mock?.calls?.length ?? 0) + (x?.mock?.calls?.length ?? 0);
}

// ---------------------------------------------------------------------------
// Modo offline
// ---------------------------------------------------------------------------

describe('Modo offline (rede caída)', () => {
  beforeAll(() => {
    // 1. "Rede caída": fetch e XHR sempre falham.
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch (offline simulada)')));
    vi.stubGlobal('XMLHttpRequest', vi.fn(() => {
      throw new Error('NetworkError: offline simulada');
    }));
    // 2. Navegador sem conexão.
    vi.stubGlobal('navigator', { onLine: false });
    // 3. localStorage disponível (como num navegador).
    vi.stubGlobal('localStorage', makeStorage());
  });

  afterAll(async () => {
    vi.unstubAllGlobals();
    await db.close();
  });

  beforeEach(async () => {
    await Promise.all([
      db.workouts.clear(),
      db.exerciseCatalog.clear(),
      db.photos.clear(),
      db.measurements.clear(),
      db.settings.clear(),
    ]);
    clearDraft();
  });

  it('salva e recupera um treino sem NENHUMA chamada de rede', async () => {
    const { workout } = await saveWorkout(makeWorkout());
    expect(workout.id).toBeDefined();

    const got = await getWorkout(workout.id as number);
    expect(got?.name).toBe('Treino offline');
    // Volume e esforço médio calculados localmente: (50×10 + 55×8) = 940 kg.
    expect(got?.totalVolume).toBe(940);
    expect(got?.avgEffort).toBe(3);
    expect(got?.restSec).toBe(90);

    const all = await workoutsLive();
    expect(all).toHaveLength(1);
    expect(networkCalls()).toBe(0);
  });

  it('atualiza o catálogo de exercícios offline (para o autocomplete)', async () => {
    await saveWorkout(makeWorkout());
    const item = await db.exerciseCatalog.where('name').equals('Supino Reto').first();
    expect(item?.timesUsed).toBe(1);
    expect(item?.lastWeight).toBe(55); // maior carga da série
    expect(item?.lastReps).toBe(10); // maior reps da série
    expect(networkCalls()).toBe(0);
  });

  it('edita um treino existente offline', async () => {
    const { workout } = await saveWorkout(makeWorkout());
    const { workout: updated } = await saveWorkout(
      makeWorkout({ id: workout.id, name: 'Treino offline editado', exercises: [] })
    );
    const got = await getWorkout(updated.id as number);
    expect(got?.name).toBe('Treino offline editado');
    expect((await workoutsLive())[0].name).toBe('Treino offline editado');
    expect(networkCalls()).toBe(0);
  });

  it('exclui treino (e fotos órfãs) offline', async () => {
    const { workout } = await saveWorkout(makeWorkout());
    await db.photos.add({ workoutId: String(workout.id), blob: new Blob(['x']), width: 1, height: 1, createdAt: Date.now() });
    await deleteWorkout(workout.id as number);

    expect(await getWorkout(workout.id as number)).toBeUndefined();
    expect(await db.photos.where('workoutId').equals(String(workout.id)).count()).toBe(0);
    expect(await workoutsLive()).toHaveLength(0);
    expect(networkCalls()).toBe(0);
  });

  it('medidas: salvar, listar, atualizar e excluir offline', async () => {
    await saveMeasurement('2026-08-10', { weight: 78, arm: 35 });
    await saveMeasurement('2026-08-12', { weight: 77.5, arm: 35.5, waist: 82 });

    let all = await measurementsLive();
    expect(all).toHaveLength(2);
    expect(all[0].values.weight).toBe(77.5); // mais recente primeiro

    // Atualiza a medição do dia 12 (substitui os valores).
    await saveMeasurement('2026-08-12', { weight: 76, arm: 36, waist: 81 });
    all = await measurementsLive();
    expect(all).toHaveLength(2);
    expect(all[0].values.weight).toBe(76);
    expect(all[0].values.arm).toBe(36);

    await deleteMeasurement(all[1].id as number);
    expect(await measurementsLive()).toHaveLength(1);
    expect(networkCalls()).toBe(0);
  });

  it('rascunho automático salva e restaura offline', async () => {
    const form = {
      date: '2026-08-12',
      name: 'Rascunho sem rede',
      type: 'Pernas',
      notes: '',
      durationMin: '',
      restSec: 0,
      exercises: [{ id: 'e', name: 'Agachamento Livre', sets: [{ id: 's', weight: '60', reps: '12' }], effort: 4, notes: '' }],
    };
    saveDraft(form, null);

    const draft = loadDraft();
    expect(draft?.form.name).toBe('Rascunho sem rede');
    expect(draft?.form.exercises[0].sets[0].weight).toBe('60');

    clearDraft();
    expect(loadDraft()).toBeNull();
    expect(networkCalls()).toBe(0);
  });

  it('o catálogo padrão é semeado offline (autocomplete funciona sem internet)', async () => {
    await seedCatalogIfEmpty();
    const count = await db.exerciseCatalog.count();
    expect(count).toBeGreaterThan(20);
    expect(networkCalls()).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Service worker: app shell pré-carregado
// ---------------------------------------------------------------------------

describe('Service worker: app inteiro pré-carregado para offline', () => {
  const swPath = resolve(__dirname, '../../dist/sw.js');
  const hasBuild = existsSync(swPath);

  it.skipIf(!hasBuild)('o bundle de produção lista index.html, 404.html, assets, ícones e manifest no precache', () => {
    const sw = readFileSync(swPath, 'utf-8');

    // App shell (roteia todas as navegações offline).
    expect(sw).toContain('"index.html"');
    expect(sw).toContain('"404.html"');
    // JavaScript e CSS do app.
    expect(sw).toMatch(/assets\/index-[A-Za-z0-9_-]+\.js/);
    expect(sw).toMatch(/assets\/index-[A-Za-z0-9_-]+\.css/);
    // Ícones e manifest (para o app abrir/instalar offline).
    expect(sw).toContain('icon-192.png');
    expect(sw).toContain('icon-512.png');
    expect(sw).toContain('maskable-512.png');
    expect(sw).toContain('manifest.webmanifest');
    // Rede de segurança (cache-first para qualquer recurso do app).
    expect(sw).toContain('repfit-app');
  });
});
