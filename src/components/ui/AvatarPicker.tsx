import { useState } from 'react';
import { Camera, Image as ImageIcon, Trash2, UserRound } from 'lucide-react';
import { cn } from '../../utils/misc';
import { pickAvatar } from '../../utils/avatar';

/**
 * Seletor de foto de perfil: prévia circular + câmera/galeria/remover.
 * A foto é comprimida para 256×256 JPEG (dataURL) — poucos KB no dispositivo.
 */
export function AvatarPicker({
  value,
  onChange,
  size = 96,
  className,
}: {
  /** DataURL da foto atual (ou null). */
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  size?: number;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function pick(capture: boolean) {
    setBusy(true);
    try {
      const url = await pickAvatar(capture);
      if (url) onChange(url);
    } finally {
      setBusy(false);
    }
  }

  const btn =
    'inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 ' +
    'transition-colors hover:border-amber-400 hover:text-amber-600 disabled:opacity-60 ' +
    'dark:border-white/20 dark:text-slate-300 dark:hover:border-amber-400 dark:hover:text-amber-400';

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        {value ? (
          <img
            src={value}
            alt="Sua foto de perfil"
            className="h-full w-full rounded-full object-cover ring-2 ring-amber-400/70"
            style={{ width: size, height: size }}
          />
        ) : (
          <div
            className="flex items-center justify-center rounded-full bg-amber-100 text-amber-600 ring-2 ring-amber-400/50 dark:bg-amber-400/15 dark:text-amber-400"
            style={{ width: size, height: size }}
          >
            <UserRound style={{ width: size * 0.45, height: size * 0.45 }} aria-hidden="true" />
          </div>
        )}
        {busy && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-[10px] font-bold text-white">
            …
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button type="button" onClick={() => void pick(true)} disabled={busy} className={btn}>
          <Camera className="h-3.5 w-3.5" /> Câmera
        </button>
        <button type="button" onClick={() => void pick(false)} disabled={busy} className={btn}>
          <ImageIcon className="h-3.5 w-3.5" /> Galeria
        </button>
        {value && (
          <button type="button" onClick={() => onChange(null)} disabled={busy} className={btn} aria-label="Remover foto">
            <Trash2 className="h-3.5 w-3.5" /> Remover
          </button>
        )}
      </div>
    </div>
  );
}
