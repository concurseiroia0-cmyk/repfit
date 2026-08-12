import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/misc';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800', className)} />;
}

export function SkeletonCard() {
  return (
    <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#161616]">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center dark:border-white/15 dark:bg-[#161616]/40',
        className
      )}
    >
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-3xl bg-amber-100 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400">
        {icon}
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-rose-200 bg-rose-50 px-6 py-10 text-center dark:border-rose-500/30 dark:bg-rose-500/10">
      <AlertTriangle className="mb-3 h-8 w-8 text-rose-500" />
      <h3 className="text-base font-bold text-rose-700 dark:text-rose-300">Algo deu errado</h3>
      <p className="mt-1 text-sm text-rose-600/80 dark:text-rose-300/80">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">
          Tentar novamente
        </button>
      )}
    </div>
  );
}
