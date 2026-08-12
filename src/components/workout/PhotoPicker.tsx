import { useRef, useState } from 'react';
import { Camera, Maximize2, Trash2 } from 'lucide-react';
import { usePhotoUrl } from '../../hooks/usePhotoUrl';
import { addPhoto, deletePhoto } from '../../services/photoService';
import { useToast } from '../ui/Toast';
import { Modal } from '../ui/Modal';

/**
 * Foto do treino: salva como Blob no IndexedDB (nunca base64 em localStorage,
 * nunca upload). Comprime antes de salvar (máx ~1600px).
 */
export function PhotoPicker({
  photoId,
  workoutId,
  onChange,
}: {
  photoId: string | null;
  /** Dono da foto: 'draft' enquanto o treino não foi salvo, ou o id do treino. */
  workoutId: string;
  onChange: (id: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [busy, setBusy] = useState(false);
  const url = usePhotoUrl(photoId);
  const { push } = useToast();

  async function handleFile(file: File | undefined | null) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      push('Escolha um arquivo de imagem.', 'error');
      return;
    }
    setBusy(true);
    try {
      const photo = await addPhoto(workoutId, file);
      onChange(String(photo.id));
      push('Foto adicionada.');
    } catch {
      push('Não foi possível salvar a foto.', 'error');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleRemove() {
    if (!photoId) return;
    try {
      await deletePhoto(Number(photoId));
      onChange(null);
      push('Foto removida.');
    } catch {
      push('Não foi possível remover a foto.', 'error');
    }
  }

  if (!url) {
    return (
      <>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 py-5 text-sm font-semibold text-slate-500 transition-colors hover:border-amber-400 hover:text-amber-600 disabled:opacity-60 dark:border-white/15 dark:text-slate-400 dark:hover:border-amber-400 dark:hover:text-amber-400"
        >
          <Camera className="h-5 w-5" />
          {busy ? 'Processando…' : '📷 Adicionar foto'}
        </button>
      </>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/15">
      <div className="relative">
        <button type="button" onClick={() => setFullscreen(true)} className="block w-full" aria-label="Ver foto em tela cheia">
          <img src={url} alt="Foto do treino" className="h-44 w-full object-cover" />
        </button>
        <div className="absolute right-2 top-2 flex gap-1.5">
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            aria-label="Ver em tela cheia"
            className="rounded-lg bg-slate-950/60 p-2 text-white backdrop-blur hover:bg-slate-950/80"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleRemove}
            aria-label="Remover foto"
            className="rounded-lg bg-rose-600/80 p-2 text-white backdrop-blur hover:bg-rose-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <Modal open={fullscreen} onClose={() => setFullscreen(false)} title="Foto do treino" size="lg">
        <img src={url} alt="Foto do treino em tela cheia" className="mx-auto max-h-[70vh] rounded-xl object-contain" />
      </Modal>
    </div>
  );
}
