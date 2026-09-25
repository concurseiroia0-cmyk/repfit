// ============================================================================
// useIsPremium — true quando o usuário NÃO deve ver anúncios.
// ----------------------------------------------------------------------------
// Premium = dono, assinatura válida (active/trial/canceled-dentro-do-período/
// lifetime) ou concessão manual ativa — mesma regra central do app
// (hasActiveAccess), reaproveitada aqui para não espalhar verificações.
// ----------------------------------------------------------------------------

import { useSupabaseAuth } from './useSupabaseAuth';
import { useSubscription } from './useSubscription';
import { hasActiveAccess } from '../../utils/subscription';
import { OWNER_EMAILS } from './config';

export interface PremiumState {
  /** true = sem anúncios (dono / assinatura válida / concessão ativa). */
  isPremium: boolean;
  /** Enquanto consulta o Supabase, presumimos premium (evita ad em pagante). */
  loading: boolean;
}

export function useIsPremium(): PremiumState {
  const auth = useSupabaseAuth();
  const { subscription, grants, loading, failed } = useSubscription(auth.user?.id ?? null);

  // Sem Supabase configurado ou sem login: não há como ser premium.
  if (!auth.configured || !auth.user) return { isPremium: false, loading: false };
  // Falha de rede: não prender pagante — trata como premium (sem anúncio).
  if (failed) return { isPremium: true, loading: false };

  const isPremium = hasActiveAccess({
    email: auth.user.email,
    ownerEmails: OWNER_EMAILS,
    subscription,
    grants,
  });
  return { isPremium, loading };
}
