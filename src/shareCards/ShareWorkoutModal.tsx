import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Check, Download, Loader2, Share2, X } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { cn } from '../utils/misc';
import { selectWorkoutShareData } from './selectWorkoutShareData';
import { exportShareCard, exportShareCardFallback } from './exportShareCard';
import { downloadBlob, shareImage } from './shareImage';
import { shareFileName } from './formatShareStats';
import { ShareCardCanvas } from './ShareCardCanvas';
import { SHARE_FORMATS, getFormat } from './types';
import type { ShareCardData, ShareFormatId, ShareTemplateId } from './types';

const TEMPLATES: { id: ShareTemplateId; label: string; hint: string }[] = [
  { id: 'completed', label: 'Treino concluído', hint: 'Resumo do treino com métricas e lista de exercícios.' },
  { id: 'record', label: 'Novo recorde', hint: 'Destaque do recorde batido neste treino.' },
  { id: 'evolution', label: 'Minha evolução', hint: 'Histórico do exercício que mais evoluiu.' },
];

interface ShareWorkoutModalProps {
  open: boolean;
  onClose: () => void;
  workoutId: number;
  /** Data do treino (YYYY-MM-DD) — usada no nome do arquivo PNG. */
  workoutDate: string;
}

/**
 * Modal de compartilhamento: prévia fiel ao PNG + Salvar imagem /
 * Compartilhar / Fechar. O card é 100% local (IndexedDB → JSX → PNG).
 */
export function ShareWorkoutModal({ open, onClose, workoutId, workoutDate }: ShareWorkoutModalProps) {
  const { push } = useToast();
  const [data, setData] = useState<ShareCardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [template, setTemplate] = useState<ShareTemplateId>('completed');
  const [formatId, setFormatId] = useState<ShareFormatId>('feed');
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);

  const format = getFormat(formatId);
  const canvasRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(0.25);

  // Carrega os dados reais do treino (IndexedDB) ao abrir.
  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    setError(null);
    setDone(false);
    selectWorkoutShareData(workoutId)
      .then((d) => {
        if (!alive) return;
        if (!d) {
          setError('Treino não encontrado.');
        } else {
          setData(d);
        }
      })
      .catch(() => {
        if (alive) setError('Não foi possível carregar o treino.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [open, workoutId]);

  // Escala da prévia: cabe na largura e na altura disponíveis.
  useLayoutEffect(() => {
    if (!open) return;
    const el = previewRef.current;
    if (!el) return;
    const fit = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const s = Math.min(rect.width / format.width, rect.height / format.height, 0.6);
      setPreviewScale(Math.max(0.08, s));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, format.width, format.height, formatId]);

  const recordDisabled = !data?.record;

  async function handleExport(mode: 'save' | 'share') {
    const node = canvasRef.current;
    if (!node || !data || exporting) return;
    setExporting(true);
    setError(null);
    setDone(false);
    try {
      let blob: Blob;
      try {
        blob = await exportShareCard(node);
      } catch {
        // Fallback Canvas 2D — nunca deixa o usuário sem a imagem.
        blob = await exportShareCardFallback(data, format, template);
      }
      const filename = shareFileName(data.workoutName, workoutDate || new Date().toISOString().slice(0, 10));
      if (mode === 'save') {
        downloadBlob(blob, filename);
        setDone(true);
        push('Imagem do treino salva! 📸', 'success');
      } else {
        const result = await shareImage(blob, filename);
        if (result === 'downloaded') {
          setDone(true);
          push('Baixando a imagem para você compartilhar…', 'info');
        } else if (result === 'shared') {
          setDone(true);
        }
      }
    } catch {
      setError('Não foi possível gerar a imagem. Tente novamente.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Compartilhar treino" size="lg">
      <div className="space-y-4">
        {/* Template */}
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Modelo</p>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t) => {
              const disabled = t.id === 'record' && recordDisabled;
              const active = template === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={disabled}
                  title={disabled ? 'Nenhum recorde neste treino' : t.hint}
                  onClick={() => setTemplate(t.id)}
                  className={cn(
                    'rounded-full px-3.5 py-2 text-sm font-semibold transition-all duration-150',
                    'disabled:cursor-not-allowed disabled:opacity-45',
                    active
                      ? 'bg-amber-400 text-black shadow-[0_4px_12px_rgba(245,197,24,0.28)] -translate-y-0.5 motion-reduce:translate-y-0 motion-reduce:shadow-none'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-[#26262b] dark:text-slate-300 dark:hover:bg-slate-700'
                  )}
                >
                  {t.label}
                  {disabled && <span className="ml-1.5 text-xs font-medium opacity-70">· sem recorde</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Formato */}
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Formato</p>
          <div className="flex flex-wrap gap-2">
            {SHARE_FORMATS.map((f) => {
              const active = f.id === formatId;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormatId(f.id)}
                  className={cn(
                    'rounded-full px-3.5 py-2 text-sm font-semibold transition-all duration-150',
                    active
                      ? 'bg-amber-400 text-black shadow-[0_4px_12px_rgba(245,197,24,0.28)] -translate-y-0.5 motion-reduce:translate-y-0 motion-reduce:shadow-none'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-[#26262b] dark:text-slate-300 dark:hover:bg-slate-700'
                  )}
                >
                  {f.label}
                  <span className="ml-1 text-xs font-medium opacity-70">{f.width}×{f.height}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Prévia */}
        <div
          ref={previewRef}
          className="flex h-[420px] items-center justify-center overflow-hidden rounded-2xl bg-slate-200/60 p-3 dark:bg-black/50"
        >
          {loading ? (
            <div className="flex flex-col items-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin" />
              Carregando treino…
            </div>
          ) : error ? (
            <div className="text-center text-sm text-rose-500">{error}</div>
          ) : data ? (
            <ShareCardCanvas ref={canvasRef} data={data} template={template} format={format} scale={previewScale} />
          ) : null}
        </div>

        {error && <p className="text-sm text-rose-500">{error}</p>}

        {/* Ações */}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose} disabled={exporting}>
            <X className="h-4 w-4" /> Fechar
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleExport('share')}
            disabled={!data || exporting || Boolean(error)}
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
            Compartilhar
          </Button>
          <Button onClick={() => handleExport('save')} disabled={!data || exporting || Boolean(error)}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : done ? <Check className="h-4 w-4" /> : <Download className="h-4 w-4" />}
            {exporting ? 'Gerando imagem…' : done ? 'Imagem salva!' : 'Salvar imagem'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
