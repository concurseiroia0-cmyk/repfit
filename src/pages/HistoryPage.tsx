import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { addDays, startOfToday } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { ChevronRight, History, Search, X } from 'lucide-react';
import { workoutsLive } from '../services/workoutService';
import { usePhotoUrl } from '../hooks/usePhotoUrl';
import { TypeBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState, SkeletonCard } from '../components/ui/Feedback';
import { Input, Select } from '../components/ui/Field';
import { useSettings } from '../services/settingsService';
import { formatDayShort, formatMonthYear, toDateString } from '../utils/date';
import { pluralize } from '../utils/calc';

const PERIOD_KEYS = [
  { value: 'all', labelKey: 'Todo o período' },
  { value: '30', labelKey: 'Últimos 30 dias' },
  { value: '90', labelKey: 'Últimos 3 meses' },
  { value: '180', labelKey: 'Últimos 6 meses' },
  { value: '365', labelKey: 'Último ano' },
];

export function HistoryPage() {
  const { t } = useTranslation();
  const workouts = useLiveQuery(() => workoutsLive(), []);
  const settings = useSettings();
  const [query, setQuery] = useState('');
  const [period, setPeriod] = useState('all');
  const [type, setType] = useState('all');

  const types = useMemo(() => {
    const set = new Set<string>();
    for (const w of workouts ?? []) if (w.type) set.add(w.type);
    return [...set];
  }, [workouts]);

  const filtered = useMemo(() => {
    if (!workouts) return null;
    const q = query.trim().toLowerCase();
    const cutoff = period === 'all' ? null : toDateString(addDays(startOfToday(), -Number(period)));
    return workouts.filter((w) => {
      if (type !== 'all' && w.type !== type) return false;
      if (cutoff && w.date < cutoff) return false;
      if (q) {
        const hay = `${w.name} ${w.type} ${w.exercises.map((e) => e.name).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [workouts, query, period, type]);

  const groups = useMemo(() => {
    if (!filtered) return [];
    const map = new Map<string, typeof filtered>();
    for (const w of filtered) {
      const key = w.date.slice(0, 7);
      const arr = map.get(key) ?? [];
      arr.push(w);
      map.set(key, arr);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filtered]);

  if (workouts === undefined) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (workouts.length === 0) {
    return (
      <EmptyState
        icon={<History className="h-7 w-7" />}
        title={t('Nenhum treino registrado')}
        description={t('Seu histórico aparece aqui assim que você salvar seu primeiro treino.')}
        action={
          <Link to="/novo">
            <Button>{t('Começar agora')}</Button>
          </Link>
        }
      />
    );
  }

  const hasFilters = query.trim() !== '' || period !== 'all' || type !== 'all';

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{t('Histórico')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('{{n}} treino(s) encontrado(s)', { n: filtered?.length ?? 0 })}
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-4 space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Buscar por treino ou exercício…')}
            className="pl-10"
            aria-label={t('Buscar treinos')}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Select value={period} onChange={(e) => setPeriod(e.target.value)} aria-label={t('Filtrar por período')}>
            {PERIOD_KEYS.map((p) => (
              <option key={p.value} value={p.value}>
                {t(p.labelKey)}
              </option>
            ))}
          </Select>
          <Select value={type} onChange={(e) => setType(e.target.value)} aria-label={t('Filtrar por tipo de treino')}>
            <option value="all">{t('Todos os tipos')}</option>
            {types.map((tp) => (
              <option key={tp} value={tp}>
                {t(tp)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {filtered && filtered.length === 0 ? (
        <EmptyState
          icon={<Search className="h-7 w-7" />}
          title={t('Nada encontrado')}
          description={t('Tente mudar a busca ou limpar os filtros.')}
          action={
            hasFilters ? (
              <Button variant="secondary" onClick={() => { setQuery(''); setPeriod('all'); setType('all'); }}>
                <X className="h-4 w-4" /> {t('Limpar filtros')}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-6">
          {groups.map(([month, list]) => (
            <section key={month}>
              <h2 className="mb-2 flex items-baseline gap-2 text-xs font-extrabold tracking-widest text-slate-400 dark:text-slate-500">
                {formatMonthYear(`${month}-01`)}
                <span className="font-semibold normal-case tracking-normal">
                  {t('{{n}} treino(s)', { n: list.length })}
                </span>
              </h2>
              <div className="space-y-2">
                {list.map((w) => (
                  <WorkoutRow key={w.id} workoutId={w.id!} date={w.date} name={w.name} type={w.type} exerciseCount={w.exercises.length} effort={w.avgEffort} photoId={w.photoId} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function WorkoutRow({
  workoutId,
  date,
  name,
  type,
  exerciseCount,
  effort,
  photoId,
}: {
  workoutId: number;
  date: string;
  name: string;
  type: string;
  exerciseCount: number;
  effort: number | null;
  photoId: string | null;
}) {
  const { t } = useTranslation();
  const photoUrl = usePhotoUrl(photoId);
  return (
    <Link
      to={`/treino/${workoutId}`}
      className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-3 transition-colors hover:border-amber-300 hover:shadow-sm dark:border-white/10 dark:bg-[#161616] dark:hover:border-amber-400/50"
    >
      <div className="flex h-12 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
        <span className="text-sm font-extrabold leading-none">{formatDayShort(date).split(' ')[0]}</span>
        <span className="text-[10px] font-bold uppercase text-slate-400">{formatDayShort(date).split(' ')[1]}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-bold text-slate-900 dark:text-white">{name}</span>
          {type && <TypeBadge type={type} className="hidden sm:inline-flex" />}
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
          {t('{{n}} exercício(s)', { n: exerciseCount })}
          {effort != null && <> · {t('Esforço')} {effort}/6</>}
        </p>
      </div>
      {photoUrl && <img src={photoUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />}
      <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 dark:text-slate-600" />
    </Link>
  );
}
