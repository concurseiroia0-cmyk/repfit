import { useRef } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '../../utils/misc';
import { parseNum } from '../../utils/calc';
import { Input } from './Field';

interface StepperInputProps {
  value: string;
  onChange: (v: string) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  inputMode?: 'decimal' | 'numeric';
  ariaLabel: string;
  className?: string;
  inputClassName?: string;
}

export function StepperInput({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 9999,
  suffix,
  inputMode = 'decimal',
  ariaLabel,
  className,
  inputClassName,
}: StepperInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const current = parseNum(value);
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n * 10) / 10));

  const dec = () => {
    const n = (current ?? 0) - step;
    onChange(String(clamp(n)));
  };
  const inc = () => {
    const n = (current ?? 0) + step;
    onChange(String(clamp(n)));
  };

  const btn =
    'flex h-11 w-9 shrink-0 items-center justify-center text-slate-500 hover:text-amber-600 active:bg-slate-100 disabled:opacity-30 disabled:hover:text-slate-500 dark:text-slate-400 dark:hover:text-amber-400 dark:active:bg-slate-800';

  return (
    <div className={cn('flex items-center overflow-hidden rounded-xl border border-slate-300 bg-white dark:border-white/20 dark:bg-slate-800', className)}>
      <button type="button" onClick={dec} aria-label={`Diminuir ${ariaLabel}`} className={btn} disabled={current != null && current <= min}>
        <Minus className="h-4 w-4" />
      </button>
      <div className="relative flex-1">
        <Input
          ref={inputRef}
          type="text"
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => {
            // No celular, garante que o campo fique visível acima do teclado.
            try {
              e.currentTarget.scrollIntoView({ block: 'center' });
            } catch {
              /* navegador antigo sem suporte a options */
            }
          }}
          aria-label={ariaLabel}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          // Fonte 16px: impede o zoom automático do iOS ao focar (que "escondia" os números digitados).
          className={cn('min-h-[44px] border-0 bg-transparent px-1 text-center text-base font-semibold shadow-none focus:ring-0 dark:bg-transparent', inputClassName)}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center text-xs text-slate-400">{suffix}</span>
        )}
      </div>
      <button type="button" onClick={inc} aria-label={`Aumentar ${ariaLabel}`} className={btn} disabled={current != null && current >= max}>
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
