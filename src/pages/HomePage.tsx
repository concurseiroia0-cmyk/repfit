import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Activity,
  ArrowRight,
  Calendar,
  ChevronRight,
  Dumbbell,
  Flame,
  Plus,
  Share2,
  Smartphone,
  Sparkles,
  Trophy,
  TrendingUp,
} from 'lucide-react';
import { workoutsLive } from '../services/workoutService';
import { computeRecords } from '../services/recordsService';
import { useSettings } from '../services/settingsService';
import { createSampleData } from '../services/sampleData';
import { currentStreak, formatDayShort, formatMonthYearCap, toDateString, todayString, weekdayName } from '../utils/date';
import { formatNumber, formatWeight, sumVolume } from '../utils/calc';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState, SkeletonCard } from '../components/ui/Feedback';
import { useToast } from '../components/ui/Toast';
import { ConfirmDialog } from '../components/ui/Modal';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { InstallAppButton } from '../components/PwaInstall';
import { ShareAppModal } from '../components/ShareApp';
import { HomeCalendar } from '../components/HomeCalendar';
import { OfflineReadyNotice } from '../components/OfflineReadyNotice';

export function HomePage() {
  const workouts = useLiveQuery(() => workoutsLive(), []);
  const settings = useSettings();
  const { push } = useToast();
  const pwa = usePwaInstall();
  const [sampleOpen, setSampleOpen] = useState(false);
  const [creatingSample, setCreatingSample] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const daysSinceBackup = settings.lastBackupAt ? Math.floor((Date.now() - settings.lastBackupAt) / 86_400_000) : null;

  const stats = useMemo(() => {
    if (!workouts) return null;
    const now = new Date();
    const monthPrefix = todayString().slice(0, 7);
    const monthCount = workouts.filter((w) => w.date.startsWith(monthPrefix)).length;
    const dates = workouts.map((w) => w.date);
    const streak = currentStreak(dates);

    const weekStart = now.getDate() - ((now.getDay() + 6) % 7);
    const weekStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(weekStart).padStart(2, '0')}`;
    const weekVolume = sumVolume(workouts.filter((w) => w.date >= weekStartStr));

    const withEffort = workouts.filter((w) => w.avgEffort != null).slice(0, 5);
    const avgEffort = withEffort.length
      ? withEffort.reduce((a, w) => a + (w.avgEffort ?? 0), 0) / withEffort.length
      : null;

    return {
      lastWorkout: workouts[0],
      monthCount,
      streak,
      weekVolume,
      avgEffort,
      monthLabel: formatMonthYearCap(`${monthPrefix}-01`),
      dates,
    };
  }, [workouts]);

  const improvements = useMemo(() => {
    if (!workouts) return [];
    const perName = new Map<string, { first: number | null; last: number | null }>();
    const sorted = [...workouts].sort((a, b) => a.date.localeCompare(b.date));
    for (const w of sorted) {
      for (const e of w.exercises) {
        const maxW = e.sets.reduce((m, s) => Math.max(m, s.weight ?? 0), 0);
        if (maxW <= 0) continue;
        const cur = perName.get(e.name) ?? { first: null, last: null };
        if (cur.first == null) cur.first = maxW;
        cur.last = maxW;
        perName.set(e.name, cur);
      }
    }
    return [...perName.entries()]
      .map(([name, v]) => ({ name, from: v.first, to: v.last, delta: (v.last ?? 0) - (v.first ?? 0) }))
      .filter((x) => x.delta > 0)
      .sort((a, b) => b.delta - a.delta)
      .slice(0, 3);
  }, [workouts]);

  const records = useMemo(() => (workouts ? computeRecords(workouts).slice(0, 3) : []), [workouts]);

  async function handleSample() {
    setCreatingSample(true);
    try {
      const n = await createSampleData();
      push(`${n} treinos de exemplo criados. Apague quando quiser em Configurações.`, 'success');
    } catch {
      push('Erro ao criar dados de exemplo.', 'error');
    } finally {
      setCreatingSample(false);
      setSampleOpen(false);
    }
  }

  if (!workouts || !stats) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <div className="grid grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  const { lastWorkout, monthCount, streak, weekVolume, avgEffort, monthLabel } = stats;

  if (workouts.length === 0) {
  return (
    <div className="pt-4">
      <OfflineReadyNotice />
      {!pwa.installed && <InstallBanner canInstall={pwa.canInstall} onShare={() => setShareOpen(true)} />}
        <h1 className="mb-1 text-xl font-extrabold text-slate-900 dark:text-white">
          Olá{settings.username ? `, ${settings.username}` : ''} 👋
        </h1>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">Bora começar a registrar seus treinos?</p>
        <EmptyState
          icon={<Dumbbell className="h-7 w-7" />}
          title="Nenhum treino ainda"
          description="Registre seu primeiro treino ou crie dados de exemplo para explorar o app. Tudo fica salvo apenas neste dispositivo."
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link to="/novo">
                <Button size="lg">
                  <Plus className="h-5 w-5" /> Novo treino
                </Button>
              </Link>
              <Button variant="secondary" size="lg" onClick={() => setSampleOpen(true)}>
                <Sparkles className="h-5 w-5" /> Criar dados de exemplo
              </Button>
            </div>
          }
        />
        <ConfirmDialog
          open={sampleOpen}
          onClose={() => setSampleOpen(false)}
          onConfirm={handleSample}
          title="Criar dados de exemplo?"
          message="Serão criados alguns treinos fictícios nas últimas semanas para você explorar o app. Você pode apagar tudo depois em Configurações."
          confirmLabel="Criar"
          loading={creatingSample}
        />
        <ShareAppModal open={shareOpen} onClose={() => setShareOpen(false)} />
      </div>
    );
  }

  return (
    <div>
      <OfflineReadyNotice />
      {!pwa.installed && <InstallBanner canInstall={pwa.canInstall} onShare={() => setShareOpen(true)} />}
      {daysSinceBackup != null && daysSinceBackup >= 14 && (
        <div className="mb-4 flex flex-col gap-2 rounded-3xl border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300 sm:flex-row sm:items-center sm:justify-between">
          <p>
            ⚠️ Seu último backup foi há <b>{daysSinceBackup} dias</b> ({formatDayShort(toDateString(new Date(settings.lastBackupAt ?? Date.now())))}).
          </p>
          <Link to="/configuracoes" className="shrink-0">
            <Button variant="primary" size="sm">
              Fazer backup agora
            </Button>
          </Link>
        </div>
      )}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Olá{settings.username ? `, ${settings.username}` : ''} 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Continue firme nos treinos!</p>
        </div>
        <Link to="/novo">
          <Button size="lg">
            <Plus className="h-5 w-5" /> Novo treino
          </Button>
        </Link>
      </div>

      {/* Último treino */}
      <Link to={`/treino/${lastWorkout.id}`} className="mb-4 block">
        <Card className="group relative overflow-hidden p-5 transition-colors hover:border-amber-300 dark:hover:border-amber-400/50">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">Último treino</p>
              <h2 className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">{lastWorkout.name}</h2>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                {formatDayShort(lastWorkout.date)} · {weekdayName(lastWorkout.date)}
                {lastWorkout.totalVolume > 0 && <> · {formatNumber(lastWorkout.totalVolume)} {settings.unit}</>}
              </p>
            </div>
            <div className="flex items-center gap-1 text-sm font-semibold text-amber-600 dark:text-amber-400">
              Ver detalhes <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        </Card>
      </Link>

      {/* Estatísticas */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={<Calendar className="h-5 w-5" />} label={`Treinos em ${monthLabel}`} value={String(monthCount)} />
        <StatCard icon={<Flame className="h-5 w-5" />} label="Sequência atual" value={streak > 0 ? `🔥 ${streak} dias` : '0 dias'} />
        <StatCard icon={<Dumbbell className="h-5 w-5" />} label="Volume da semana" value={weekVolume > 0 ? `${formatNumber(weekVolume)} ${settings.unit}` : '—'} />
        <StatCard icon={<Activity className="h-5 w-5" />} label="Esforço médio recente" value={avgEffort != null ? `${formatNumber(avgEffort)}/6` : '—'} />
      </div>

      {/* Calendário (design da referência: dias em círculos, treino em dourado) */}
      <div className="mb-4">
        <HomeCalendar workouts={workouts} unit={settings.unit} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Evolução */}
        <Card>
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
              <TrendingUp className="h-5 w-5 text-amber-400" /> Maior evolução
            </h2>
            <Link to="/evolucao" className="flex items-center gap-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
              Ver tudo <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-2 px-5 pb-5">
            {improvements.length === 0 ? (
              <p className="py-4 text-sm text-slate-500 dark:text-slate-400">
                Registre alguns treinos para ver aqui os exercícios que mais evoluíram.
              </p>
            ) : (
              improvements.map((im) => (
                <div key={im.name} className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 dark:bg-slate-800/60">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{im.name}</span>
                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                    {im.from != null ? formatWeight(im.from, settings.unit) : '—'} → {im.to != null ? formatWeight(im.to, settings.unit) : '—'}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recordes */}
        <Card>
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
              <Trophy className="h-5 w-5 text-amber-400" /> Recordes
            </h2>
            <Link to="/evolucao" className="flex items-center gap-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
              Ver todos <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-2 px-5 pb-5">
            {records.length === 0 ? (
              <p className="py-4 text-sm text-slate-500 dark:text-slate-400">
                Bata seus próprios recordes — eles aparecem aqui automaticamente.
              </p>
            ) : (
              records.map((r) => (
                <div key={r.key} className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 dark:bg-slate-800/60">
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {r.sublabel ? `${r.sublabel} — ` : ''}
                      {r.label}
                    </p>
                    {r.date && <p className="text-xs text-slate-400">{formatDayShort(r.date)}</p>}
                  </div>
                  <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400">
                    {r.unit === 'kg' ? formatWeight(r.value, settings.unit) : `${formatNumber(r.value)} ${r.unit === 'dias' ? 'dias' : 'reps'}`}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={sampleOpen}
        onClose={() => setSampleOpen(false)}
        onConfirm={handleSample}
        title="Criar dados de exemplo?"
        message="Serão adicionados treinos fictícios nas últimas semanas. Você pode apagar tudo depois em Configurações."
        confirmLabel="Criar"
        loading={creatingSample}
      />

      <ShareAppModal open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}

function InstallBanner({ canInstall, onShare }: { canInstall: boolean; onShare: () => void }) {
  return (
    <div className="mb-4 flex flex-col gap-2 rounded-3xl border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-center gap-2 font-semibold">
        <Smartphone className="h-4 w-4 shrink-0" />
        {canInstall
          ? '⚡ Instale o app: abre como aplicativo e funciona 100% offline.'
          : 'Leve o RepFit para o celular: escaneie o QR code ou compartilhe o link.'}
      </p>
      <div className="flex shrink-0 flex-wrap gap-2">
        {canInstall && <InstallAppButton size="sm" label="Instalar app" />}
        <Button variant="secondary" size="sm" onClick={onShare}>
          <Share2 className="h-4 w-4" /> Compartilhar / QR code
        </Button>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400">
        {icon}
      </div>
      <div className="mt-3 text-xl font-extrabold text-slate-900 dark:text-white">{value}</div>
      <div className="mt-0.5 text-xs font-medium leading-snug text-slate-500 dark:text-slate-400">{label}</div>
    </Card>
  );
}
