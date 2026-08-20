// Banner que mostra os dias restantes do trial.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CreditCard, Sparkles } from 'lucide-react';
import { useSupabaseAuth } from '../services/supabase/useSupabaseAuth';
import { getSupabase } from '../services/supabase/client';

export function TrialBanner() {
  const navigate = useNavigate();
  const auth = useSupabaseAuth();
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.user || auth.loading) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const sb = getSupabase();
    if (!sb) { setLoading(false); return; }

    void (async () => {
      const { data } = await sb
        .from('profiles')
        .select('trial_activated_at, trial_expires_at, trial_status')
        .eq('id', auth.user!.id)
        .maybeSingle();
      if (cancelled || !data) { setLoading(false); return; }

      if (data.trial_status === 'active' && data.trial_expires_at) {
        const expiresMs = new Date(data.trial_expires_at).getTime();
        const now = Date.now();
        if (expiresMs > now) {
          setDaysRemaining(Math.ceil((expiresMs - now) / (24 * 60 * 60 * 1000)));
        }
      }
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [auth.user, auth.loading]);

  if (loading || daysRemaining === null) return null;

  const isUrgent = daysRemaining <= 3;

  return (
    <div
      className={`mx-4 mb-3 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
        isUrgent
          ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300'
          : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300'
      }`}
    >
      {isUrgent ? (
        <Clock className="h-4 w-4 shrink-0" />
      ) : (
        <Sparkles className="h-4 w-4 shrink-0" />
      )}
      <div className="flex-1">
        <p className="text-xs font-bold">
          {isUrgent
            ? `Seu trial termina em ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}!`
            : `Seu teste gratis: ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'} restantes`}
        </p>
        {isUrgent && (
          <p className="mt-0.5 text-[11px] opacity-80">
            Escolha um plano para continuar usando o RepFit.
          </p>
        )}
      </div>
      {isUrgent && (
        <button
          type="button"
          onClick={() => navigate('/planos')}
          className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-black transition-colors hover:bg-amber-400"
        >
          <CreditCard className="h-3 w-3" /> Ver planos
        </button>
      )}
    </div>
  );
}
