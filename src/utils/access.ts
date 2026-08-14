// ============================================================================
// Decisão de acesso à plataforma (gating).
// ----------------------------------------------------------------------------
// Regras:
//   * Supabase NÃO configurado  → liberado (modo 100% local — sem Supabase não há como cadastrar);
//   * sem login                 → BLOQUEADO (cadastro obrigatório — redireciona para /login);
//   * falha ao buscar dados     → liberado (não prender pagante por erro/offline);
//   * DONO (owner_emails)       → liberado (acesso total sem pagar);
//   * assinatura válida         → liberado;
//   * acesso gratuito/manual ativo (access_grants) → liberado;
//   * caso contrário            → BLOQUEADO (paywall).
//
// A decisão final usa SEMPRE a função única hasActiveAccess (subscription.ts),
// para não espalhar verificações diferentes pelo código.
// ============================================================================

import type { AuthUser } from '../services/supabase/client';
import { hasActiveAccess, type GrantLike, type SubscriptionLike } from './subscription';

export type AccessDecision = 'allow' | 'block';

export interface AccessArgs {
  /** Supabase configurado (.env com URL + chave)? */
  configured: boolean;
  /** Usuário autenticado (ou null). */
  user: AuthUser | null;
  /** Assinatura mais recente do usuário (ou null). */
  subscription: SubscriptionLike | null;
  /** Concessões de acesso gratuito/manual do usuário. */
  grants?: readonly GrantLike[] | null;
  /** E-mails com acesso total (dono). */
  ownerEmails: readonly string[];
  /** A consulta falhou (ex.: sem internet)? */
  fetchFailed: boolean;
}

export function decideAccess(args: AccessArgs): AccessDecision {
  if (!args.configured) return 'allow';
  // Cadastro obrigatório: quem não está logado é bloqueado (redirecionado ao /login).
  if (!args.user) return 'block';
  if (args.fetchFailed) return 'allow';
  return hasActiveAccess({
    email: args.user.email,
    ownerEmails: args.ownerEmails,
    subscription: args.subscription,
    grants: args.grants ?? [],
  }) ? 'allow' : 'block';
}
