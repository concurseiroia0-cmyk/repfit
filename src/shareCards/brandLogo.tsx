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
      <line x1="10" y1="32" x2="54" y2="32" stroke={ACCENT} strokeWidth="6" strokeLinecap="round" />
      <rect x="3" y="21" width="8" height="22" rx="2.5" fill={ACCENT} />
      <rect x="53" y="21" width="8" height="22" rx="2.5" fill={ACCENT} />
      <rect x="13" y="24" width="6" height="16" rx="2" fill="#d9a505" />
      <rect x="45" y="24" width="6" height="16" rx="2" fill="#d9a505" />
    </svg>
  );
}
