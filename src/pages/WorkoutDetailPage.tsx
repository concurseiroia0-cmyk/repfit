import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Activity,
  ArrowLeft,
  Dumbbell,
  Flame,
  Hourglass,
  ListChecks,
  Pencil,
  Repeat,
  Share2,
  Timer,
  Trash2,
} from 'lucide-react';
import { getWorkout, deleteWorkout } from '../services/workoutService';
import { useSettings } from '../services/settingsService';
import { usePhotoUrl } from '../hooks/usePhotoUrl';
import { effortLevel } from '../utils/constants';
import { formatDate, formatDayShort, weekdayName } from '../utils/date';
import { exerciseVolume, formatDurationShort, formatNumber, formatWeight, pluralize } from '../utils/calc';
import { ModeBadge, TypeBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/Modal';
import { EmptyState, SkeletonCard } from '../components/ui/Feedback';
import { useToast } from '../components/ui/Toast';
import { Modal } from '../components/ui/Modal';
import { ShareWorkoutModal } from '../shareCards/ShareWorkoutModal';

export function WorkoutDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { push } = useToast();
  const settings = useSettings();

  const workout = useLiveQuery(
    () => (id ? getWorkout(Number(id)).then((w) => w ?? null) : Promise.resolve(null)),
    [id],
    undefined
  );

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const photoUrl = usePhotoUrl(workout?.photoId ?? null);

  async function handleDelete() {
    if (!workout?.id) return;
    setDeleting(true);
    try {
      await deleteWorkout(workout.id);
      push('Treino excluído.', 'info');
      navigate('/historico');
    } catch {
      push('Erro ao excluir o treino.', 'error');
      setDeleting(false);
    }
  }

  if (workout === undefined) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (workout === null) {
    return (
      <EmptyState
        icon={<Dumbbell className="h-7 w-7" />}
        title="Treino não encontrado"
        description="Ele pode ter sido excluído."
        action={
          <Link to="/historico">
            <Button variant="secondary">Voltar ao histórico</Button>
          </Link>
        }
      />
    );
  }

  const effort = effortLevel(workout.avgEffort);

  return (
    <div>
      <Link
        to="/historico"
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400"
      >
        <ArrowLeft className="h-4 w-4" /> Histórico
      </Link>

      {/* Cabeçalho */}
      <Card className="mb-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          {workout.type && <TypeBadge type={workout.type} />}
          {workout.mode && <ModeBadge mode={workout.mode} />}
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {formatDayShort(workout.date)} · {weekdayName(workout.date)}
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{workout.name}</h1>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <Meta icon={<ListChecks className="h-4 w-4" />} label="Exercícios" value={pluralize(workout.exercises.length, 'exercício', 'exercícios')} />
          <Meta icon={<Dumbbell className="h-4 w-4" />} label="Volume total" value={workout.totalVolume > 0 ? `${formatNumber(workout.totalVolume)} ${settings.unit}` : '—'} />
          <Meta icon={<Activity className="h-4 w-4" />} label="Esforço médio" value={effort ? `${formatNumber(workout.avgEffort!)}/6 · ${effort.label}` : '—'} />
          <Meta icon={<Timer className="h-4 w-4" />} label="Duração" value={workout.durationMin != null ? `${workout.durationMin} min` : '—'} />
          <Meta
            icon={<Hourglass className="h-4 w-4" />}
            label="Descanso total"
            value={workout.restSec ? formatDurationShort(workout.restSec) : '—'}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link to={`/editar/${workout.id}`}>
            <Button variant="secondary" size="sm">
              <Pencil className="h-4 w-4" /> Editar
            </Button>
          </Link>
          <Link to={`/novo?repetir=${workout.id}`}>
            <Button variant="secondary" size="sm">
              <Repeat className="h-4 w-4" /> Repetir treino
            </Button>
          </Link>
          <Button variant="primary" size="sm" onClick={() => setShareOpen(true)}>
            <Share2 className="h-4 w-4" /> Compartilhar treino
          </Button>
          <Button variant="ghost" size="sm" className="text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10" onClick={() => setConfirmOpen(true)}>
            <Trash2 className="h-4 w-4" /> Excluir
          </Button>
        </div>
      </Card>

      {/* Foto */}
      {photoUrl && (
        <Card className="mb-4 overflow-hidden">
          <button type="button" onClick={() => setFullscreen(true)} className="block w-full" aria-label="Ver foto em tela cheia">
            <img src={photoUrl} alt={`Foto do treino ${workout.name}`} className="max-h-80 w-full object-cover" />
          </button>
        </Card>
      )}

      {/* Observação geral */}
      {workout.notes && (
        <Card className="mb-4 p-5">
          <h2 className="mb-1 text-sm font-bold text-slate-900 dark:text-white">Observação</h2>
          <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{workout.notes}</p>
        </Card>
      )}

      {/* Exercícios */}
      <div className="space-y-3">
        {workout.exercises.map((ex, i) => {
          const exEffort = effortLevel(ex.effort);
          const vol = exerciseVolume(ex);
          return (
            <Card key={ex.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-sm font-extrabold text-amber-700 dark:bg-amber-400/15 dark:text-amber-400">
                    {i + 1}
                  </span>
                  <h3 className="font-bold text-slate-900 dark:text-white">{ex.name}</h3>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
                  {vol > 0 && <span>{formatNumber(vol)} {settings.unit}</span>}
                  {exEffort && (
                    <span
                      className="rounded-full px-2 py-0.5 text-white"
                      style={{ backgroundColor: exEffort.color }}
                      title={`${exEffort.value} — ${exEffort.label} (${exEffort.desc})`}
                    >
                      {exEffort.value}/6
                    </span>
                  )}
                </div>
              </div>
              {ex.sets.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {ex.sets.map((s, si) => (
                    <li key={s.id} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {si + 1}ª · {s.weight != null ? formatWeight(s.weight, settings.unit) : '—'} × {s.reps ?? '—'}
                    </li>
                  ))}
                </ul>
              )}
              {ex.notes && <p className="mt-2 text-xs italic text-slate-500 dark:text-slate-400">{ex.notes}</p>}
            </Card>
          );
        })}
      </div>

      {/* Rodapé */}
      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
        <Flame className="h-3.5 w-3.5" /> Registrado em {formatDate(workout.date)}
      </p>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Excluir treino?"
        message={`Tem certeza que deseja excluir "${workout.name}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        danger
        loading={deleting}
      />

      <Modal open={fullscreen} onClose={() => setFullscreen(false)} title="Foto do treino" size="lg">
        <img src={photoUrl ?? undefined} alt={`Foto do treino ${workout.name}`} className="mx-auto max-h-[70vh] rounded-xl object-contain" />
      </Modal>

      {workout.id != null && (
        <ShareWorkoutModal open={shareOpen} onClose={() => setShareOpen(false)} workoutId={workout.id} workoutDate={workout.date} />
      )}
    </div>
  );
}

function Meta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">{value}</div>
    </div>
  );
}
