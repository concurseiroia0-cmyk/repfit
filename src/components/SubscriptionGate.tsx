// ============================================================================
// SubscriptionGate — porta de acesso do app.
// ----------------------------------------------------------------------------
// MODELO GRATUITO: todo usuário LOGADO usa 100% do app. O plano pago
// (RepFit Premium) serve apenas para REMOVER OS ANÚNCIOS — nunca bloqueia
// o uso. Quem não está logado continua sendo redirecionado ao /login
// (cadastro obrigatório).
// ============================================================================

import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSupabaseAuth } from '../services/supabase/useSupabaseAuth';

export function SubscriptionGate({ children }: { children: ReactNode }) {
  const auth = useSupabaseAuth();

  if (auth.loading) return null;

  // Sem Supabase configurado → não há como cadastrar; mantém o modo local.
  if (!auth.configured) return <>{children}</>;

  // CADASTRO OBRIGATÓRIO: sem login → tela de cadastro (o login fica salvo no
  // dispositivo, então isso acontece só na primeira vez).
  if (!auth.user) return <Navigate to="/login" replace />;

  // Logado → acesso liberado. (A assinatura só define se há anúncios — ver
  // useIsPremium e a vinheta em NewWorkoutPage.)
  return <>{children}</>;
}
