import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { cn } from '../utils/misc';

/**
 * Gera um QR code (SVG→dataURL) para o endereço informado.
 * Cores fixas de alto contraste (escuro sobre branco) para escanear bem em qualquer tema.
 */
export function QrCode({ value, size = 200, className }: { value: string; size?: number; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#0a0a0b', light: '#ffffff' },
    })
      .then((u) => {
        if (alive) setUrl(u);
      })
      .catch(() => setUrl(null));
    return () => {
      alive = false;
    };
  }, [value, size]);

  if (!url) {
    return <div className={cn('animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800', className)} style={{ width: size, height: size }} />;
  }

  return (
    <img
      src={url}
      width={size}
      height={size}
      alt={`QR code para abrir o RepFit: ${value}`}
      className={cn('h-auto rounded-xl', className)}
      style={{ maxWidth: size }}
    />
  );
}
