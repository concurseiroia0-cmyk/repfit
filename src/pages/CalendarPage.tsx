import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { workoutsLive } from '../services/workoutService';
import { useSettings } from '../services/settingsService';
import { longestStreakInMonth, parseLocalDate, toDateString, todayString, weekdayName } from '../utils/date';
import { formatNumber, pluralize } from '../utils/calc';
import { Dot, TypeBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState, SkeletonCard } from '../components/ui/Feedback';
import { ACTIVE_PILL, cn } from '../utils/misc';
import type { Workout } from '../types';

const WEEKDAYS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];

export function CalendarPage() {
  const workouts = useLiveQuery(() => workoutsLive(), []);
  const settings = useSettings();
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selected, setSelected] = useState<string>(todayString());

  const byDate = useMemo(() => {
    const map = new Map<string, Workout[]>();
    for (const w of workouts ?? []) {
      const arr = map.get(w.date) ?? [];
      arr.push(w);
      map.set(w.date, arr);
    }
    return map;
  }, [workouts]);

  const cells = useMemo(() => {
    // Grid completo do mês: da segunda antes do dia 1 até o domingo após o último dia.
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const monthPrefix = format(month, 'yyyy-MM');
  const monthWorkouts = workouts?.filter((w) => w.date.startsWith(monthPrefix)) ?? [];
  const daysTrained = new Set(monthWorkouts.map((w) => w.date)).size;
  const longestInMonth = longestStreakInMonth(monthWorkouts.map((w) => w.date), monthPrefix);
  const selectedWorkouts = byDate.get(selected) ?? [];

  if (workouts === undefined) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-extrabold text-slate-900 dark:text-white">Calendário</h1>

      <Card className="mb-4 p-5">
        {/* Navegação de mês */}
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, -1))}
            aria-label="Mês anterior"
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-base font-extrabold capitalize text-slate-900 dark:text-white">
            {format(month, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            aria-label="Próximo mês"
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Grade */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((d) => (
            <div key={d} className="pb-1 text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500">
              {d}
            </div>
          ))}
          {cells.map((day) => {
            const dateStr = toDateString(day);
            const dayWorkouts = byDate.get(dateStr) ?? [];
            const inMonth = isSameMonth(day, month);
            const isToday = dateStr === todayString();
            const isSelected = dateStr === selected;
            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => setSelected(dateStr)}
                aria-label={`${format(day, 'dd/MM/yyyy')}${dayWorkouts.length ? `, ${dayWorkouts.length} treino(s)` : ''}`}
                className={cn(
                  'flex aspect-square flex-col items-center justify-center rounded-full text-sm transition-all duration-150',
                  !inMonth && 'opacity-30',
                  isSelected
                    ? ACTIVE_PILL
                    : isToday
                      ? 'bg-amber-400 font-extrabold text-black'
                      : inMonth
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-[#26262b] dark:text-slate-200 dark:hover:bg-[#303036]'
                        : 'text-slate-300 dark:text-slate-600'
                )}
              >
                <span className={cn('leading-none', (isSelected || isToday) && 'font-extrabold')}>{format(day, 'd')}</span>
                <span className="mt-1 flex h-1.5 items-center gap-0.5">
                  {dayWorkouts.slice(0, 2).map((w) => (
                    <Dot key={w.id} type={w.type || 'Outro'} className="h-1.5 w-1.5" />
                  ))}
                </span>
              </button>
            );
          })}
        </div>

        {/* Estatísticas do mês */}
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 dark:border-white/10">
          <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
            <div className="text-xl font-extrabold text-slate-900 dark:text-white">{daysTrained}</div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">dias treinados no mês</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
            <div className="text-xl font-extrabold text-slate-900 dark:text-white">{longestInMonth}</div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">maior sequência do mês</div>
          </div>
        </div>
      </Card>

      {/* Dia selecionado */}
      <Card className="p-5">
        <h2 className="text-sm font-bold capitalize text-slate-900 dark:text-white">
          {weekdayName(selected)}, {format(parseLocalDate(selected), 'd MMMM yyyy', { locale: ptBR })}
        </h2>
        <div className="mt-3 space-y-2">
          {selectedWorkouts.length === 0 ? (
            <p className="py-2 text-sm text-slate-500 dark:text-slate-400">Nenhum treino neste dia.</p>
          ) : (
            selectedWorkouts.map((w) => (
              <Link
                key={w.id}
                to={`/treino/${w.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5 hover:border-amber-300 dark:border-white/15 dark:hover:border-amber-400/50"
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">{w.name}</span>
                  <span className="ml-2 text-xs text-slate-400">
                    {pluralize(w.exercises.length, 'exercício', 'exercícios')}
                    {w.totalVolume > 0 && <> · {formatNumber(w.totalVolume)} {settings.unit}</>}
                  </span>
                </div>
                {w.type && <TypeBadge type={w.type} />}
              </Link>
            ))
          )}
        </div>
        <Link to={`/novo?data=${selected}`} className="mt-3 block">
          <Button variant="secondary" full>
            <Plus className="h-4 w-4" /> Novo treino neste dia
          </Button>
        </Link>
      </Card>

      {workouts.length === 0 && (
        <div className="mt-4">
          <EmptyState
            icon={<Calendar className="h-7 w-7" />}
            title="Sem treinos ainda"
            description="Os dias treinados aparecem destacados aqui."
            action={
              <Link to="/novo">
                <Button>Novo treino</Button>
              </Link>
            }
          />
        </div>
      )}
    </div>
  );
}
