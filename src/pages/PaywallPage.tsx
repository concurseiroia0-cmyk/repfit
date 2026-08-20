import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Lock, RefreshCw } from 'lucide-react';
import type { SubscriptionRow } from '../types/supabase';
import { getSubscriptionAccessInfo } from '../utils/subscription';
import { useSupabaseAuth } from '../services/supabase/useSupabaseAuth';
import { getSupabase } from '../services/supabase/client';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/Logo';

export function PaywallPage({ subscription }: { subscription: SubscriptionRow | null }) {
  const navigate = useNavigate();
  const auth = useSupabaseAuth();
  const [trialExpired, setTrialExpired] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!auth.user) return;
    const sb = getSupabase();
    if (!sb) return;
    void (async () => {
      const { data } = await sb.from("profiles").select("trial_status").eq("id", auth.user!.id).maybeSingle();
      if (data?.trial_status === "expired" || data?.trial_status === "active") setTrialExpired(true);
    })();
  }, [auth.user]);

  const info = getSubscriptionAccessInfo(subscription);

  async function handleSignOut() {
    setBusy(true);
    await auth.signOut();
    setBusy(false);
    navigate('/');
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md text-center">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar para o app
        </button>

        <div className="repfit-logo-pop mx-auto h-20 w-20">
          <Logo className="h-full w-full rounded-3xl shadow-[0_0_40px_rgba(251,191,36,0.4)]" />
        </div>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {trialExpired ? (<>Seu <span className="text-amber-500 dark:text-amber-400">periodo gratis</span> terminou</>) : (<><span className="text-amber-500 dark:text-amber-400">Assinatura</span> necessaria</>)}
        </h1>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 text-left dark:border-white/10 dark:bg-[#161616]">
          <p className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
            <Lock className="h-4 w-4 text-amber-500" />
            {info.lines[0] ?? 'Acesso bloqueado'}
          </p>
          <div className="mt-2 space-y-1">
            {info.lines.slice(1).map((line, i) => (
              <p key={i} className="text-sm text-slate-500 dark:text-slate-400">
                {line}
              </p>
            ))}
            {subscription == null && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Sua conta ainda não possui um plano ativo. Assine um plano para sincronizar seus
                treinos na nuvem.
              </p>
            )}
            {trialExpired && (
              <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                Seu periodo gratis de 15 dias terminou. Escolha um plano para continuar usando o RepFit.
              </p>
            )}
          </div>
          <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 dark:bg-amber-400/10 dark:text-amber-300">
            Pagamento online em breve — assim que a plataforma de pagamento for conectada, o acesso
            é liberado automaticamente pelo webhook.
          </div>
        </div>

        <div className="mx-auto mt-4 flex max-w-sm flex-col gap-2">
          <Button size="lg" onClick={() => navigate('/planos')}>
            <CreditCard className="h-4 w-4" /> Ver planos e assinar
          </Button>
          <Button variant="secondary" size="lg" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" /> Verificar novamente
          </Button>
          <Button variant="ghost" size="lg" onClick={() => void handleSignOut()} disabled={busy}>
            Sair da conta (voltar ao modo local)
          </Button>
        </div>

        <p className="mx-auto mt-4 max-w-sm text-xs leading-relaxed text-slate-400 dark:text-slate-500">
          Seu login fica <b>salvo neste dispositivo</b> — ao renovar o plano, o acesso é liberado
          automaticamente sem precisar entrar de novo.
        </p>
      </div>
    </div>
  );
}
