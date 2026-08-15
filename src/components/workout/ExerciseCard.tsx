import { useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import type { ExerciseCatalogItem, ExerciseDraft, SetDraft, Unit, WorkoutExercise } from '../../types';
import { displayToKg, formatWeight, parseNum } from '../../utils/calc';
import { uid } from '../../utils/misc';
import { EffortSelector } from './EffortSelector';
import { StepperInput } from '../ui/StepperInput';
import { Textarea } from '../ui/Field';

/**
 * Exercício do catálogo serve para a modalidade escolhida? Exercícios
 * criados pelo usuário (sem mode) aparecem nas duas modalidades.
 */
export function exerciseFitsMode(c: ExerciseCatalogItem, mode: 'academia' | 'calistenia'): boolean {
  if (!c.mode || c.mode === 'ambos' || c.mode === mode) return true;
  return false;
}

interface ExerciseCardProps {
  exercise: ExerciseDraft;
  index: number;
  total: number;
  unit: Unit;
  /** Exercício correspondente do treino anterior (modo "repetir"). */
  previous?: WorkoutExercise | null;
  catalog: ExerciseCatalogItem[];
  /** Modalidade escolhida no treino (filtra o autocomplete). */
  mode: 'academia' | 'calistenia';
  onChange: (next: ExerciseDraft) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}

export function ExerciseCard({ exercise, index, total, unit, previous, catalog, mode, onChange, onRemove, onMove }: ExerciseCardProps) {
  const [open, setOpen] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const q = exercise.name.trim().toLowerCase();

  const suggestions = useMemo(() => {
    const list = catalog
      .filter((c) => exerciseFitsMode(c, mode))
      .map((c) => ({ name: c.name, lastWeight: c.lastWeight, lastReps: c.lastReps }))
      .filter((c) => (q ? c.name.toLowerCase().includes(q) : true))
      .slice(0, 7);
    return list;
  }, [catalog, q, mode]);

  const exact = catalog.find((c) => c.name.toLowerCase() === q);

  const update = (patch: Partial<ExerciseDraft>) => onChange({ ...exercise, ...patch });

  const updateSet = (setId: string, patch: Partial<SetDraft>) => {
    update({ sets: exercise.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) });
  };
  const addSet = () => update({ sets: [...exercise.sets, { id: uid(), weight: '0', reps: '0' }] });
  const removeSet = (setId: string) => update({ sets: exercise.sets.filter((s) => s.id !== setId) });
  const applyToAll = () => {
    const first = exercise.sets[0];
    update({ sets: exercise.sets.map((s) => ({ ...s, weight: first.weight, reps: first.reps })) });
  };

  function pickSuggestion(name: string, lastWeight: number | null, lastReps: number | null) {
    const empty = exercise.sets.every((s) => !s.weight.trim() && !s.reps.trim());
    const sets = empty
      ? [{ id: uid(), weight: lastWeight != null ? formatWeightRaw(lastWeight, unit) : '0', reps: lastReps != null ? String(lastReps) : '0' }]
      : exercise.sets;
    onChange({ ...exercise, name, sets });
    setOpen(false);
  }

  const weightStep = unit === 'kg' ? 1 : 2.5;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#161616]">
      {/* Cabeçalho: número, nome, ações */}
      <div className="flex items-start gap-2">
        <span className="mt-2.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-xs font-extrabold text-amber-700 dark:bg-amber-400/15 dark:text-amber-400">
          {index + 1}
        </span>
        <div className="relative flex-1">
          <input
            ref={nameRef}
            type="text"
            value={exercise.name}
            onChange={(e) => {
              update({ name: e.target.value });
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Nome do exercício"
            aria-label={`Nome do exercício ${index + 1}`}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 dark:border-white/20 dark:bg-slate-800 dark:text-slate-100"
          />
          {open && suggestions.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-white/15 dark:bg-slate-800">
              {suggestions.map((s) => (
                <li key={s.name}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pickSuggestion(s.name, s.lastWeight, s.lastReps);
                    }}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-amber-50 dark:hover:bg-slate-700"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-100">{s.name}</span>
                    {s.lastWeight != null && (
                      <span className="shrink-0 text-xs text-slate-400">
                        última: {formatWeight(s.lastWeight, unit)} × {s.lastReps ?? '—'}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {exact && exact.lastWeight != null && (
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              Última vez: {formatWeight(exact.lastWeight, unit)} × {exact.lastReps ?? '—'}{' '}
              <button
                type="button"
                onClick={() => pickSuggestion(exact.name, exact.lastWeight, exact.lastReps)}
                className="font-semibold text-amber-600 underline-offset-2 hover:underline dark:text-amber-400"
              >
                usar
              </button>
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          <div className="flex justify-end">
            <button type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label="Mover para cima" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 dark:hover:bg-slate-800">
              <ArrowUp className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} aria-label="Mover para baixo" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 dark:hover:bg-slate-800">
              <ArrowDown className="h-4 w-4" />
            </button>
            <button type="button" onClick={onRemove} aria-label="Remover exercício" className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Referência do treino anterior (modo repetir) */}
      {previous && previous.sets.length > 0 && (
        <p className="mt-2 rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
          Antes: {previous.sets.map((s) => `${formatWeight(s.weight, unit)} × ${s.reps ?? '—'}`).join(' · ')}
        </p>
      )}

      {/* Esforço */}
      <div className="mt-3">
        <EffortSelector value={exercise.effort} onChange={(v) => update({ effort: v })} />
      </div>

      {/* Séries */}
      <div className="mt-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Séries</span>
          <div className="flex gap-1.5">
            {exercise.sets.length > 1 && (
              <button type="button" onClick={applyToAll} className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
                igualar
              </button>
            )}
            <button type="button" onClick={addSet} className="flex items-center gap-0.5 rounded-lg px-2 py-1 text-xs font-semibold text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-400/10">
              <Plus className="h-3.5 w-3.5" /> série
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          {exercise.sets.map((set, si) => {
            const curKg = displayToKg(set.weight, unit);
            const prevSet = previous?.sets?.[si];
            const up = prevSet?.weight != null && curKg != null && curKg > prevSet.weight;
            const down = prevSet?.weight != null && curKg != null && curKg < prevSet.weight;
            return (
              <div key={set.id} className="flex items-center gap-1.5">
                <span className="w-5 shrink-0 text-center text-xs font-bold text-slate-400 dark:text-slate-500">{si + 1}ª</span>
                <StepperInput
                  value={set.weight}
                  onChange={(v) => updateSet(set.id, { weight: v })}
                  step={weightStep}
                  suffix={unit}
                  ariaLabel={`Carga da série ${si + 1}`}
                  className="w-[38%]"
                  inputClassName="pr-9"
                  // decimal → teclado numérico com vírgula/ponto no Chrome Mobile.
                  inputMode="decimal"
                />
                <span className="shrink-0 text-slate-400">×</span>
                <StepperInput
                  value={set.reps}
                  onChange={(v) => updateSet(set.id, { reps: v })}
                  step={1}
                  suffix="reps"
                  ariaLabel={`Repetições da série ${si + 1}`}
                  className="w-[38%]"
                  inputClassName="pr-11"
                  inputMode="numeric"
                />
                {up && <ChevronUp className="h-4 w-4 shrink-0 text-emerald-500" aria-label="Carga subiu" />}
                {down && <ChevronDown className="h-4 w-4 shrink-0 text-rose-500" aria-label="Carga caiu" />}
                {!up && !down && <span className="w-4 shrink-0" />}
                {exercise.sets.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSet(set.id)}
                    aria-label={`Remover série ${si + 1}`}
                    className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Observação */}
      <div className="mt-3">
        <Textarea
          value={exercise.notes}
          onChange={(e) => update({ notes: e.target.value })}
          placeholder="Observação (opcional)"
          aria-label={`Observação do exercício ${index + 1}`}
          className="min-h-[56px] text-xs"
        />
      </div>
    </div>
  );
}

function formatWeightRaw(kg: number, unit: Unit): string {
  const v = unit === 'lb' ? kg * 2.2046226218 : kg;
  const s = v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  return s;
}
