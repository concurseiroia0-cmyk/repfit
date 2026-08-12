import { useState } from 'react';
import { cn } from '../utils/misc';

/**
 * Logo do RepFit.
 * Usa o PNG oficial (icon-192.png, caminho sensível à base de deploy) e, se a
 * imagem não carregar por qualquer motivo (cache antigo do service worker,
 * arquivo ausente, offline antes do primeiro cache), troca por um barbell
 * dourado em SVG embutido — assim a logo NUNCA some da tela.
 */
export function Logo({ className }: { className?: string }) {
  const [failed, setFailed] = useState(false);
  const base = cn('shrink-0', className);

  if (failed) {
    return (
      <span
        role="img"
        aria-label="Logo do RepFit"
        className={cn('flex items-center justify-center overflow-hidden bg-[#0a0a0b]', base)}
      >
        <svg viewBox="0 0 64 64" className="h-[72%] w-[72%]" aria-hidden="true">
          {/* barra */}
          <line x1="10" y1="32" x2="54" y2="32" stroke="#F5C518" strokeWidth="5" strokeLinecap="round" />
          {/* anilhas externas */}
          <rect x="3" y="21" width="8" height="22" rx="2.5" fill="#F5C518" />
          <rect x="53" y="21" width="8" height="22" rx="2.5" fill="#F5C518" />
          {/* anilhas internas */}
          <rect x="13" y="24" width="6" height="16" rx="2" fill="#d9a505" />
          <rect x="45" y="24" width="6" height="16" rx="2" fill="#d9a505" />
        </svg>
      </span>
    );
  }

  return (
    <img
      src={`${import.meta.env.BASE_URL}icon-192.png`}
      alt="Logo do RepFit"
      onError={() => setFailed(true)}
      className={base}
    />
  );
}
