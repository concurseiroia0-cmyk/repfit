// ============================================================================
// Hook que busca a assinatura mais recente do usuário logado no Supabase.
// Usado pelo SubscriptionGate (gating por assinatura).
// ============================================================================

import { useEffect, useState } from 'react';
import type { SubscriptionRow } from '../../types/supabase';
import { getSupabase } from './client';
import { reprocessPendingSubscriptions } from './reprocessPending';
import type { GrantLike } from '../../utils/subscription';

export interface SubscriptionState {
  /** Assinatura mais recente (ou null se não houver). */
  subscription: SubscriptionRow | null;
  /** Concessões de acesso gratuito/manual ativas do usuário. */
  grants: GrantLike[];
  /** Consultas em andamento. */
  loading: boolean;
  /** Alguma consulta falhou (ex.: sem internet) — o gate não bloqueia nesse caso. */
  failed: boolean;
}

/** Busca assinatura + concessões de acesso do usuário (para o hasActiveAccess). */
export function useSubscription(userId: string | null): SubscriptionState {
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [grants, setGrants] = useState<GrantLike[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSubscription(null);
    setGrants([]);
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
    void (async () => {
      // 1) Quem comprou ANTES de se cadastrar: aplica os webhooks pendentes
      //    ('no-user') do e-mail — o acesso libera já no primeiro login.
      try {
        await reprocessPendingSubscriptions();
      } catch {
        // sem rede/erro → segue a consulta normal (o gate não bloqueia)
      }
      if (cancelled) return;

      // 2) Busca a assinatura + concessões (depois do reprocess, para o gate
      //    ver a assinatura recém-aplicada).
      const [subResult, grantsResult] = await Promise.all([
        sb
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        sb
          .from('access_grants')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('access_until', { ascending: false })
          .limit(20),
      ]);
      if (cancelled) return;
      if (subResult.error || grantsResult.error) {
        setFailed(true);
        setSubscription(null);
        setGrants([]);
      } else {
        setSubscription(subResult.data);
        setGrants(grantsResult.data ?? []);
      }
      setLoading(false);
    })().catch(() => {
      if (cancelled) return;
      setFailed(true);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { subscription, grants, loading, failed };
}
