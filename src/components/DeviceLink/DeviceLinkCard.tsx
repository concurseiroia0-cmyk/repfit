// ============================================================================
// "Conectar aplicativo" — gera um código de vinculação para o usuário logado.
// ----------------------------------------------------------------------------
// O usuário autenticado (Chrome) gera um código de 6 dígitos com validade de
// 5 minutos e digita no PWA instalado → o PWA conecta na MESMA conta Supabase,
// sem refazer o login do Google.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, RefreshCw, Smartphone } from 'lucide-react';
import { generateDeviceLinkCode } from '../../services/supabase/deviceLink';
import { useToast } from '../ui/Toast';
import { Button } from '../ui/Button';

/** Formata segundos restantes como MM:SS (ex.: 04:59). */
function formatCountdown(totalSeconds: number): string {
  const m = Math.floor(Math.max(0, totalSeconds) / 60);
  const s = Math.max(0, totalSeconds) % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function DeviceLinkCard() {
  const { push } = useToast();
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [generating, setGenerating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => stopTimer(), [stopTimer]);

  const generate = useCallback(async () => {
    setGenerating(true);
    const result = await generateDeviceLinkCode();
    setGenerating(false);
    if (!result.ok || !result.code) {
      push(result.error ?? 'Não foi possível gerar o código.', 'error');
      return;
    }
    const ttl = (result.expiresInSeconds ?? 300) * 1000;
    const end = Date.now() + ttl;
    setCode(result.code);
    setExpiresAt(end);
    setSecondsLeft(Math.round(ttl / 1000));

    stopTimer();
    timerRef.current = setInterval(() => {
      const left = Math.round((end - Date.now()) / 1000);
      setSecondsLeft(left);
      if (left <= 0) {
        stopTimer();
        setCode(null);
        setExpiresAt(null);
      }
    }, 1000);
    push('Código gerado! Digite no aplicativo dentro de 5 minutos.', 'success');
  }, [push, stopTimer]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#161616]">
      <div className="p-4">
        {code && expiresAt != null ? (
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Seu código de conexão
            </p>
            <p className="mx-auto mt-2 w-fit rounded-2xl border border-dashed border-amber-400 bg-amber-50 px-6 py-3 font-mono text-4xl font-extrabold tracking-[0.3em] text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
              {code}
            </p>
            <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">
              Digite este código no aplicativo instalado.
            </p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              Expira em{' '}
              <b className={secondsLeft <= 30 ? 'text-rose-500' : 'text-slate-600 dark:text-slate-300'}>
                {formatCountdown(secondsLeft)}
              </b>
            </p>
            {secondsLeft <= 0 && (
              <p className="mt-1 text-xs font-semibold text-rose-500">Este código expirou.</p>
            )}
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => void generate()}
              disabled={generating}
            >
              <RefreshCw className={generating ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
              Gerar novo código
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:items-start sm:text-left">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400">
              <Smartphone className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Conectar aplicativo
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Instalou o app em outro aparelho e não quer logar com o Google de novo? Gere um
                código aqui e digite no app para conectar à <b>mesma conta</b> (válido por 5
                minutos, uso único).
              </p>
            </div>
            <Button onClick={() => void generate()} disabled={generating} className="shrink-0">
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Gerando…
                </>
              ) : (
                <>
                  <Smartphone className="h-4 w-4" /> Conectar aplicativo
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
