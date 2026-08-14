// ============================================================================
// Testes das métricas de receita (funções puras — sem I/O).
// ============================================================================

import { describe, expect, it } from 'vitest';
import { computeRevenueMetrics, subscriptionHasAccess, type PaymentRowLike, type SubscriptionRowLike } from './metrics.ts';

const NOW = new Date('2026-08-14T12:00:00Z');

function pay(partial: Partial<PaymentRowLike> & { id: string }): PaymentRowLike {
  return {
    user_id: 'u1',
    amount: 49.9,
    currency: 'BRL',
    status: 'paid',
    paid_at: '2026-08-01T10:00:00Z',
    payment_method: 'pix',
    provider: 'kirvano',
    ...partial,
  };
}

function sub(partial: Partial<SubscriptionRowLike> & { id: string }): SubscriptionRowLike {
  return {
    user_id: 'u1',
    status: 'active',
    amount: 49.9,
    currency: 'BRL',
    current_period_end: '2026-09-15T00:00:00Z',
    cancel_at_period_end: false,
    plan_name: 'RepFit',
    provider: 'kirvano',
    ...partial,
  };
}

describe('subscriptionHasAccess', () => {
  it('concede acesso para active/trial/past_due com período válido e para lifetime', () => {
    expect(subscriptionHasAccess(sub({ id: 'a', status: 'active' }), NOW)).toBe(true);
    expect(subscriptionHasAccess(sub({ id: 'a', status: 'trial' }), NOW)).toBe(true);
    expect(subscriptionHasAccess(sub({ id: 'a', status: 'past_due' }), NOW)).toBe(true);
    expect(subscriptionHasAccess(sub({ id: 'a', status: 'lifetime', current_period_end: null }), NOW)).toBe(true);
  });

  it('cancelada continua com acesso enquanto o período pago valer', () => {
    const s = sub({ id: 'a', status: 'canceled', current_period_end: '2026-09-15T00:00:00Z' });
    expect(subscriptionHasAccess(s, NOW)).toBe(true);
  });

  it('NUNCA concede acesso para refunded/chargeback, mesmo com período no futuro', () => {
    const s = sub({ id: 'a', status: 'refunded', current_period_end: '2026-09-15T00:00:00Z' });
    expect(subscriptionHasAccess(s, NOW)).toBe(false);
    expect(subscriptionHasAccess(sub({ id: 'a', status: 'chargeback' }), NOW)).toBe(false);
  });

  it('expirada / cancelada com período vencido / desconhecida → sem acesso', () => {
    expect(subscriptionHasAccess(sub({ id: 'a', status: 'expired' }), NOW)).toBe(false);
    expect(subscriptionHasAccess(sub({ id: 'a', status: 'canceled', current_period_end: '2026-01-01T00:00:00Z' }), NOW)).toBe(false);
    expect(subscriptionHasAccess(sub({ id: 'a', status: 'active', current_period_end: '2026-01-01T00:00:00Z' }), NOW)).toBe(false);
    expect(subscriptionHasAccess(sub({ id: 'a', status: 'weird' }), NOW)).toBe(false);
  });
});

describe('computeRevenueMetrics', () => {
  it('retorna zeros quando não há dados', () => {
    const m = computeRevenueMetrics([], [], {}, NOW);
    expect(m.totalPaid).toBe(0);
    expect(m.paidCount).toBe(0);
    expect(m.activeSubscriptions).toBe(0);
    expect(m.mrr).toBe(0);
    expect(m.recentPayments).toEqual([]);
  });

  it('soma receita paga e reembolsos separadamente, e filtra o mês corrente', () => {
    const payments = [
      pay({ id: 'p1', amount: 49.9, status: 'paid', paid_at: '2026-08-01T10:00:00Z' }),
      pay({ id: 'p2', amount: 129.9, status: 'paid', paid_at: '2026-08-05T10:00:00Z' }),
      pay({ id: 'p3', amount: 49.9, status: 'paid', paid_at: '2026-07-20T10:00:00Z' }), // mês passado
      pay({ id: 'p4', amount: 49.9, status: 'refunded', paid_at: '2026-08-06T10:00:00Z' }),
      pay({ id: 'p5', amount: 10, status: 'failed', paid_at: '2026-08-07T10:00:00Z' }),
    ];
    const m = computeRevenueMetrics(payments, [], {}, NOW);
    expect(m.totalPaid).toBeCloseTo(229.7); // 49.9 + 129.9 + 49.9
    expect(m.paidCount).toBe(3);
    expect(m.totalRefunded).toBeCloseTo(49.9);
    expect(m.refundedCount).toBe(1);
    expect(m.monthPaid).toBeCloseTo(179.8); // 49.9 + 129.9
    expect(m.monthCount).toBe(2);
  });

  it('conta assinantes ativos espelhando a regra de acesso', () => {
    const subscriptions = [
      sub({ id: 's1', status: 'active', amount: 49.9 }), // ativa
      sub({ id: 's2', status: 'canceled', amount: 49.9, current_period_end: '2026-09-15T00:00:00Z' }), // válida até o fim
      sub({ id: 's3', status: 'trial', amount: 0 }), // trial
      sub({ id: 's4', status: 'expired', amount: 49.9, current_period_end: '2026-01-01T00:00:00Z' }), // não conta
      sub({ id: 's5', status: 'refunded', amount: 49.9, current_period_end: '2026-09-15T00:00:00Z' }), // não conta
    ];
    const m = computeRevenueMetrics([], subscriptions, {}, NOW);
    expect(m.activeSubscriptions).toBe(3); // s1, s2, s3
    expect(m.trialSubscriptions).toBe(1);
    expect(m.canceledSubscriptions).toBe(1);
    expect(m.mrr).toBeCloseTo(99.8); // 49.9 + 49.9 (trial é 0)
  });

  it('recentPayments: ordena por paid_at desc, resolve e-mail e limita a 10', () => {
    const payments = Array.from({ length: 12 }, (_, i) =>
      pay({ id: `p${i}`, user_id: `u${i}`, paid_at: `2026-08-${String(i + 1).padStart(2, '0')}T10:00:00Z` })
    );
    const emailById: Record<string, string> = { u0: 'a@x.com', u11: 'b@x.com' };
    const m = computeRevenueMetrics(payments, [], emailById, NOW);
    expect(m.recentPayments).toHaveLength(10);
    expect(m.recentPayments[0].id).toBe('p11');
    expect(m.recentPayments[0].email).toBe('b@x.com');
    expect(m.recentPayments[9].id).toBe('p2');
  });
});
