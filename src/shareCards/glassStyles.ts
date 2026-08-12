/**
 * Paleta e estilos do card "vidro" — SEM backdrop-filter.
 * O vidro é simulado com camadas: fundo escuro + manchas amarelas já
 * desfocadas + overlays rgba + borda clara + highlight interno.
 * Assim a prévia na tela é EXATAMENTE igual ao PNG exportado.
 */
import type { CSSProperties } from 'react';

export const CARD_BG = '#0B0B0B';
export const GLASS = 'rgba(255,255,255,0.07)';
export const GLASS_STRONG = 'rgba(255,255,255,0.10)';
export const GLASS_BORDER = 'rgba(255,255,255,0.16)';
export const HIGHLIGHT = 'rgba(255,255,255,0.08)';
export const ACCENT = '#F5C518';
export const TEXT = '#FFFFFF';
export const SUB = '#C9C9C9';

export const FONT = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, system-ui, sans-serif";

export const GLASS_PANEL: CSSProperties = {
  background: GLASS,
  border: `1px solid ${GLASS_BORDER}`,
  borderRadius: 22,
  boxShadow: `inset 0 1px 0 ${HIGHLIGHT}, 0 10px 30px rgba(0,0,0,0.25)`,
};

export const PILL_YELLOW: CSSProperties = {
  background: ACCENT,
  color: '#0B0B0B',
  borderRadius: 999,
  fontWeight: 800,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
};

/** Sobreposição de luz no topo do card (reforça o efeito de vidro). */
export const TOP_GLOW: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0) 32%)',
  pointerEvents: 'none',
};

/** Números grandes com alinhamento tabular (nunca "pulam" ao mudar). */
export const TABULAR = { fontVariantNumeric: 'tabular-nums' as const };

/** Clamp de texto em no máximo N linhas. */
export function clampLines(lines: number): CSSProperties {
  return {
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  };
}
