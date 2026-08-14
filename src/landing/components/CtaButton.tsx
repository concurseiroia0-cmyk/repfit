import { cn } from '../../utils/misc';

/** Botão de conversão da landing — amarelo do app, alto e fácil de tocar. */
export function CtaButton({ className, onClick }: { className?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-6 text-lg font-black tracking-wide text-black',
        'shadow-[0_10px_30px_rgba(245,197,24,0.45)] transition-all duration-150',
        'hover:-translate-y-0.5 hover:bg-amber-300 active:translate-y-0 active:bg-amber-500',
        'motion-reduce:translate-y-0 motion-reduce:shadow-[0_4px_12px_rgba(245,197,24,0.3)]',
        className
      )}
    >
      ASSINAR AGORA
    </button>
  );
}
