import { describe, expect, it } from 'vitest';
import { normalizeEvent, normalizeGGCheckout, normalizeKirvano, parseMoney } from './normalize.ts';

const EMAIL = 'aluno@exemplo.com';

function kirvano(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    event: 'SALE_APPROVED',
    event_description: 'Compra aprovada',
    checkout_id: 'Q8J1N6K3',
    sale_id: 'D2RP8RQ7',
    payment_method: 'CREDIT_CARD',
    total_price: 'R$ 169,80',
    type: 'RECURRING',
    status: 'APPROVED',
    created_at: '2026-08-14 16:40:06',
    customer: { name: 'João', email: EMAIL, document: '23875090127', phone_number: '5511987654321' },
    payment: { method: 'CREDIT_CARD', brand: 'visa', installments: 1, finished_at: '2026-08-14 16:40:21' },
    plan: { name: 'Plano Anual', charge_frequency: 'ANNUALLY', next_charge_date: '2027-08-14 16:41:16' },
    products: [{ id: 'p1', name: 'RepFit Pro', offer_id: 'o1', offer_name: 'RepFit Pro', price: 'R$ 169,80' }],
    ...overrides,
  };
}

function ggcheckout(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    event: 'pix.paid',
    createdAt: '2026-08-14T10:30:00Z',
    customer: { name: 'Joao', email: EMAIL, document: '12345678901', phone: '5511999999999', ip: '177.45.23.100' },
    payment: { id: 'pay-123', method: 'pix.paid', paymentMethod: 'pix', gateway: 'pagouai', status: 'paid', amount: 97.0 },
    product: { id: 'prod-1', type: 'main', title: 'RepFit Pro' },
    products: [{ id: 'prod-1', type: 'main', title: 'RepFit Pro', price: 9700 }],
    webhook: { id: 'webhook_xyz', businessId: 'biz', events: ['pix.paid', 'pix.generated'] },
    ...overrides,
  };
}

describe('parseMoney (formato brasileiro)', () => {
  it('"R$ 169,80" → 169.8', () => {
    expect(parseMoney('R$ 169,80')).toBe(169.8);
  });
  it('número direto → mantém', () => {
    expect(parseMoney(49.9)).toBe(49.9);
    expect(parseMoney('2700')).toBe(2700);
  });
});

describe('Kirvano → evento interno', () => {
  it('SALE_APPROVED RECURRING → subscription_activated (grant, active, período do plano)', () => {
    const e = normalizeKirvano(kirvano());
    expect(e.gateway).toBe('kirvano');
    expect(e.eventType).toBe('SALE_APPROVED');
    expect(e.normalized).toBe('subscription_activated');
    expect(e.action).toBe('grant');
    expect(e.status).toBe('active');
    expect(e.email).toBe(EMAIL);
    expect(e.plan).toBe('Plano Anual');
    expect(e.product).toBe('RepFit Pro');
    expect(e.amount).toBe(169.8);
    expect(e.currency).toBe('BRL');
    expect(e.subscriptionId).toBe('D2RP8RQ7');
    expect(e.periodEnd).toContain('2027-08-14');
    expect(e.cancelAtPeriodEnd).toBe(false);
  });

  it('SALE_APPROVED ONE_TIME → payment_approved (grant)', () => {
    const e = normalizeKirvano(kirvano({ type: 'ONE_TIME', plan: undefined }));
    expect(e.normalized).toBe('payment_approved');
    expect(e.action).toBe('grant');
    expect(e.periodEnd).toBeNull();
  });

  it('SALE_REFUSED → payment_failed (noop — não revoga acesso existente)', () => {
    const e = normalizeKirvano(kirvano({ event: 'SALE_REFUSED', status: 'REFUSED' }));
    expect(e.normalized).toBe('payment_failed');
    expect(e.action).toBe('noop');
  });

  it('SALE_CHARGEBACK → chargeback (revoke)', () => {
    const e = normalizeKirvano(kirvano({ event: 'SALE_CHARGEBACK', status: 'CHARGEBACK' }));
    expect(e.normalized).toBe('chargeback');
    expect(e.action).toBe('revoke');
    expect(e.status).toBe('chargeback');
  });

  it('PIX_GENERATED → payment_pending (noop)', () => {
    const e = normalizeKirvano(kirvano({ event: 'PIX_GENERATED', status: 'PENDING' }));
    expect(e.normalized).toBe('payment_pending');
    expect(e.action).toBe('noop');
  });

  it('cancelamento (SUBSCRIPTION_CANCELED) → cancel com cancelAtPeriodEnd', () => {
    const e = normalizeKirvano(kirvano({ event: 'SUBSCRIPTION_CANCELED', status: 'CANCELED' }));
    expect(e.normalized).toBe('subscription_canceled');
    expect(e.action).toBe('cancel');
    expect(e.cancelAtPeriodEnd).toBe(true);
    expect(e.status).toBe('canceled');
  });

  it('chave de idempotência contém evento + venda + data', () => {
    const e = normalizeKirvano(kirvano());
    expect(e.eventId).toContain('SALE_APPROVED');
    expect(e.eventId).toContain('D2RP8RQ7');
    expect(e.eventId).toContain('2026-08-14');
  });
});

describe('GGCheckout → evento interno', () => {
  it('pix.paid → payment_approved (grant, active)', () => {
    const e = normalizeGGCheckout(ggcheckout());
    expect(e.gateway).toBe('ggcheckout');
    expect(e.normalized).toBe('payment_approved');
    expect(e.action).toBe('grant');
    expect(e.status).toBe('active');
    expect(e.email).toBe(EMAIL);
    expect(e.product).toBe('RepFit Pro');
    expect(e.amount).toBe(97);
    expect(e.transactionId).toBe('pay-123');
  });

  it('card.failed → payment_failed (noop)', () => {
    const e = normalizeGGCheckout(ggcheckout({ event: 'card.failed', payment: { id: 'pay-2', method: 'card.failed', paymentMethod: 'card', gateway: 'x', status: 'failed', amount: 97 } }));
    expect(e.normalized).toBe('payment_failed');
    expect(e.action).toBe('noop');
  });

  it('card.refunded → refund_created (revoke)', () => {
    const e = normalizeGGCheckout(ggcheckout({ event: 'card.refunded', payment: { id: 'pay-3', method: 'card.refunded', paymentMethod: 'card', gateway: 'x', status: 'refunded', amount: 97 } }));
    expect(e.normalized).toBe('refund_created');
    expect(e.action).toBe('revoke');
  });

  it('payment.status charged_back → chargeback (revoke) mesmo com evento ".paid"', () => {
    const e = normalizeGGCheckout(ggcheckout({ payment: { id: 'pay-4', method: 'pix.paid', paymentMethod: 'pix', gateway: 'x', status: 'charged_back', amount: 97 } }));
    expect(e.normalized).toBe('chargeback');
    expect(e.action).toBe('revoke');
  });

  it('pix.generated → payment_pending (noop)', () => {
    const e = normalizeGGCheckout(ggcheckout({ event: 'pix.generated', payment: { id: 'pay-5', method: 'pix.generated', paymentMethod: 'pix', gateway: 'x', status: 'pending', amount: 97 } }));
    expect(e.normalized).toBe('payment_pending');
    expect(e.action).toBe('noop');
  });

  it('chave de idempotência contém evento + id do pagamento', () => {
    const e = normalizeGGCheckout(ggcheckout());
    expect(e.eventId).toContain('pix.paid');
    expect(e.eventId).toContain('pay-123');
  });
});

describe('normalizeEvent (ponto único)', () => {
  it('roteia pelo gateway', () => {
    expect(normalizeEvent('kirvano', kirvano()).gateway).toBe('kirvano');
    expect(normalizeEvent('ggcheckout', ggcheckout()).gateway).toBe('ggcheckout');
  });

  it('evento desconhecido → unknown (sem alterar acesso)', () => {
    const e = normalizeEvent('kirvano', kirvano({ event: 'CUSTOMER_DATA_UPDATED' }));
    expect(e.normalized).toBe('unknown');
    expect(e.action).toBe('unknown');
  });
});
