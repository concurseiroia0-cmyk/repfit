import { useEffect, useRef } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '../../utils/misc';
import { parseNum } from '../../utils/calc';
import { forceInputRepaint } from '../../utils/mobileInput';
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

  // SOLUÇÃO DE CONTORNO para o Chrome Android: o campo é SOMENTE-LEITURA e o
  // valor é definido programaticamente — o teclado nem abre, então não existe
  // o problema do dígito digitado ficar invisível. O usuário muda o número
  // pelos botões −/+, que atualizam o estado e reatribuem o valor abaixo.
  // Mesmo assim forçamos uma repintura a cada mudança (o Chrome Android às
  // vezes deixa de desenhar o novo texto depois de um reflow).
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== value) {
      inputRef.current.value = value;
      forceInputRepaint(inputRef.current);
    }
  }, [value]);

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
    <div className={cn('stepper-input flex items-center overflow-hidden rounded-xl border border-slate-300 bg-white dark:border-white/20 dark:bg-slate-800', className)}>
      <button type="button" onClick={dec} aria-label={`Diminuir ${ariaLabel}`} className={btn} disabled={current != null && current <= min}>
        <Minus className="h-4 w-4" />
      </button>
      <div className="relative flex-1">
        <Input
          ref={inputRef}
          type="text"
          inputMode={inputMode}
          defaultValue={value}
          readOnly
          onFocus={(e) => e.currentTarget.blur()}
          aria-label={ariaLabel}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="done"
          data-lpignore="true"
          // Fonte 16px INLINE: impede o zoom automático do iOS e garante o
          // mesmo tamanho em qualquer navegador (Chrome Android incluso).
          style={{ fontSize: 16 }}
          // O fundo do campo é SÓLIDO (ver .stepper-input input no index.css):
          // o texto pinta sobre camada própria — nunca some no Chrome Android.
          className={cn('min-h-[44px] border-0 px-1 text-center font-semibold shadow-none focus:ring-0', inputClassName)}
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
