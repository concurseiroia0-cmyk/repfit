import { typeColor } from '../../utils/constants';
import { cn } from '../../utils/misc';

export function TypeBadge({ type, className }: { type: string; className?: string }) {
  const c = typeColor(type);
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold', c.badge, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', c.dot)} aria-hidden="true" />
      {type}
    </span>
  );
}

export function Dot({ type, className }: { type: string; className?: string }) {
  return <span className={cn('inline-block h-2 w-2 rounded-full', typeColor(type).dot, className)} aria-hidden="true" />;
}
