import { useEffect, useRef } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '../../utils/misc';
import { parseNum } from '../../utils/calc';
import { scheduleKeepInputVisible } from '../../utils/mobileInput';
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

  // O input é NÃO controlado (defaultValue): no Chrome Android, um input
  // controlado pode deixar de exibir os dígitos digitados quando o teclado
  // abre e a página faz reflow (interactive-widget=resizes-content) — o valor
  // fica no estado mas o campo continua vazio. Com defaultValue o navegador
  // guarda o que foi digitado e o onChange apenas alimenta o estado. Mudanças
  // EXTERNAS (pré-preencher, repetir treino, botões +/−) são aplicadas pelo
  // efeito abaixo. Durante a digitação o DOM já está em sincronia com o
  // estado (onChange), então reatribuir o mesmo valor não move o cursor.
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== value) {
      inputRef.current.value = value;
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
    <div className={cn('flex items-center overflow-hidden rounded-xl border border-slate-300 bg-white dark:border-white/20 dark:bg-slate-800', className)}>
      <button type="button" onClick={dec} aria-label={`Diminuir ${ariaLabel}`} className={btn} disabled={current != null && current <= min}>
        <Minus className="h-4 w-4" />
      </button>
      <div className="relative flex-1">
        <Input
          ref={inputRef}
          type="text"
          inputMode={inputMode}
          defaultValue={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => {
            // Android/iOS: o teclado abre DEPOIS do focus e reduz o viewport —
            // agenda rolagens para o campo continuar visível acima do teclado.
            scheduleKeepInputVisible(e.currentTarget);
          }}
          aria-label={ariaLabel}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="done"
          data-lpignore="true"
          // Fonte 16px INLINE: impede o zoom automático do iOS e garante o
          // mesmo tamanho em qualquer navegador (Chrome Android incluso).
          style={{ fontSize: 16 }}
          className={cn('min-h-[44px] border-0 bg-transparent px-1 text-center font-semibold shadow-none focus:ring-0 dark:bg-transparent', inputClassName)}
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
