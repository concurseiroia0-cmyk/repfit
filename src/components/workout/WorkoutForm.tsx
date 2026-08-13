import { useMemo } from 'react';
import { Flame, Plus, Star, Zap } from 'lucide-react';
import type { ExerciseCatalogItem, Unit, WorkoutExercise, WorkoutFormState } from '../../types';
import { WORKOUT_TYPES } from '../../utils/constants';
import { formatDayShort, formatDate, todayString, weekdayName } from '../../utils/date';
import { ACTIVE_PILL, cn, uid } from '../../utils/misc';
import { scheduleKeepInputVisible } from '../../utils/mobileInput';
import { Button } from '../ui/Button';
import { Card, CardHeader } from '../ui/Card';
import { Field, Input, Textarea } from '../ui/Field';
import { ExerciseCard, exerciseFitsMode } from './ExerciseCard';
import { RestQuestion } from './RestQuestion';

/** Modalidades disponíveis para filtrar as sugestões de exercícios. */
const MODES = ['academia', 'calistenia'] as const;

export function emptyWorkoutFormState(date = todayString()): WorkoutFormState {
  return {
    date,
    name: '',
    type: '',
    notes: '',
    durationMin: '',
    mode: 'academia',
    restSec: 0,
    exercises: [],
  };
}

export function emptyExercise(): {
  id: string;
  name: string;
  sets: { id: string; weight: string; reps: string }[];
  effort: number | null;
  notes: string;
} {
  return { id: uid(), name: '', sets: [{ id: uid(), weight: '', reps: '' }], effort: null, notes: '' };
}

interface WorkoutFormProps {
  form: WorkoutFormState;
  onChange: (next: WorkoutFormState) => void;
  unit: Unit;
  catalog: ExerciseCatalogItem[];
  /** Exercícios do treino anterior (modo "repetir") para comparação. */
  previous?: WorkoutExercise[] | null;
  submitLabel: string;
  saving: boolean;
  onSubmit: () => void;
  /** Mensagem exibida quando o form foi iniciado de um rascunho. */
  draftBanner?: string | null;
  onDiscardDraft?: () => void;
}

export function WorkoutForm({
  form,
  onChange,
  unit,
  catalog,
  previous,
  submitLabel,
  saving,
  onSubmit,
  draftBanner,
  onDiscardDraft,
}: WorkoutFormProps) {
  const update = (patch: Partial<WorkoutFormState>) => onChange({ ...form, ...patch });

  // Modalidade escolhida (normaliza rascunhos antigos sem o campo).
  const mode = form.mode === 'calistenia' ? 'calistenia' : 'academia';

  const addExercise = (prefill?: { name: string; lastWeight: number | null; lastReps: number | null }) => {
    const ex = emptyExercise();
    if (prefill && (prefill.lastWeight != null || prefill.lastReps != null)) {
      ex.name = prefill.name;
      ex.sets = [
        {
          id: uid(),
          weight: prefill.lastWeight != null ? kgToInput(prefill.lastWeight, unit) : '',
          reps: prefill.lastReps != null ? String(prefill.lastReps) : '',
        },
      ];
    }
    update({ exercises: [...form.exercises, ex] });
  };

  const updateExercise = (id: string, next: (typeof form.exercises)[number]) => {
    update({ exercises: form.exercises.map((e) => (e.id === id ? next : e)) });
  };
  const removeExercise = (id: string) => update({ exercises: form.exercises.filter((e) => e.id !== id) });
  const moveExercise = (id: string, dir: -1 | 1) => {
    const i = form.exercises.findIndex((e) => e.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= form.exercises.length) return;
    const next = [...form.exercises];
    [next[i], next[j]] = [next[j], next[i]];
    update({ exercises: next });
  };

  const quick = useMemo(() => {
    // Sugestões da modalidade escolhida: mais usados primeiro, depois em ordem
    // alfabética — assim quem treina calistenia vê exercícios de calistenia
    // mesmo que nunca os tenha usado antes.
    const seen = new Set<string>();
    const out: ExerciseCatalogItem[] = [];
    const ordered = catalog
      .filter((c) => exerciseFitsMode(c, mode))
      .sort((a, b) => b.timesUsed - a.timesUsed || a.name.localeCompare(b.name, 'pt-BR'));
    for (const c of ordered) {
      if (seen.has(c.name)) continue;
      seen.add(c.name);
      out.push(c);
    }
    return out.slice(0, 8);
  }, [catalog, mode]);

  const setCount = form.exercises.reduce((a, e) => a + e.sets.length, 0);

  return (
    <div className="space-y-4">
      {draftBanner && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300">
          <span>{draftBanner}</span>
          {onDiscardDraft && (
            <button onClick={onDiscardDraft} className="shrink-0 font-semibold underline underline-offset-2">
              Descartar
            </button>
          )}
        </div>
      )}

      {/* Dados gerais */}
      <Card>
        <CardHeader title="Dados do treino" />
        <div className="space-y-4 px-5 pb-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Data">
              <Input type="date" value={form.date} max={todayString()} onChange={(e) => update({ date: e.target.value })} />
            </Field>
            <Field label="Dia da semana" hint={form.date ? formatDate(form.date) : undefined}>
              <div className="flex h-[42px] items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-semibold text-slate-600 dark:border-white/15 dark:bg-slate-800/60 dark:text-slate-300">
                {form.date ? weekdayName(form.date) : '—'}
              </div>
            </Field>
          </div>
          <Field label="Nome do treino">
            <Input
              type="text"
              value={form.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="Ex.: Treino A, Peito e Tríceps"
            />
          </Field>
          <Field label="Tipo de treino">
            <div className="flex flex-wrap gap-1.5">
              {WORKOUT_TYPES.map((t) => {
                const active = form.type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={active}
                    onClick={() => update({ type: active ? '' : t })}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-150',
                      active && ACTIVE_PILL,
                      active && 'border-transparent',
                      !active &&
                        'border-slate-300 text-slate-600 hover:border-amber-400 hover:text-amber-600 dark:border-white/20 dark:text-slate-300 dark:hover:border-amber-400 dark:hover:text-amber-400'
                    )}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Duração (minutos)" hint="Opcional">
              <Input
                type="text"
                inputMode="numeric"
                value={form.durationMin}
                onChange={(e) => update({ durationMin: e.target.value.replace(/[^0-9]/g, '') })}
                onFocus={(e) => scheduleKeepInputVisible(e.currentTarget)}
                style={{ fontSize: 16 }}
                placeholder="Ex.: 60"
              />
            </Field>
            <Field label="Observação geral" hint="Opcional">
              <Input
                type="text"
                value={form.notes}
                onChange={(e) => update({ notes: e.target.value })}
                placeholder="Como foi o treino?"
              />
            </Field>
          </div>
        </div>
      </Card>

      {/* Descanso (opcional) */}
      <Card>
        <CardHeader title="Descanso" subtitle="Opcional — houve descanso entre as séries?" />
        <div className="px-5 pb-5">
          <RestQuestion value={form.restSec} onChange={(sec) => update({ restSec: sec })} />
        </div>
      </Card>

      {/* Exercícios */}
      <Card>
        <CardHeader
          title="Exercícios"
          subtitle={`${form.exercises.length} exercício${form.exercises.length === 1 ? '' : 's'} · ${setCount} série${setCount === 1 ? '' : 's'}`}
          action={
            <Button type="button" variant="secondary" size="sm" onClick={() => addExercise()}>
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          }
        />
        <div className="px-5 pb-5">
          {/* Modalidade: filtra as sugestões (rápidos + autocomplete). */}
          <div className="mb-4">
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Onde você treinou?
            </p>
            <div className="flex flex-wrap gap-1.5">
              {MODES.map((m) => {
                const active = mode === m;
                return (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={active}
                    onClick={() => update({ mode: m })}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-all duration-150',
                      active && ACTIVE_PILL,
                      active && 'border-transparent',
                      !active &&
                        'border-slate-300 text-slate-600 hover:border-amber-400 hover:text-amber-600 dark:border-white/20 dark:text-slate-300 dark:hover:border-amber-400 dark:hover:text-amber-400'
                    )}
                  >
                    {m === 'academia' ? '🏋️ Academia' : '🤸 Calistenia'}
                  </button>
                );
              })}
            </div>
          </div>

          {quick.length > 0 && (
            <div className="mb-4">
              <p className="mb-1.5 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                <Zap className="h-3.5 w-3.5" /> Rápidos
              </p>
              <div className="flex flex-wrap gap-1.5">
                {quick.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => addExercise({ name: c.name, lastWeight: c.lastWeight, lastReps: c.lastReps })}
                    className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-amber-400 hover:text-amber-700 dark:border-white/15 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-amber-400 dark:hover:text-amber-400"
                  >
                    {c.favorite && <Star className="h-3 w-3 text-amber-400" fill="currentColor" />}
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {form.exercises.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-slate-200 py-10 text-center dark:border-white/15">
              <Flame className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Nenhum exercício ainda. Toque em <b>Adicionar</b> ou escolha um dos rápidos acima.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {form.exercises.map((ex, i) => (
                <ExerciseCard
                  key={ex.id}
                  exercise={ex}
                  index={i}
                  total={form.exercises.length}
                  unit={unit}
                  previous={previous?.[i] ?? null}
                  catalog={catalog}
                  mode={mode}
                  onChange={(next) => updateExercise(ex.id, next)}
                  onRemove={() => removeExercise(ex.id)}
                  onMove={(dir) => moveExercise(ex.id, dir)}
                />
              ))}
            </div>
          )}
        </div>
      </Card>

      <Button full size="lg" onClick={onSubmit} disabled={saving}>
        {saving ? 'Salvando…' : submitLabel}
      </Button>
    </div>
  );
}

function kgToInput(kg: number, unit: Unit): string {
  const v = unit === 'lb' ? kg * 2.2046226218 : kg;
  return v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}
