import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { formatSeconds } from '../../utils/calc';
import { ACTIVE_PILL, cn } from '../../utils/misc';
import { StepperInput } from '../ui/StepperInput';

const PRESETS = [30, 60, 90, 120, 180, 300];
const MIN_SEC = 5;
const MAX_SEC = 1800;

interface RestQuestionProps {
  /** Segundos de descanso (0 = sem resposta, -1 = não houve, >0 = sim + tempo). */
  value: number;
  onChange: (sec: number) => void;
}

/**
 * Descanso entre séries, simplificado: uma pergunta opcional ("houve
 * descanso?"). Sim → o usuário informa o tempo entre as séries; Não → nada.
 * Sem resposta também é válido (campo opcional) — nada fica pressionado até
 * o usuário responder.
 */
export function RestQuestion({ value, onChange }: RestQuestionProps) {
  const answered = value > 0;
  const no = value === -1;

  const setPreset = (sec: number) => onChange(sec);

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          aria-pressed={answered}
          onClick={() => {
            if (!answered) onChange(60);
          }}
          className={cn(
            'flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-150',
            answered && ACTIVE_PILL,
            answered && 'border-transparent',
            !answered &&
              'border-slate-300 text-slate-600 hover:border-amber-400 hover:text-amber-600 dark:border-white/20 dark:text-slate-300 dark:hover:border-amber-400 dark:hover:text-amber-400'
          )}
        >
          <ThumbsUp className="h-4 w-4" /> Sim
        </button>
        <button
          type="button"
          aria-pressed={no}
          onClick={() => onChange(-1)}
          className={cn(
            'flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-150',
            no && ACTIVE_PILL,
            no && 'border-transparent',
            !no &&
              'border-slate-300 text-slate-600 hover:border-amber-400 hover:text-amber-600 dark:border-white/20 dark:text-slate-300 dark:hover:border-amber-400 dark:hover:text-amber-400'
          )}
        >
          <ThumbsDown className="h-4 w-4" /> Não
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
        Opcional — você pode deixar sem responder.
      </p>

      {answered && (
        <div className="mt-3">
          <p className="mb-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Tempo entre as séries
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPreset(p)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-150',
                  value === p && ACTIVE_PILL,
                  value === p && 'border-transparent',
                  value !== p &&
                    'border-slate-300 text-slate-600 hover:border-amber-400 hover:text-amber-600 dark:border-white/20 dark:text-slate-300 dark:hover:border-amber-400 dark:hover:text-amber-400'
                )}
              >
                {formatSeconds(p)}
              </button>
            ))}
            <div className="w-28">
              <StepperInput
                value={String(value)}
                onChange={(v) => {
                  const n = Math.round(Number(v.replace(',', '.')));
                  onChange(Number.isFinite(n) && n >= MIN_SEC ? Math.min(MAX_SEC, n) : 0);
                }}
                step={10}
                min={MIN_SEC}
                max={MAX_SEC}
                suffix="s"
                ariaLabel="Tempo de descanso entre as séries em segundos"
                className="h-9"
                inputClassName="text-xs"
                inputMode="numeric"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
