// ============================================================================
// Hook que busca a assinatura mais recente do usuário logado no Supabase.
// Usado pelo SubscriptionGate (gating por assinatura).
// ============================================================================

import { useEffect, useState } from 'react';
import type { SubscriptionRow } from '../../types/supabase';
import { getSupabase } from './client';

export interface SubscriptionState {
  /** Assinatura mais recente (ou null se não houver). */
  subscription: SubscriptionRow | null;
  /** Consulta em andamento. */
  loading: boolean;
  /** A consulta falhou (ex.: sem internet) — o gate não bloqueia nesse caso. */
  failed: boolean;
}

export function useSubscription(userId: string | null): SubscriptionState {
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSubscription(null);
    setFailed(false);

    if (!userId) {
      setLoading(false);
      return;
    }
    const sb = getSupabase();
    if (!sb) {
      setLoading(false);
      return;
    }

    setLoading(true);
    void sb
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setFailed(true);
          setSubscription(null);
        } else {
          setSubscription(data);
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { subscription, loading, failed };
}
