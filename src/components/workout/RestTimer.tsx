import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Bell, Pause, Play, RotateCcw } from 'lucide-react';
import { formatDurationShort, formatSeconds } from '../../utils/calc';
import { ACTIVE_PILL, cn } from '../../utils/misc';
import { Button } from '../ui/Button';
import { StepperInput } from '../ui/StepperInput';
import { useToast } from '../ui/Toast';

const LAST_KEY = 'diario.descanso.ultimo';
const PRESETS = [30, 60, 90, 120, 180, 300];
const MIN_SEC = 5;
const MAX_SEC = 1800;

export interface RestTimerHandle {
  /** Inicia o descanso com o último tempo usado (botão "descansar" das séries). */
  quickStart: () => void;
  isRunning: () => boolean;
}

interface RestTimerProps {
  /** Descanso já acumulado neste treino (para exibição). */
  totalRestSec: number;
  /** Chamado quando um descanso chega ao fim. */
  onComplete: (completedSec: number) => void;
}

function lastDuration(): number {
  try {
    const v = Number(localStorage.getItem(LAST_KEY));
    return Number.isFinite(v) && v >= MIN_SEC ? v : 90;
  } catch {
    return 90;
  }
}

function saveDuration(sec: number): void {
  try {
    localStorage.setItem(LAST_KEY, String(sec));
  } catch {
    // ignora
  }
}

/** Bipe curto via Web Audio (sem arquivos externos). */
function playBeep(): void {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const freqs = [880, 880, 1174.66];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      const t0 = now + i * 0.18;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.22, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.2);
    });
    window.setTimeout(() => void ctx.close().catch(() => {}), 1500);
  } catch {
    // áudio indisponível
  }
}

function ensurePermission(): void {
  try {
    if ('Notification' in window && Notification.permission === 'default') {
      void Notification.requestPermission();
    }
  } catch {
    // API indisponível
  }
}

function notifyDone(): void {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Descanso concluído', { body: 'Bora para a próxima série! 💪' });
    }
  } catch {
    // falha silenciosa
  }
}

/**
 * Cronômetro de descanso entre séries.
 * Ao concluir: bipe, toast e (se permitido) notificação do navegador.
 * O tempo concluído é somado ao descanso total do treino.
 */
export const RestTimer = forwardRef<RestTimerHandle, RestTimerProps>(function RestTimer(
  { totalRestSec, onComplete },
  ref
) {
  const { push } = useToast();
  const [durationSec, setDurationSec] = useState<number>(lastDuration);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [endAt, setEndAt] = useState<number | null>(null);

  const runDurationRef = useRef(durationSec);
  const remainingRef = useRef<number | null>(null);
  const endAtRef = useRef<number | null>(null);
  const finishedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const phase: 'idle' | 'running' | 'paused' = remaining == null ? 'idle' : endAt != null ? 'running' : 'paused';

  useEffect(() => {
    if (endAt == null) return;
    const tick = () => {
      const left = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      remainingRef.current = left;
      setRemaining(left);
      if (left <= 0 && !finishedRef.current) {
        finishedRef.current = true;
        endAtRef.current = null;
        setEndAt(null);
        remainingRef.current = null;
        setRemaining(null);
        playBeep();
        notifyDone();
        push('Descanso concluído — bora para a próxima série! 💪', 'success');
        onCompleteRef.current(runDurationRef.current);
      }
    };
    tick();
    const iv = window.setInterval(tick, 250);
    return () => window.clearInterval(iv);
  }, [endAt, push]);

  const start = (sec: number) => {
    ensurePermission();
    const s = Math.min(MAX_SEC, Math.max(MIN_SEC, Math.round(sec)));
    runDurationRef.current = s;
    setDurationSec(s);
    saveDuration(s);
    finishedRef.current = false;
    remainingRef.current = s;
    setRemaining(s);
    const at = Date.now() + s * 1000;
    endAtRef.current = at;
    setEndAt(at);
  };

  const pause = () => {
    endAtRef.current = null;
    setEndAt(null);
  };

  const resume = () => {
    const left = remainingRef.current ?? durationSec;
    if (left <= 0) return;
    const at = Date.now() + left * 1000;
    endAtRef.current = at;
    setEndAt(at);
  };

  const reset = () => {
    endAtRef.current = null;
    setEndAt(null);
    remainingRef.current = null;
    setRemaining(null);
    finishedRef.current = false;
  };

  useImperativeHandle(ref, () => ({
    quickStart: () => start(lastDuration()),
    isRunning: () => endAtRef.current != null,
  }));

  const displayed = remaining ?? durationSec;
  const pct = durationSec > 0 ? Math.max(0, Math.min(100, (displayed / durationSec) * 100)) : 0;
  const busy = phase !== 'idle';

  return (
    <div>
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'w-24 text-center text-4xl font-extrabold tabular-nums',
            phase === 'running' ? 'animate-pulse text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'
          )}
          aria-live={phase === 'running' ? 'polite' : 'off'}
        >
          {formatSeconds(displayed)}
        </div>
        <div className="flex-1">
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={cn(
                'h-full rounded-full transition-[width] duration-300',
                phase === 'running' ? 'bg-amber-400' : 'bg-slate-300 dark:bg-slate-600'
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">
            {phase === 'running' && 'Descansando… a próxima série te espera'}
            {phase === 'paused' && 'Pausado'}
            {phase === 'idle' && 'Escolha o tempo e clique em iniciar'}
          </p>
        </div>
      </div>

      {/* Tempos rápidos */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            disabled={phase === 'running'}
            onClick={() => {
              setDurationSec(p);
              reset();
            }}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-150',
              durationSec === p && phase !== 'running' && ACTIVE_PILL,
              durationSec === p && phase !== 'running' && 'border-transparent',
              (durationSec !== p || phase === 'running') &&
                'border-slate-300 text-slate-600 hover:border-amber-400 hover:text-amber-600 dark:border-white/20 dark:text-slate-300 dark:hover:border-amber-400 dark:hover:text-amber-400',
              phase === 'running' && 'opacity-50'
            )}
          >
            {formatSeconds(p)}
          </button>
        ))}
        <div className="w-28">
          <StepperInput
            value={String(durationSec)}
            onChange={(v) => {
              const n = Math.round(Number(v.replace(',', '.')));
              setDurationSec(Number.isFinite(n) ? Math.min(MAX_SEC, Math.max(MIN_SEC, n)) : durationSec);
              reset();
            }}
            step={10}
            min={MIN_SEC}
            max={MAX_SEC}
            suffix="s"
            ariaLabel="Duração do descanso em segundos"
            className="h-9"
            inputClassName="pr-8 text-xs"
            inputMode="numeric"
          />
        </div>
      </div>

      {/* Controles */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {phase === 'idle' && (
          <Button size="sm" onClick={() => start(durationSec)}>
            <Play className="h-4 w-4" /> Iniciar descanso
          </Button>
        )}
        {phase === 'running' && (
          <Button size="sm" variant="secondary" onClick={pause}>
            <Pause className="h-4 w-4" /> Pausar
          </Button>
        )}
        {phase === 'paused' && (
          <Button size="sm" onClick={resume}>
            <Play className="h-4 w-4" /> Continuar
          </Button>
        )}
        {busy && (
          <Button size="sm" variant="ghost" onClick={reset}>
            <RotateCcw className="h-4 w-4" /> Zerar
          </Button>
        )}
        {totalRestSec > 0 && (
          <span className="ml-auto text-xs font-semibold text-slate-500 dark:text-slate-400">
            Acumulado no treino: <b className="text-slate-800 dark:text-slate-200">{formatDurationShort(totalRestSec)}</b>
          </span>
        )}
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
        <Bell className="h-3.5 w-3.5" />
        Ao terminar, toca um som e você pode receber uma notificação do navegador.
      </p>
    </div>
  );
});
