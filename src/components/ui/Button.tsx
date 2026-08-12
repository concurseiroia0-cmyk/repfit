import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/misc';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-amber-400 text-black hover:bg-amber-300 active:bg-amber-500 shadow-[0_4px_20px_rgba(251,191,36,0.35)] disabled:bg-amber-400/60',
  secondary:
    'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-white/20 dark:hover:bg-slate-700',
  ghost:
    'text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm',
};

/** Elevação sutil ao passar o mouse (desktop); respeita prefers-reduced-motion. */
const LIFT =
  'enabled:hover:-translate-y-0.5 active:translate-y-0 motion-reduce:translate-y-0 transition-all duration-150';

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  full = false,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold select-none',
        'disabled:cursor-not-allowed disabled:opacity-60',
        LIFT,
        VARIANTS[variant],
        SIZES[size],
        full && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
