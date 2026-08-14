import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/misc';

/** Item de pergunta frequente em acordeão. */
export function FaqItem({ q, a, defaultOpen = false }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="text-sm font-extrabold text-slate-900">{q}</span>
        <ChevronDown
          className={cn('h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>
      {open && <p className="px-5 pb-4 text-sm leading-relaxed text-slate-600">{a}</p>}
    </div>
  );
}
