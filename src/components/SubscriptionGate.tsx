// ============================================================================
// SubscriptionGate — porta de acesso do app.
// ----------------------------------------------------------------------------
// Decide via `decideAccess` (src/utils/access.ts):
//   * Supabase não configurado / sem login / falha de consulta → liberado;
//   * dono (owner_emails) → liberado;
//   * assinatura válida (active/trial/cancelada-válida/lifetime) → liberado;
//   * logado sem assinatura válida → PAYWALL.
// Enquanto carrega (sessão/assinatura), renderiza nada para não piscar.
// ============================================================================

import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSupabaseAuth } from '../services/supabase/useSupabaseAuth';
import { useSubscription } from '../services/supabase/useSubscription';
import { OWNER_EMAILS } from '../services/supabase/config';
import { decideAccess } from '../utils/access';
import { PaywallPage } from '../pages/PaywallPage';

export function SubscriptionGate({ children }: { children: ReactNode }) {
  const auth = useSupabaseAuth();
  const { subscription, loading, failed } = useSubscription(auth.user?.id ?? null);

  if (auth.loading || loading) return null;

  // Sem Supabase configurado → não há como cadastrar; mantém o modo local.
  if (!auth.configured) return <>{children}</>;

  // CADASTRO OBRIGATÓRIO: sem login → tela de cadastro (o login fica salvo no
  // dispositivo, então isso acontece só na primeira vez).
  if (!auth.user) return <Navigate to="/login" replace />;

  // Logado: dono/assinatura válida liberam; caso contrário → paywall.
  const decision = decideAccess({
    configured: true,
    user: auth.user,
    subscription,
    ownerEmails: OWNER_EMAILS,
    fetchFailed: failed,
  });

  if (decision === 'block') {
    return <PaywallPage subscription={subscription} />;
  }
  return <>{children}</>;
}
