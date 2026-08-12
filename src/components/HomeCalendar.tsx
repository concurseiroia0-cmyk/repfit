import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { Workout } from '../types';
import { formatNumber, pluralize } from '../utils/calc';
import { parseLocalDate, toDateString, todayString } from '../utils/date';
import { ACTIVE_PILL, cn } from '../utils/misc';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { TypeBadge } from './ui/Badge';

const WEEKDAYS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];

interface HomeCalendarProps {
  workouts: Workout[];
  unit: string;
}

/**
 * Calendário mensal da tela inicial, no design da referência:
 * dias em círculos; o dia muda de formato quando há treino
 * (número dourado + ponto amarelo) e o dia de hoje/selecionado
 * vira um círculo amarelo com texto escuro e leve elevação.
 */
export function HomeCalendar({ workouts, unit }: HomeCalendarProps) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selected, setSelected] = useState<string>(todayString());

  const byDate = useMemo(() => {
    const map = new Map<string, Workout[]>();
    for (const w of workouts) {
      const arr = map.get(w.date) ?? [];
      arr.push(w);
      map.set(w.date, arr);
    }
    return map;
  }, [workouts]);

  const cells = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const selectedWorkouts = byDate.get(selected) ?? [];
  const today = todayString();

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
          <Calendar className="h-5 w-5 text-amber-400" /> Calendário
        </h2>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, -1))}
            aria-label="Mês anterior"
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[112px] text-center text-sm font-extrabold capitalize text-slate-900 dark:text-white">
            {format(month, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            aria-label="Próximo mês"
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Grade de dias em círculos */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d) => (
          <div key={d} className="pb-1 text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500">
            {d}
          </div>
        ))}
        {cells.map((day) => {
          const dateStr = toDateString(day);
          const count = (byDate.get(dateStr) ?? []).length;
          const inMonth = isSameMonth(day, month);
          const isToday = dateStr === today;
          const isSelected = dateStr === selected;
          const trained = count > 0;
          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => setSelected(dateStr)}
              aria-label={`${format(day, 'dd/MM/yyyy')}${trained ? `, ${count} treino(s)` : ''}`}
              className={cn(
                'mx-auto flex aspect-square w-full max-w-[44px] flex-col items-center justify-center rounded-full text-sm transition-all duration-150',
                !inMonth && 'opacity-25',
                isSelected
                  ? ACTIVE_PILL
                  : isToday
                    ? 'bg-amber-400 font-extrabold text-black shadow-[0_4px_12px_rgba(245,197,24,0.35)]'
                    : inMonth
                      ? trained
                        ? 'bg-amber-400/15 font-bold text-amber-600 dark:bg-amber-400/15 dark:text-amber-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-[#26262b] dark:text-slate-300'
                      : 'text-slate-300 dark:text-slate-600'
              )}
            >
              <span className={cn('leading-none', (isSelected || isToday) && 'font-extrabold')}>{format(day, 'd')}</span>
              <span
                className={cn(
                  'mt-1 h-1.5 w-1.5 rounded-full',
                  trained && !isSelected && !isToday && 'bg-amber-400',
                  (isSelected || isToday) && 'bg-black/60',
                  !trained && !isSelected && !isToday && 'bg-transparent'
                )}
              />
            </button>
          );
        })}
      </div>

      {/* Dia selecionado */}
      <div className="mt-4 border-t border-slate-100 pt-4 dark:border-white/10">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {format(parseLocalDate(selected), 'eeee, d MMMM', { locale: ptBR })}
        </p>
        {selectedWorkouts.length === 0 ? (
          <div className="flex flex-col gap-2 rounded-xl bg-slate-50 px-3.5 py-3 dark:bg-slate-800/60 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">Nenhum treino neste dia.</p>
            <Link to={`/novo?data=${selected}`}>
              <Button variant="secondary" size="sm">
                <Plus className="h-4 w-4" /> Treino neste dia
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedWorkouts.map((w) => (
              <Link
                key={w.id}
                to={`/treino/${w.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5 hover:border-amber-300 dark:border-white/15 dark:hover:border-amber-400/50"
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">{w.name}</span>
                  <span className="ml-2 text-xs text-slate-400">
                    {pluralize(w.exercises.length, 'exercício', 'exercícios')}
                    {w.totalVolume > 0 && <> · {formatNumber(w.totalVolume)} {unit}</>}
                  </span>
                </div>
                {w.type && <TypeBadge type={w.type} />}
              </Link>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
