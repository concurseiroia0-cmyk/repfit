import { Star } from 'lucide-react';
import { cn } from '../../utils/misc';

/** Estrelas de avaliação com suporte a meia estrela. */
export function Stars({ value, size = 'h-4 w-4' }: { value: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} de 5 estrelas`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <span key={i} className="relative inline-block">
            <Star className={cn(size, 'text-amber-300')} fill="currentColor" strokeWidth={0} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className={cn(size, 'text-amber-400')} fill="currentColor" strokeWidth={0} />
            </span>
          </span>
        );
      })}
    </div>
  );
}
