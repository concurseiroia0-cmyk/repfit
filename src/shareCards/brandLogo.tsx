import { ACCENT } from './glassStyles';

const BASE = import.meta.env.BASE_URL;

/**
 * Resolve a logo da marca para um dataURL antes da exportação — assim o PNG
 * nunca depende de rede/cache. Prioriza `brand-logo.png` (logo de alta
 * qualidade que pode ser adicionada depois) e cai para `icon-192.png`
 * (logo atual do app). Retorna null apenas se nenhuma existir.
 */
export async function resolveBrandLogo(): Promise<string | null> {
  const candidates = [`${BASE}brand-logo.png`, `${BASE}icon-192.png`];
  for (const src of candidates) {
    try {
      const res = await fetch(src, { cache: 'no-cache' });
      if (!res.ok) continue;
      // Garante que é uma imagem de verdade (alguns servidores devolvem o
      // index.html com 200 para arquivos inexistentes).
      const type = res.headers.get('content-type') ?? '';
      if (!type.startsWith('image/')) continue;
      const blob = await res.blob();
      if (!blob || blob.size < 100) continue;
      const url = await blobToDataURL(blob);
      if (url) return url;
    } catch {
      /* tenta o próximo */
    }
  }
  return null;
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('read-failed'));
    reader.readAsDataURL(blob);
  });
}

/** Marca discreta: logo PNG (se houver) ou barbell dourado como placeholder. */
export function BrandMark({ logoUrl, size = 30 }: { logoUrl: string | null; size?: number }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt="RepFit"
        style={{
          height: size + 12,
          width: size + 12,
          objectFit: 'contain',
          borderRadius: (size + 12) * 0.24,
          display: 'block',
        }}
      />
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill={ACCENT} />
      <g fill="#222222">
        <rect x="9.5" y="22" width="3.4" height="20" rx="1.7" transform="rotate(8 11.2 32)" />
        <rect x="18" y="17" width="4.4" height="30" rx="2.2" transform="rotate(8 20.2 32)" />
        <circle cx="30.4" cy="32" r="3.1" />
        <circle cx="33.6" cy="32" r="3.1" />
        <rect x="41.6" y="17" width="4.4" height="30" rx="2.2" transform="rotate(-8 43.8 32)" />
        <rect x="51.1" y="22" width="3.4" height="20" rx="1.7" transform="rotate(-8 52.8 32)" />
      </g>
    </svg>
  );
}
