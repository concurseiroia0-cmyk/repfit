// ============================================================================
// Decisão de acesso à plataforma (gating por assinatura).
// ----------------------------------------------------------------------------
// Regras:
//   * Supabase NÃO configurado  → liberado (modo 100% local/offline, como antes);
//   * sem login                 → liberado (uso local gratuito);
//   * falha ao buscar assinatura → liberado (não prender pagante por erro/offline);
//   * e-mail do DONO            → liberado (acesso total sem pagar);
//   * assinatura válida         → liberado (active/trial/past_due/canceled-válida/lifetime);
//   * caso contrário            → BLOQUEADO (paywall).
//
// A fonte de verdade é `hasSubscriptionAccess` (status + current_period_end),
// NUNCA um campo manual is_premium.
// ============================================================================

import type { AuthUser } from '../services/supabase/client';
import { hasSubscriptionAccess, isOwnerEmail, type SubscriptionLike } from './subscription';

export type AccessDecision = 'allow' | 'block';

export interface AccessArgs {
  /** Supabase configurado (.env com URL + chave)? */
  configured: boolean;
  /** Usuário autenticado (ou null). */
  user: AuthUser | null;
  /** Assinatura mais recente do usuário (ou null). */
  subscription: SubscriptionLike | null;
  /** E-mails com acesso total (dono). */
  ownerEmails: readonly string[];
  /** A consulta da assinatura falhou (ex.: sem internet)? */
  fetchFailed: boolean;
}

export function decideAccess(args: AccessArgs): AccessDecision {
  if (!args.configured) return 'allow';
  if (!args.user) return 'allow';
  if (args.fetchFailed) return 'allow';
  if (isOwnerEmail(args.user.email, args.ownerEmails)) return 'allow';
  if (hasSubscriptionAccess(args.subscription)) return 'allow';
  return 'block';
}
