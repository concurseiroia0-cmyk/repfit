// ============================================================================
// Métricas de receita (painel admin).
// ----------------------------------------------------------------------------
// FUNÇÕES PURAS (sem I/O) — fáceis de testar com vitest. O fetching dos dados
// acontece na edge function admin (com a service role, que ignora RLS); aqui
// apenas calculamos os agregados a partir das linhas recebidas.
//
// Definições:
//   * totalPaid      → soma dos pagamentos com status 'paid' (receita bruta)
//   * monthPaid      → soma dos pagamentos 'paid' no mês corrente (paid_at)
//   * activeSubscriptions → assinaturas com acesso AGORA (espelha a regra de
//     acesso do app: active/trial/past_due com período válido, canceled
//     enquanto o período pago valer, lifetime; refunded/chargeback/expired
//     nunca contam)
//   * mrr            → estimativa: soma do amount das assinaturas ativas
// ============================================================================

export interface PaymentRowLike {
  id: string;
  user_id: string;
  amount: number | string | null;
  currency?: string | null;
  status: string | null;
  paid_at: string | null;
  payment_method?: string | null;
  provider?: string | null;
}

export interface SubscriptionRowLike {
  id: string;
  user_id: string;
  status: string | null;
  amount: number | string | null;
  currency?: string | null;
  current_period_end: string | null;
  cancel_at_period_end?: boolean | null;
  plan_name?: string | null;
  provider?: string | null;
}

export interface RecentPayment {
  id: string;
  email: string | null;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  provider: string | null;
  paid_at: string | null;
}

export interface RevenueMetrics {
  now: string;
  totalPaid: number;
  totalRefunded: number;
  paidCount: number;
  refundedCount: number;
  monthPaid: number;
  monthCount: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  canceledSubscriptions: number;
  mrr: number;
  recentPayments: RecentPayment[];
}

function toNum(v: number | string | null | undefined): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Assinatura concede acesso AGORA? Espelha src/utils/subscription.ts
 * (hasSubscriptionAccess): a fonte de verdade é status + current_period_end.
 */
export function subscriptionHasAccess(
  sub: SubscriptionRowLike | null | undefined,
  now: Date
): boolean {
  const status = sub?.status;
  const end = sub?.current_period_end ? new Date(sub.current_period_end).getTime() : null;
  switch (status) {
    case 'lifetime':
      return true;
    case 'active':
    case 'trial':
    case 'past_due':
      return end == null || end > now.getTime();
    case 'canceled':
      return end != null && end > now.getTime();
    case 'refunded':
    case 'chargeback':
      // Perda DEFINITIVA de acesso — nunca conta como assinante ativo.
      return false;
    default:
      // expired | pending | desconhecido → sem acesso.
      return false;
  }
}

export function computeRevenueMetrics(
  payments: readonly PaymentRowLike[] | null | undefined,
  subscriptions: readonly SubscriptionRowLike[] | null | undefined,
  emailById: Record<string, string>,
  now: Date = new Date()
): RevenueMetrics {
  let totalPaid = 0;
  let totalRefunded = 0;
  let paidCount = 0;
  let refundedCount = 0;
  let monthPaid = 0;
  let monthCount = 0;
  const monthPrefix = now.toISOString().slice(0, 7);

  for (const p of payments ?? []) {
    const amount = toNum(p.amount);
    if (p.status === 'paid') {
      totalPaid += amount;
      paidCount += 1;
      if (p.paid_at && p.paid_at.slice(0, 7) === monthPrefix) {
        monthPaid += amount;
        monthCount += 1;
      }
    } else if (p.status === 'refunded') {
      totalRefunded += amount;
      refundedCount += 1;
    }
  }

  let activeSubscriptions = 0;
  let trialSubscriptions = 0;
  let canceledSubscriptions = 0;
  let mrr = 0;
  for (const s of subscriptions ?? []) {
    const status = s.status ?? '';
    if (status === 'trial') trialSubscriptions += 1;
    if (status === 'canceled') canceledSubscriptions += 1;
    if (subscriptionHasAccess(s, now)) {
      activeSubscriptions += 1;
      mrr += toNum(s.amount);
    }
  }

  const recentPayments: RecentPayment[] = (payments ?? [])
    .filter((p) => p.status === 'paid' && p.paid_at)
    .sort((a, b) => (b.paid_at ?? '').localeCompare(a.paid_at ?? ''))
    .slice(0, 10)
    .map((p) => ({
      id: p.id,
      email: emailById[p.user_id] ?? null,
      amount: toNum(p.amount),
      currency: p.currency ?? 'BRL',
      status: p.status ?? 'paid',
      payment_method: p.payment_method ?? null,
      provider: p.provider ?? null,
      paid_at: p.paid_at,
    }));

  return {
    now: now.toISOString(),
    totalPaid,
    totalRefunded,
    paidCount,
    refundedCount,
    monthPaid,
    monthCount,
    activeSubscriptions,
    trialSubscriptions,
    canceledSubscriptions,
    mrr,
    recentPayments,
  };
}
