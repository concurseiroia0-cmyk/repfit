import { Fragment, memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PointerEvent as RPointerEvent } from 'react';
import {
  Camera,
  Check,
  ChevronLeft,
  Download,
  Image as ImageIcon,
  Loader2,
  Plus,
  RefreshCcw,
  Share2,
  SlidersHorizontal,
  Sparkles,
  X,
  ZoomIn,
} from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { cn } from '../utils/misc';
import { Logo } from '../components/Logo';
import { selectWorkoutShareData } from './selectWorkoutShareData';
import { exportShareCard, exportShareCardFallback } from './exportShareCard';
import { downloadBlob, shareImage } from './shareImage';
import { shareFileName } from './formatShareStats';
import { ShareCardCanvas } from './ShareCardCanvas';
import { PhotoLayer } from './templates/shared';
import { clampNum, maxPan, pickPhotoFile, processPhotoFile, workoutPhotoToSharePhoto } from './photo';
import { resolveBrandLogo } from './brandLogo';
import { DEFAULT_CUSTOMIZATION, getFormat, SHARE_FORMATS, SHARE_TEMPLATES } from './types';
import type {
  ShareCardData,
  ShareCustomization,
  ShareFormat,
  ShareFormatId,
  SharePhoto,
  ShareTemplateId,
} from './types';

type StepId = 'photo' | 'wait' | 'adjust' | 'style';

const STEPS: { id: StepId; label: string }[] = [
  { id: 'photo', label: 'Foto' },
  { id: 'adjust', label: 'Ajustar' },
  { id: 'style', label: 'Estilo' },
];

const TOGGLES: { key: keyof ShareCustomization; label: string }[] = [
  { key: 'showAvatar', label: 'Avatar' },
  { key: 'showVolume', label: 'Volume' },
  { key: 'showEffort', label: 'Esforço' },
  { key: 'showRecord', label: 'Recorde' },
  { key: 'showExercises', label: 'Lista de exercícios' },
];

const PHOTO_BTN =
  'flex flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed p-4 text-sm transition-all duration-150 ' +
  'border-slate-300 text-slate-600 hover:border-amber-400 hover:text-amber-600 ' +
  'dark:border-white/15 dark:text-slate-300 dark:hover:border-amber-400 dark:hover:text-amber-400 ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

interface ShareWorkoutModalProps {
  open: boolean;
  onClose: () => void;
  workoutId: number;
  /** Data do treino (YYYY-MM-DD) — usada no nome do arquivo PNG. */
  workoutDate: string;
}

/**
 * Compartilhar treino — novo fluxo:
 * Escolher foto (câmera/galeria/sem foto) → Ajustar (arrastar/zoom) →
 * Escolha seu estilo (5 templates) → Personalizar → Pré-visualizar →
 * Salvar PNG / Compartilhar (Web Share).
 * Tudo 100% local: IndexedDB → JSX → PNG. A foto nunca sai do aparelho.
 */
export function ShareWorkoutModal({ open, onClose, workoutId, workoutDate }: ShareWorkoutModalProps) {
  const { push } = useToast();
  const [data, setData] = useState<ShareCardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState<StepId>('photo');
  const [photo, setPhoto] = useState<SharePhoto | null>(null);
  const [overlay, setOverlay] = useState(0.42);
  const [custom, setCustom] = useState<ShareCustomization>(DEFAULT_CUSTOMIZATION);
  const [template, setTemplate] = useState<ShareTemplateId>('glass');
  const [formatId, setFormatId] = useState<ShareFormatId>('feed');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);
  const [picking, setPicking] = useState(false);

  const format = getFormat(formatId);
  const canvasRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(0.25);
  const dragRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);

  // Carrega os dados reais do treino (IndexedDB) + a logo da marca ao abrir.
  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    setError(null);
    setDone(false);
    setStep('photo');
    setPhoto(null);
    setOverlay(0.42);
    setCustom(DEFAULT_CUSTOMIZATION);
    setTemplate('glass');
    selectWorkoutShareData(workoutId)
      .then((d) => {
        if (!alive) return;
        if (!d) {
          setError('Treino não encontrado.');
        } else {
          setData(d);
          // Se o treino tem foto salva, ela já vira o fundo do card:
          // carrega (local), mostra a espera com a logo e vai aos templates.
          if (d.photoId != null) {
            workoutPhotoToSharePhoto(d.photoId).then((p) => {
              if (!alive) return;
              if (p) {
                setPhoto(p);
                setStep('wait');
              }
            });
          }
        }
      })
      .catch(() => {
        if (alive) setError('Não foi possível carregar o treino.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    resolveBrandLogo().then((url) => {
      if (alive) setLogoUrl(url);
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

  function updatePhoto(patch: Partial<SharePhoto>) {
    setPhoto((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  /** Navega entre passos (zera o estado "Imagem salva!"). */
  function goTo(next: StepId) {
    setDone(false);
    setStep(next);
  }

  async function handlePick(capture: boolean) {
    if (picking) return;
    setPicking(true);
    try {
      const file = await pickPhotoFile(capture);
      if (!file) {
        push('Nenhuma foto selecionada.', 'info');
        return;
      }
      push('Processando foto…', 'info');
      const p = await processPhotoFile(file);
      if (p) {
        setPhoto(p);
        // Período de espera: logo + animação, depois vai para os templates.
        setDone(false);
        setStep('wait');
      } else {
        push('Não foi possível usar essa foto.', 'error');
      }
    } finally {
      setPicking(false);
    }
  }

  // ---- Editor: arrastar para reposicionar (pointer events, funciona no toque) ----
  function onEditorPointerDown(e: RPointerEvent<HTMLDivElement>) {
    if (!photo) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, panX: photo.panX, panY: photo.panY };
  }
  function onEditorPointerMove(e: RPointerEvent<HTMLDivElement>) {
    const d = dragRef.current;
    if (!d || !photo) return;
    const box = e.currentTarget.getBoundingClientRect();
    const dx = ((e.clientX - d.startX) / box.width) * 100;
    const dy = ((e.clientY - d.startY) / box.height) * 100;
    const max = maxPan(photo.scale);
    updatePhoto({ panX: clampNum(d.panX + dx, -max, max), panY: clampNum(d.panY + dy, -max, max) });
  }
  function onEditorPointerEnd() {
    dragRef.current = null;
  }

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

  // Durante a espera (logo + animação) o passo "Foto" continua ativo.
  const stepIndex = step === 'wait' ? 0 : STEPS.findIndex((s) => s.id === step);

  // Tela de espera: após escolher a foto, mostra a logo com a animação de
  // pontos quicando e avança sozinho para a escolha de templates.
  useEffect(() => {
    if (step !== 'wait') return;
    const t = window.setTimeout(() => goTo('style'), 2300);
    return () => window.clearTimeout(t);
  }, [step]);

  return (
    <Modal open={open} onClose={onClose} title="Compartilhar treino" size="lg">
      <div className="space-y-4">
        {/* Passos */}
        <div className="flex items-center gap-1.5">
          {STEPS.map((s, i) => {
            const active = s.id === step;
            const reached = i <= stepIndex;
            const clickable = i < stepIndex;
            return (
              <Fragment key={s.id}>
                {i > 0 && <div className="h-px w-4 bg-slate-300 dark:bg-slate-700" />}
                <button
                  type="button"
                  onClick={() => {
                    if (clickable) goTo(s.id);
                  }}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-150',
                    active
                      ? 'bg-amber-400 text-black shadow-[0_4px_12px_rgba(245,197,24,0.28)] -translate-y-0.5 motion-reduce:translate-y-0 motion-reduce:shadow-none'
                      : reached
                        ? 'bg-amber-400/20 text-amber-700 dark:text-amber-400'
                        : 'bg-slate-100 text-slate-400 dark:bg-[#26262b] dark:text-slate-500'
                  )}
                >
                  {i < stepIndex ? <Check className="h-3.5 w-3.5" /> : <span>{i + 1}</span>}
                  {s.label}
                </button>
              </Fragment>
            );
          })}
        </div>

        {/* Formato (vale para todos os passos — define a proporção do editor e do PNG) */}
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
              </button>
            );
          })}
        </div>

        {error && <p className="text-sm text-rose-500">{error}</p>}

        {/* ESPERA — logo + animação após subir a foto */}
        {step === 'wait' && (
          <div className="flex flex-col items-center justify-center gap-6 rounded-3xl border border-white/10 bg-gradient-to-b from-[#161616] to-[#0D0D0D] px-6 py-16">
            <Logo className="h-24 w-24 rounded-3xl shadow-[0_8px_24px_rgba(245,197,24,0.2)]" />
            <div className="flex items-center gap-2.5" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="repfit-dot" style={{ animationDelay: `${i * 0.16}s` }} />
              ))}
            </div>
            <p className="text-sm font-semibold text-slate-400">Preparando seu card…</p>
          </div>
        )}

        {/* PASSO 1 — Escolher foto */}
        {step === 'photo' && (
          <div className="space-y-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Adicione uma foto sua para o card (opcional). Ela é processada só neste aparelho.
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              <button type="button" onClick={() => handlePick(true)} disabled={picking} className={PHOTO_BTN}>
                <Camera className="h-5 w-5" />
                <span className="font-bold">Tirar foto</span>
                <span className="text-xs opacity-70">Câmera</span>
              </button>
              <button type="button" onClick={() => handlePick(false)} disabled={picking} className={PHOTO_BTN}>
                <ImageIcon className="h-5 w-5" />
                <span className="font-bold">Escolher foto</span>
                <span className="text-xs opacity-70">Galeria</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPhoto(null);
                  goTo('style');
                }}
                className={PHOTO_BTN}
              >
                <Sparkles className="h-5 w-5" />
                <span className="font-bold">Continuar sem foto</span>
                <span className="text-xs opacity-70">Fundo premium</span>
              </button>
            </div>
            {picking && (
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Processando foto…
              </div>
            )}
            {photo && (
              <button
                type="button"
                onClick={() => goTo('adjust')}
                className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-black/40 p-2 text-left"
              >
                <img src={photo.url} alt="Foto escolhida" className="h-14 w-14 rounded-xl object-cover" />
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-200">
                  Foto escolhida — <span className="text-amber-500">ajustar</span>
                </span>
              </button>
            )}
            <p className="text-xs text-slate-400 dark:text-slate-500">
              🔒 A foto é processada localmente, não é enviada para a internet e é descartada ao fechar.
            </p>
          </div>
        )}

        {/* PASSO 2 — Ajustar foto */}
        {step === 'adjust' && photo && (
          <div className="space-y-3">
            <div
              onPointerDown={onEditorPointerDown}
              onPointerMove={onEditorPointerMove}
              onPointerUp={onEditorPointerEnd}
              onPointerCancel={onEditorPointerEnd}
              className="relative mx-auto w-full touch-none select-none overflow-hidden rounded-2xl bg-black"
              style={{ aspectRatio: `${format.width} / ${format.height}`, maxHeight: '55vh' }}
            >
              <PhotoLayer photo={photo} overlay={overlay} format={format} />
              <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
                <span className="rounded-full bg-black/55 px-3 py-1 text-[11px] font-semibold text-white/75">
                  Arraste para reposicionar
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ZoomIn className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={photo.scale}
                onChange={(e) => {
                  const s = Number(e.target.value);
                  const max = maxPan(s);
                  updatePhoto({
                    scale: s,
                    panX: clampNum(photo.panX, -max, max),
                    panY: clampNum(photo.panY, -max, max),
                  });
                }}
                className="flex-1 accent-amber-400"
                aria-label="Zoom da foto"
              />
              <span className="w-14 shrink-0 text-right text-xs font-bold tabular-nums text-slate-500">
                {Math.round(photo.scale * 100)}%
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => updatePhoto({ scale: 1, panX: 0, panY: 0 })}
                disabled={photo.scale === 1 && photo.panX === 0 && photo.panY === 0}
              >
                <RefreshCcw className="h-4 w-4" /> Resetar
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handlePick(true)}>
                <Camera className="h-4 w-4" /> Tirar outra
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPhoto(null);
                  goTo('style');
                }}
              >
                Sem foto
              </Button>
              <div className="flex-1" />
              <Button size="sm" onClick={() => goTo('style')}>
                Usar foto <Check className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* PASSO 3 — Escolha seu estilo */}
        {step === 'style' && data && (
          <>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Escolha seu estilo
              </p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {SHARE_TEMPLATES.map((t) => {
                  const active = template === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      title={t.hint}
                      onClick={() => setTemplate(t.id)}
                      className={cn(
                        'flex shrink-0 flex-col items-center gap-1.5 rounded-2xl border-2 p-1.5 transition-all duration-150',
                        active
                          ? '-translate-y-0.5 border-amber-400 shadow-[0_4px_12px_rgba(245,197,24,0.28)] motion-reduce:translate-y-0 motion-reduce:shadow-none'
                          : 'border-transparent hover:border-white/15'
                      )}
                    >
                      <TemplateThumb tpl={t.id} data={data} format={format} photoUrl={photo?.url ?? null} custom={custom} />
                      <span className={cn('text-xs font-bold', active ? 'text-amber-500' : 'text-slate-500 dark:text-slate-400')}>
                        {t.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Personalizar */}
            <details className="rounded-2xl border border-slate-200 bg-slate-50/60 dark:border-white/10 dark:bg-white/[0.03]">
              <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                <SlidersHorizontal className="h-4 w-4 text-amber-500" /> Personalizar
              </summary>
              <div className="space-y-3 px-4 pb-4">
                {photo && (
                  <>
                    <div className="flex items-center gap-3">
                      <ZoomIn className="h-4 w-4 shrink-0 text-slate-400" />
                      <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.01}
                        value={photo.scale}
                        onChange={(e) => {
                          const s = Number(e.target.value);
                          const max = maxPan(s);
                          updatePhoto({
                            scale: s,
                            panX: clampNum(photo.panX, -max, max),
                            panY: clampNum(photo.panY, -max, max),
                          });
                        }}
                        className="flex-1 accent-amber-400"
                        aria-label="Zoom"
                      />
                      <span className="w-14 text-right text-xs font-bold tabular-nums text-slate-500">
                        {Math.round(photo.scale * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400">Escurecer</span>
                      <input
                        type="range"
                        min={0}
                        max={0.85}
                        step={0.01}
                        value={overlay}
                        onChange={(e) => setOverlay(Number(e.target.value))}
                        className="flex-1 accent-amber-400"
                        aria-label="Intensidade do overlay"
                      />
                      <span className="w-14 text-right text-xs font-bold tabular-nums text-slate-500">
                        {Math.round(overlay * 100)}%
                      </span>
                    </div>
                  </>
                )}
                <div className="flex flex-wrap gap-2">
                  {TOGGLES.map((t) => {
                    const on = custom[t.key];
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setCustom((c) => ({ ...c, [t.key]: !c[t.key] }))}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-150',
                          on
                            ? 'bg-amber-400 text-black shadow-[0_4px_12px_rgba(245,197,24,0.25)] -translate-y-0.5 motion-reduce:translate-y-0 motion-reduce:shadow-none'
                            : 'bg-slate-100 text-slate-500 dark:bg-[#26262b] dark:text-slate-400'
                        )}
                      >
                        {on ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </details>

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
                <ShareCardCanvas
                  ref={canvasRef}
                  data={data}
                  template={template}
                  format={format}
                  scale={previewScale}
                  photo={photo}
                  custom={custom}
                  overlay={overlay}
                  logoUrl={logoUrl}
                />
              ) : null}
            </div>

            {/* Ações */}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={onClose} disabled={exporting}>
                <X className="h-4 w-4" /> Fechar
              </Button>
              <Button variant="secondary" onClick={() => goTo(photo ? 'adjust' : 'photo')} disabled={exporting}>
                <ChevronLeft className="h-4 w-4" /> Voltar
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
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : done ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {exporting ? 'Gerando imagem…' : done ? 'Imagem salva!' : 'Salvar imagem'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

/** Miniatura real do template (mesmo componente do PNG, em escala pequena). */
const TemplateThumb = memo(function TemplateThumb({
  tpl,
  data,
  format,
  photoUrl,
  custom,
}: {
  tpl: ShareTemplateId;
  data: ShareCardData;
  format: ShareFormat;
  photoUrl: string | null;
  custom: ShareCustomization;
}) {
  const photo = photoUrl ? { url: photoUrl, scale: 1, panX: 0, panY: 0 } : null;
  return (
    <div
      className="pointer-events-none w-[92px] overflow-hidden rounded-lg bg-black"
      style={{ aspectRatio: `${format.width} / ${format.height}` }}
    >
      <ShareCardCanvas
        data={data}
        template={tpl}
        format={format}
        scale={92 / format.width}
        photo={photo}
        custom={custom}
        overlay={0.42}
        logoUrl={null}
      />
    </div>
  );
});
