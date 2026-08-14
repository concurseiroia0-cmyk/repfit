import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { addDays, startOfToday } from 'date-fns';
import { GitCompare, TrendingDown, TrendingUp, Trophy } from 'lucide-react';
import { workoutsLive } from '../services/workoutService';
import { computeRecords } from '../services/recordsService';
import { useSettings } from '../services/settingsService';
import { BarChart, ChartCard, LineChart, MultiLineChart, type ChartPoint } from '../components/charts/Charts';
import { EmptyState, SkeletonCard } from '../components/ui/Feedback';
import { Card } from '../components/ui/Card';
import { Field, Select } from '../components/ui/Field';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { exerciseVolume, formatNumber, formatWeight, kgToUnit } from '../utils/calc';
import { formatDayShort, parseLocalDate, toDateString, todayString } from '../utils/date';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Unit, Workout } from '../types';

type Period = '30' | '90' | '180' | 'all';

interface ExerciseHistoryPoint {
  date: string;
  maxWeight: number;
  maxReps: number;
  vol: number;
  effort: number | null;
  workoutId: number | null;
}

/** Ocorrências de um exercício (ordenadas por data) dentro do período. */
function computeExerciseHistory(workouts: Workout[] | undefined, name: string, period: Period): ExerciseHistoryPoint[] {
  if (!workouts || !name) return [];
  const cutoff = period === 'all' ? null : toDateString(addDays(startOfToday(), -Number(period)));
  return workouts
    .filter((w) => (cutoff ? w.date >= cutoff : true))
    .map((w) => {
      const e = w.exercises.find((x) => x.name === name);
      if (!e) return null;
      const maxWeight = e.sets.reduce((m, s) => Math.max(m, s.weight ?? 0), 0);
      const maxReps = e.sets.reduce((m, s) => Math.max(m, s.reps ?? 0), 0);
      return {
        date: w.date,
        maxWeight,
        maxReps,
        vol: exerciseVolume(e),
        effort: w.avgEffort,
        workoutId: w.id ?? null,
      };
    })
    .filter((x): x is ExerciseHistoryPoint => x != null)
    .sort((a, b) => a.date.localeCompare(b.date));
}

const PERIOD_OPTIONS = [
  { value: '30' as const, label: '30 dias' },
  { value: '90' as const, label: '3 meses' },
  { value: '180' as const, label: '6 meses' },
  { value: 'all' as const, label: 'Tudo' },
];

export function EvolutionPage() {
  const workouts = useLiveQuery(() => workoutsLive(), []);
  const settings = useSettings();
  const [exercise, setExercise] = useState('');
  const [period, setPeriod] = useState<Period>('all');

  const exerciseNames = useMemo(() => {
    const counts = new Map<string, number>();
    for (const w of workouts ?? []) {
      for (const e of w.exercises) {
        counts.set(e.name, (counts.get(e.name) ?? 0) + 1);
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR')).map(([n]) => n);
  }, [workouts]);

  useEffect(() => {
    if (!exercise && exerciseNames.length > 0) setExercise(exerciseNames[0]);
  }, [exerciseNames, exercise]);

  // Comparação lado a lado: padrão = dois exercícios mais usados.
  const [compareA, setCompareA] = useState('');
  const [compareB, setCompareB] = useState('');

  useEffect(() => {
    if (!compareA && !compareB && exerciseNames.length >= 2) {
      setCompareA(exerciseNames[0]);
      setCompareB(exerciseNames[1]);
    }
  }, [exerciseNames, compareA, compareB]);

  const records = useMemo(() => computeRecords(workouts ?? []), [workouts]);

  const history = useMemo(() => computeExerciseHistory(workouts, exercise, period), [workouts, exercise, period]);
  const historyA = useMemo(() => computeExerciseHistory(workouts, compareA, period), [workouts, compareA, period]);
  const historyB = useMemo(() => computeExerciseHistory(workouts, compareB, period), [workouts, compareB, period]);

  const unit = settings.unit;
  const conv = (v: number) => Math.round(kgToUnit(v, unit) * 10) / 10;

  const weightData: ChartPoint[] = history.filter((h) => h.maxWeight > 0).map((h) => ({ label: formatDayShort(h.date), value: conv(h.maxWeight) }));
  const repsData: ChartPoint[] = history.filter((h) => h.maxReps > 0).map((h) => ({ label: formatDayShort(h.date), value: h.maxReps }));
  const volData: ChartPoint[] = history.filter((h) => h.vol > 0).map((h) => ({ label: formatDayShort(h.date), value: conv(h.vol) }));
  const effortData: ChartPoint[] = history.filter((h) => h.effort != null).map((h) => ({ label: formatDayShort(h.date), value: h.effort! }));

  const weightA: ChartPoint[] = historyA.filter((h) => h.maxWeight > 0).map((h) => ({ label: formatDayShort(h.date), value: conv(h.maxWeight) }));
  const weightB: ChartPoint[] = historyB.filter((h) => h.maxWeight > 0).map((h) => ({ label: formatDayShort(h.date), value: conv(h.maxWeight) }));
  const volA: ChartPoint[] = historyA.filter((h) => h.vol > 0).map((h) => ({ label: formatDayShort(h.date), value: conv(h.vol) }));
  const volB: ChartPoint[] = historyB.filter((h) => h.vol > 0).map((h) => ({ label: formatDayShort(h.date), value: conv(h.vol) }));

  const statsA = useMemo(
    () => ({
      maiorCarga: historyA.reduce((m, h) => Math.max(m, h.maxWeight), 0),
      ultimaCarga: [...historyA].reverse().find((h) => h.maxWeight > 0)?.maxWeight ?? 0,
      volumeTotal: Math.round(historyA.reduce((a, h) => a + h.vol, 0) * 10) / 10,
    }),
    [historyA]
  );
  const statsB = useMemo(
    () => ({
      maiorCarga: historyB.reduce((m, h) => Math.max(m, h.maxWeight), 0),
      ultimaCarga: [...historyB].reverse().find((h) => h.maxWeight > 0)?.maxWeight ?? 0,
      volumeTotal: Math.round(historyB.reduce((a, h) => a + h.vol, 0) * 10) / 10,
    }),
    [historyB]
  );

  // Histórico de tempo de descanso (por treino, no período).
  const restData: ChartPoint[] = useMemo(() => {
    if (!workouts) return [];
    const cutoff = period === 'all' ? null : toDateString(addDays(startOfToday(), -Number(period)));
    return workouts
      .filter((w) => (cutoff ? w.date >= cutoff : true) && (w.restSec ?? 0) > 0)
      .map((w) => ({ label: formatDayShort(w.date), value: (w.restSec ?? 0) / 60 }))
      .slice(-16);
  }, [workouts, period]);

  const freqData = useMemo(() => {
    if (!workouts) return [];
    const cutoff = period === 'all' ? null : toDateString(addDays(startOfToday(), -Number(period)));
    const map = new Map<string, number>();
    for (const w of workouts) {
      if (cutoff && w.date < cutoff) continue;
      const week = format(parseLocalDate(w.date), 'dd/MM', { locale: ptBR });
      map.set(week, (map.get(week) ?? 0) + 1);
    }
    return [...map.entries()].slice(-14).map(([label, value]) => ({ label, value }));
  }, [workouts, period]);

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
      <h1 className="mb-1 text-xl font-extrabold text-slate-900 dark:text-white">Evolução</h1>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        Acompanhe a progressão dos seus exercícios ao longo do tempo.
      </p>

      {/* Filtros */}
      <Card className="mb-4 p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Exercício">
            <Select value={exercise} onChange={(e) => setExercise(e.target.value)} aria-label="Selecionar exercício">
              {exerciseNames.length === 0 && <option value="">—</option>}
              {exerciseNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Período">
            <SegmentedControl
              options={PERIOD_OPTIONS}
              value={period}
              onChange={setPeriod}
              ariaLabel="Filtrar por período"
            />
          </Field>
        </div>
      </Card>

      {/* Recordes */}
      <Card className="mb-4 p-5">
        <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
          <Trophy className="h-5 w-5 text-amber-400" /> Recordes pessoais
        </h2>
        {records.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Nenhum recorde ainda. Bata seus próprios limites!
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {records.slice(0, 6).map((r) => (
              <div key={r.key} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  {r.sublabel ? `${r.sublabel} — ` : ''}
                  {r.label}
                </p>
                <p className="mt-0.5 text-lg font-extrabold text-slate-900 dark:text-white">
                  {r.unit === 'kg' ? formatWeight(r.value, unit) : `${formatNumber(r.value)} ${r.unit === 'dias' ? 'dias' : 'reps'}`}
                </p>
                {r.date && <p className="text-xs text-slate-400">{formatDayShort(r.date)}</p>}
              </div>
            ))}
          </div>
        )}
      </Card>

      {exerciseNames.length === 0 ? (
        <EmptyState
          icon={<TrendingUp className="h-7 w-7" />}
          title="Sem dados ainda"
          description="Registre alguns treinos para ver gráficos e progressão aqui."
        />
      ) : (
        <>
          {/* Resumo da progressão da carga */}
          <ProgressionSummary history={history} unit={unit} />

          {/* Progressão em lista */}
          <Card className="mb-4 p-5">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Progressão — {exercise}
            </h2>
            {history.length === 0 ? (
              <p className="py-4 text-sm text-slate-500 dark:text-slate-400">
                Sem registros de <b>{exercise}</b> no período selecionado.
              </p>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {history.map((h) => (
                  <li
                    key={h.workoutId ?? h.date}
                    className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {formatDayShort(h.date)} ·{' '}
                    {h.maxWeight > 0 ? `${formatWeight(h.maxWeight, unit)}` : '—'} × {h.maxReps > 0 ? h.maxReps : '—'}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Gráficos */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="Evolução da carga" subtitle="Carga máxima por treino" empty={weightData.length === 0 ? 'Sem cargas registradas.' : undefined}>
              <LineChart data={weightData} unit={unit} />
            </ChartCard>
            <ChartCard title="Evolução das repetições" subtitle="Máximo de repetições por treino" empty={repsData.length === 0 ? 'Sem repetições registradas.' : undefined}>
              <LineChart data={repsData} unit="reps" color="#0ea5e9" />
            </ChartCard>
            <ChartCard title="Volume do exercício" subtitle="Soma do volume por treino" empty={volData.length === 0 ? 'Sem volume registrado.' : undefined}>
              <BarChart data={volData} unit={unit} />
            </ChartCard>
            <ChartCard title="Frequência de treinos" subtitle="Treinos por semana" empty={freqData.length === 0 ? 'Sem treinos no período.' : undefined}>
              <BarChart data={freqData} unit="treinos" />
            </ChartCard>
            <ChartCard
              title="Tempo de descanso por treino"
              subtitle="Descanso total registrado no formulário (minutos)"
              empty={restData.length === 0 ? 'Sem descanso registrado no período.' : undefined}
            >
              <BarChart data={restData} unit="min" />
            </ChartCard>
            <ChartCard title="Esforço médio" subtitle="Média da escala 1–6 (1 = mais difícil)" empty={effortData.length === 0 ? 'Sem esforço registrado.' : undefined}>
              <LineChart data={effortData} unit="/6" color="#f59e0b" />
            </ChartCard>
          </div>

          {/* Comparação lado a lado */}
          {exerciseNames.length >= 2 && (
            <Card className="mt-6 p-5">
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                <GitCompare className="h-5 w-5 text-sky-500" /> Comparar dois exercícios
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Exercício A">
                  <Select value={compareA} onChange={(e) => setCompareA(e.target.value)} aria-label="Exercício A para comparação">
                    {exerciseNames.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Exercício B">
                  <Select value={compareB} onChange={(e) => setCompareB(e.target.value)} aria-label="Exercício B para comparação">
                    {exerciseNames.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              {compareA && compareB && compareA !== compareB ? (
                <>
                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <CompareSummary name={compareA} stats={statsA} unit={unit} dotColor="#10b981" />
                    <CompareSummary name={compareB} stats={statsB} unit={unit} dotColor="#0ea5e9" />
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <ChartCard
                      title="Evolução da carga"
                      subtitle="Carga máxima por ocorrência (1º, 2º… treino com o exercício)"
                      empty={weightA.length + weightB.length === 0 ? 'Sem cargas registradas no período.' : undefined}
                    >
                      <MultiLineChart
                        series={[
                          { name: compareA, color: '#10b981', data: weightA },
                          { name: compareB, color: '#0ea5e9', data: weightB },
                        ]}
                        unit={unit}
                      />
                    </ChartCard>
                    <ChartCard
                      title="Volume por treino"
                      subtitle="Soma do volume do exercício por ocorrência"
                      empty={volA.length + volB.length === 0 ? 'Sem volume registrado no período.' : undefined}
                    >
                      <MultiLineChart
                        series={[
                          { name: compareA, color: '#10b981', data: volA },
                          { name: compareB, color: '#0ea5e9', data: volB },
                        ]}
                        unit={unit}
                      />
                    </ChartCard>
                  </div>
                  <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                    O eixo X mostra a ocorrência do exercício (1º treino, 2º treino…), alinhando as progressões mesmo
                    quando os exercícios foram feitos em dias diferentes.
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  Escolha dois exercícios <b>diferentes</b> para comparar carga e volume lado a lado.
                </p>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function ProgressionSummary({ history, unit }: { history: ExerciseHistoryPoint[]; unit: Unit }) {
  const loaded = history.filter((h) => h.maxWeight > 0);
  const first = loaded[0] ?? null;
  const last = loaded.length > 0 ? loaded[loaded.length - 1] : null;
  const maior = loaded.reduce((m, h) => Math.max(m, h.maxWeight), 0);
  const delta = first && last ? Math.round((last.maxWeight - first.maxWeight) * 10) / 10 : 0;
  const deltaPct = first && first.maxWeight > 0 ? Math.round((delta / first.maxWeight) * 100) : 0;

  if (!first || !last || first.maxWeight <= 0) return null;

  const up = delta > 0;
  const down = delta < 0;
  const TrendIcon = up ? TrendingUp : down ? TrendingDown : GitCompare;
  const trendColor = up ? 'text-emerald-500' : down ? 'text-rose-500' : 'text-slate-400';

  return (
    <Card className="mb-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
          <TrendIcon className={`h-5 w-5 ${trendColor}`} /> Progressão da carga
        </h2>
        {delta !== 0 && (
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${up ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'}`}>
            {up ? '▲' : '▼'} {up ? '+' : ''}{formatNumber(delta)} {unit} · {up ? '+' : ''}{deltaPct}%
          </span>
        )}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
          <div className="text-base font-extrabold text-slate-900 dark:text-white">{formatWeight(first.maxWeight, unit)}</div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">primeira</div>
        </div>
        <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-400/10">
          <div className="text-base font-extrabold text-amber-600 dark:text-amber-400">{formatWeight(last.maxWeight, unit)}</div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">última</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
          <div className="text-base font-extrabold text-slate-900 dark:text-white">{formatWeight(maior, unit)}</div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">maior carga</div>
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
        {loaded.length} {loaded.length === 1 ? 'treino com' : 'treinos com'} este exercício no período selecionado.
      </p>
    </Card>
  );
}

function CompareSummary({
  name,
  stats,
  unit,
  dotColor,
}: {
  name: string;
  stats: { maiorCarga: number; ultimaCarga: number; volumeTotal: number };
  unit: Unit;
  dotColor: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60">
      <p className="flex items-center gap-1.5 text-sm font-bold text-slate-800 dark:text-slate-100">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: dotColor }} aria-hidden="true" />
        {name}
      </p>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-sm font-extrabold text-slate-900 dark:text-white">
            {stats.maiorCarga > 0 ? formatWeight(stats.maiorCarga, unit) : '—'}
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">maior carga</div>
        </div>
        <div>
          <div className="text-sm font-extrabold text-slate-900 dark:text-white">
            {stats.ultimaCarga > 0 ? formatWeight(stats.ultimaCarga, unit) : '—'}
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">última carga</div>
        </div>
        <div>
          <div className="text-sm font-extrabold text-slate-900 dark:text-white">
            {stats.volumeTotal > 0 ? `${formatNumber(stats.volumeTotal)} ${unit}` : '—'}
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">volume total</div>
        </div>
      </div>
    </div>
  );
}
