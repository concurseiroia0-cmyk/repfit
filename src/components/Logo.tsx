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
        className={cn('flex items-center justify-center overflow-hidden bg-[#e2b31a]', base)}
      >
        <svg viewBox="0 0 64 64" className="h-[72%] w-[72%]" aria-hidden="true">
          <g fill="#222222">
            <rect x="9.5" y="22" width="3.4" height="20" rx="1.7" transform="rotate(8 11.2 32)" />
            <rect x="18" y="17" width="4.4" height="30" rx="2.2" transform="rotate(8 20.2 32)" />
            <circle cx="30.4" cy="32" r="3.1" />
            <circle cx="33.6" cy="32" r="3.1" />
            <rect x="41.6" y="17" width="4.4" height="30" rx="2.2" transform="rotate(-8 43.8 32)" />
            <rect x="51.1" y="22" width="3.4" height="20" rx="1.7" transform="rotate(-8 52.8 32)" />
          </g>
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
