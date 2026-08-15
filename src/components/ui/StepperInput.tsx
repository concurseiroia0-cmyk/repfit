import { Minus, Plus } from 'lucide-react';
import { cn } from '../../utils/misc';
import { parseNum } from '../../utils/calc';

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

/**
 * Campo de peso/repetições com botões −/+.
 *
 * O valor é renderizado como TEXTO PURO (uma <div>), NUNCA como <input>.
 * O campo é somente leitura por design (o número muda apenas pelos botões),
 * então não existe campo de texto para o Chrome Mobile "esconder": o React
 * pinta o número a cada render e ele fica SEMPRE visível — cor explícita,
 * fundo sólido, sem depender de repintura do navegador.
 */
export function StepperInput({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 9999,
  suffix,
  ariaLabel,
  className,
  inputClassName,
}: StepperInputProps) {
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
    <div
      className={cn(
        'stepper-input flex items-center overflow-hidden rounded-xl border border-slate-300 bg-white dark:border-white/20 dark:bg-slate-800',
        className
      )}
    >
      <button type="button" onClick={dec} aria-label={`Diminuir ${ariaLabel}`} className={btn} disabled={current != null && current <= min}>
        <Minus className="h-4 w-4" />
      </button>
      <div className="relative flex-1">
        {/* Valor como texto puro. role="textbox" + aria-readonly preservam a
            acessibilidade de um campo somente leitura. */}
        <div
          role="textbox"
          aria-readonly="true"
          aria-label={ariaLabel}
          style={{ fontSize: 16 }}
          className={cn(
            'flex min-h-[44px] items-center justify-center px-1 text-center font-semibold text-slate-900 dark:text-slate-100',
            inputClassName
          )}
        >
          {value || '0'}
        </div>
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
