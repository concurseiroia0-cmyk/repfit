// Pagina exibida apos o trial ser ativado com sucesso.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, Loader2, Sparkles, Zap } from 'lucide-react';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui/Button';
import { useSupabaseAuth } from '../services/supabase/useSupabaseAuth';
import { activateTrial, getTrialInfo } from '../services/trial';
import { getSupabase } from '../services/supabase/client';

export function TrialActivatedPage() {
  const navigate = useNavigate();
  const auth = useSupabaseAuth();
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [alreadyActive, setAlreadyActive] = useState(false);

  useEffect(() => {
    if (!auth.user && !auth.loading) {
      navigate('/login?redirect=/trial/ativado', { replace: true });
      return;
    }
    if (auth.loading || !auth.user) return;

    let cancelled = false;
    void (async () => {
      const result = await activateTrial();
      if (cancelled) return;
      setBusy(false);

      if (result.alreadyActive) {
        setAlreadyActive(true);
        setExpiresAt(result.expiresAt ?? null);
      } else if (result.ok && result.expiresAt) {
        setExpiresAt(result.expiresAt);
      } else {
        setError(result.error ?? 'Erro ao ativar trial.');
      }
    })();

    return () => { cancelled = true; };
  }, [auth.user, auth.loading, navigate]);

  const formattedDate = expiresAt
    ? new Date(expiresAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null;

  if (auth.loading || busy) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md text-center">
        <div className="repfit-logo-pop mx-auto h-20 w-20">
          <Logo className="h-full w-full rounded-3xl shadow-[0_0_40px_rgba(251,191,36,0.4)]" />
        </div>

        {error ? (
          <>
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Ops!
            </h1>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{error}</p>
            <Button className="mt-6" onClick={() => navigate('/')}>Voltar ao app</Button>
          </>
        ) : (
          <>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-emerald-700">
              <Sparkles className="h-3.5 w-3.5" /> {alreadyActive ? 'Trial ativo' : 'Trial ativado!'}
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {alreadyActive ? 'Voce ja tem o trial!' : 'Bem-vindo ao RepFit!'}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {alreadyActive
                ? 'Seu acesso gratis de 15 dias continua ativo.'
                : 'Seu acesso gratis de 15 dias comecou!'}
            </p>

            {formattedDate && (
              <div className="mx-auto mt-5 flex max-w-sm items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300">
                <CalendarCheck className="h-4 w-4" />
                Seu trial termina em: {formattedDate}
              </div>
            )}

            <p className="mx-auto mt-4 max-w-sm text-xs leading-relaxed text-slate-400 dark:text-slate-500">
              Registre treinos, acompanhe sua evolucao com graficos, bata recordes e mantenha a constancia.
            </p>

            <Button size="lg" className="mt-6" onClick={() => navigate('/')}>
              <Zap className="h-5 w-5" /> Comecar a treinar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
