import { EFFORT_LEVELS } from '../../utils/constants';
import { cn } from '../../utils/misc';

/**
 * Escala de esforço INVERTIDA: 1 = mais difícil, 6 = mais fácil.
 * Chips com cor gradual + rótulo + legenda.
 */
export function EffortSelector({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div>
      <div role="radiogroup" aria-label="Sensação de esforço (1 = mais difícil, 6 = mais fácil)" className="grid grid-cols-3 gap-1.5">
        {EFFORT_LEVELS.map((lvl) => {
          const selected = value === lvl.value;
          return (
            <button
              key={lvl.value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${lvl.value} — ${lvl.label} (${lvl.desc})`}
              onClick={() => onChange(selected ? null : lvl.value)}
              className={cn(
                'flex flex-col items-start gap-0.5 rounded-xl border px-2.5 py-2 text-left transition-all',
                selected
                  ? 'border-transparent shadow-lg -translate-y-0.5 motion-reduce:translate-y-0'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-white/15 dark:bg-slate-800/60 dark:hover:border-slate-600'
              )}
              style={selected ? { backgroundColor: lvl.color } : undefined}
            >
              <span
                className={cn(
                  'text-xs font-extrabold',
                  selected ? lvl.textClass : 'text-slate-400 dark:text-slate-500'
                )}
              >
                {lvl.value}
              </span>
              <span
                className={cn(
                  'text-[11px] font-semibold leading-tight',
                  selected ? lvl.textClass : 'text-slate-600 dark:text-slate-300'
                )}
              >
                {lvl.label}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
        1 = mais difícil · 6 = mais fácil
      </p>
    </div>
  );
}
