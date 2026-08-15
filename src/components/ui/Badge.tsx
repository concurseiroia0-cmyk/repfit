import { typeColor } from '../../utils/constants';
import { cn } from '../../utils/misc';

export type WorkoutMode = 'academia' | 'calistenia' | 'cardio';

export function TypeBadge({ type, className }: { type: string; className?: string }) {
  const c = typeColor(type);
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold', c.badge, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', c.dot)} aria-hidden="true" />
      {type}
    </span>
  );
}

/** Selo da modalidade do treino (academia, calistenia ou cardio). */
export function ModeBadge({ mode, className }: { mode: WorkoutMode; className?: string }) {
  const style =
    mode === 'academia'
      ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300'
      : mode === 'cardio'
        ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300';
  const label = mode === 'academia' ? 'Academia' : mode === 'cardio' ? 'Cardio' : 'Calistenia';
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold', style, className)}>
      {label}
    </span>
  );
}

export function Dot({ type, className }: { type: string; className?: string }) {
  return <span className={cn('inline-block h-2 w-2 rounded-full', typeColor(type).dot, className)} aria-hidden="true" />;
}
