import { Minus, Plus } from 'lucide-react';
import { cn } from '../../utils/misc';
import { parseNum } from '../../utils/calc';

interface StepperInputProps {
  value: string;
  onChange: (v: string) => void;
  step?: number;
  min?: number;
  max?: number;
  /** Unidade ao lado do número DENTRO do controle (ex.: "min", "km"). */
  suffix?: string;
  /** Rótulo abaixo do controle (ex.: "peso kg", "repetições") — referência do fluxo de treino. */
  label?: string;
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
 *
 * Layout: [ − ]  valor  [ + ] com o nome do campo (peso kg / repetições) em
 * um RÓTULO CENTRALIZADO ABAIXO do controle — como na referência. Botões com
 * fundo próprio e bordas de separação, para o usuário ver onde tocar.
 */
export function StepperInput({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 9999,
  suffix,
  label,
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
    'flex h-11 w-10 shrink-0 items-center justify-center text-slate-500 transition-colors ' +
    'hover:bg-slate-100 hover:text-amber-600 active:bg-amber-100 ' +
    'disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 ' +
    'dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-amber-300 dark:active:bg-amber-400/20 ' +
    'dark:disabled:hover:bg-transparent dark:disabled:hover:text-slate-400';

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="stepper-input flex w-full items-center overflow-hidden rounded-xl border border-slate-300 bg-white dark:border-white/20 dark:bg-slate-800">
        <button
          type="button"
          onClick={dec}
          aria-label={`Diminuir ${ariaLabel}`}
          className={cn(btn, 'border-r border-slate-200 dark:border-white/10')}
          disabled={current != null && current <= min}
        >
          <Minus className="h-4 w-4" strokeWidth={2.5} />
        </button>
        <div
          role="textbox"
          aria-readonly="true"
          aria-label={ariaLabel}
          style={{ fontSize: 16 }}
          className="flex min-h-[44px] min-w-0 flex-1 items-center justify-center gap-1 px-1"
        >
          <span
            className={cn(
              'truncate text-center font-semibold text-slate-900 dark:text-slate-100',
              inputClassName
            )}
          >
            {value || '0'}
          </span>
          {suffix && (
            <span className="shrink-0 text-xs font-medium text-slate-400 dark:text-slate-400">{suffix}</span>
          )}
        </div>
        <button
          type="button"
          onClick={inc}
          aria-label={`Aumentar ${ariaLabel}`}
          className={cn(btn, 'border-l border-slate-200 dark:border-white/10')}
          disabled={current != null && current >= max}
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
      {label && (
        <span className="text-center text-xs font-semibold text-slate-500 dark:text-slate-300">{label}</span>
      )}
    </div>
  );
}
