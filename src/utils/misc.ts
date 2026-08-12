/** Gera um id único (usa crypto.randomUUID quando disponível). */
export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Junta classes condicionais. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/**
 * Estado ativo (aba, chip, filtro, navegação): fundo amarelo, texto escuro e
 * leve elevação (translateY + sombra suave). Com prefers-reduced-motion,
 * apenas a cor muda, sem elevação.
 */
export const ACTIVE_PILL =
  'bg-amber-400 text-black shadow-[0_4px_12px_rgba(245,197,24,0.28)] -translate-y-0.5 transition-all duration-150 motion-reduce:translate-y-0 motion-reduce:shadow-none';

