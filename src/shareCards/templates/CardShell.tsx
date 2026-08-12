import type { CSSProperties, ReactNode } from 'react';
import { ACCENT, CARD_BG, FONT, SUB, TOP_GLOW } from '../glassStyles';
import type { ShareFormat } from '../types';
import { monogram } from '../formatShareStats';

export function Barbell({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <line x1="10" y1="32" x2="54" y2="32" stroke={ACCENT} strokeWidth="6" strokeLinecap="round" />
      <rect x="3" y="21" width="8" height="22" rx="2.5" fill={ACCENT} />
      <rect x="53" y="21" width="8" height="22" rx="2.5" fill={ACCENT} />
      <rect x="13" y="24" width="6" height="16" rx="2" fill="#d9a505" />
      <rect x="45" y="24" width="6" height="16" rx="2" fill="#d9a505" />
    </svg>
  );
}

/** Avatar: monograma em círculo amarelo (o app ainda não tem foto de perfil). */
export function Avatar({ name, size = 92 }: { name: string; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: ACCENT,
        color: '#0B0B0B',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.44,
        fontWeight: 900,
        flexShrink: 0,
      }}
    >
      {monogram(name)}
    </div>
  );
}

export function BrandFooter({ tagline = true }: { tagline?: boolean }) {
  return (
    <div
      style={{
        padding: '34px 52px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
      }}
    >
      <Barbell size={34} />
      <span style={{ fontSize: 27, fontWeight: 800, letterSpacing: '0.02em', color: '#fff' }}>RepFit</span>
      {tagline && <span style={{ fontSize: 21, color: SUB, marginLeft: 6 }}>— seus dados, só seus</span>}
    </div>
  );
}

interface CardShellProps {
  format: ShareFormat;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Palco do card: fundo preto profundo + manchas amarelas JÁ desfocadas
 * (filter: blur — funciona no PNG) + brilho de topo. Nenhum backdrop-filter.
 */
export function CardShell({ format, children, footer }: CardShellProps) {
  const tall = format.height >= 1700;
  const compact = format.height <= 1200;
  const pad = compact ? 40 : tall ? 64 : 52;

  return (
    <div
      style={{
        width: format.width,
        height: format.height,
        background: CARD_BG,
        borderRadius: 32,
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: FONT,
        color: '#fff',
      }}
    >
      {/* Manchas amarelas desfocadas — simulam o fundo "vidro" sem backdrop-filter */}
      <div
        style={{
          position: 'absolute',
          top: -180,
          left: -140,
          width: 540,
          height: 540,
          borderRadius: '50%',
          background: ACCENT,
          opacity: 0.1,
          filter: 'blur(110px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -220,
          right: -160,
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: ACCENT,
          opacity: 0.07,
          filter: 'blur(130px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '40%',
          right: -170,
          width: 420,
          height: 420,
          borderRadius: '50%',
          background: ACCENT,
          opacity: 0.05,
          filter: 'blur(100px)',
        }}
      />
      <div style={TOP_GLOW as CSSProperties} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: pad, position: 'relative' }}>
        {children}
      </div>
      {footer ?? <BrandFooter />}
    </div>
  );
}
