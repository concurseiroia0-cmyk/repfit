// ============================================================================
// Camada de NORMALIZAÇÃO (pura, sem I/O — testável em vitest).
// ----------------------------------------------------------------------------
// Converte o payload de cada gateway (Kirvano / GGCheckout) para o formato
// INTERNO único (NormalizedEvent). A lógica de acesso vive no processador
// (processor.ts), que recebe SEMPRE um NormalizedEvent.
//
// Kirvano:   eventos SALE_APPROVED / SALE_REFUSED / SALE_CHARGEBACK /
//            PIX_GENERATED / PIX_EXPIRED / BANK_SLIP_GENERATED / BANK_SLIP_EXPIRED,
//            com `type` ONE_TIME/RECURRING e `plan.next_charge_date`.
// GGCheckout: eventos pix.* / card.* (paid, generated, expired, failed,
//            refunded, pending) e payment.status (paid, pending, failed,
//            refunded, charged_back).
// ============================================================================

import type { Gateway, NormalizedEvent, NormalizedEventType } from './types.ts';

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
}

function str(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/** 'R$ 169,80' → 169.8 ; '2700' → 2700 */
export function parseMoney(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = String(v).replace(/[^\d,.-]/g, '').replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function contains(text: string | null, ...parts: string[]): boolean {
  if (!text) return false;
  const t = text.toUpperCase();
  return parts.some((p) => t.includes(p.toUpperCase()));
}

// ---------------------------------------------------------------------------
// Kirvano
// ---------------------------------------------------------------------------

export function normalizeKirvano(raw: unknown): NormalizedEvent {
  const p = asRecord(raw);
  const customer = asRecord(p.customer);
  const plan = asRecord(p.plan);
  const payment = asRecord(p.payment);
  const products = Array.isArray(p.products) ? (p.products as unknown[]) : [];
  const firstProduct = asRecord(products[0]);

  const event = str(p.event) ?? 'UNKNOWN';
  const saleId = str(p.sale_id) ?? str(p.checkout_id) ?? '';
  const createdAt = str(p.created_at) ?? '';

  const email = str(customer.email) ?? '';
  const recurring = String(p.type).toUpperCase() === 'RECURRING';

  let normalized: NormalizedEventType = 'unknown';
  let status: NormalizedEvent['status'] = 'unknown';
  let action: NormalizedEvent['action'] = 'unknown';
  let cancelAtPeriodEnd = false;

  if (event === 'SALE_APPROVED') {
    normalized = recurring ? 'subscription_activated' : 'payment_approved';
    status = 'active';
    action = 'grant';
  } else if (event === 'SALE_REFUSED') {
    normalized = 'payment_failed';
    status = 'unknown';
    action = 'noop';
  } else if (event === 'SALE_CHARGEBACK') {
    normalized = 'chargeback';
    status = 'chargeback';
    action = 'revoke';
  } else if (contains(event, 'EXPIRED', 'REFUSED', 'FAILED')) {
    normalized = 'payment_failed';
    status = 'unknown';
    action = 'noop';
  } else if (contains(event, 'GENERATED', 'PENDING')) {
    normalized = 'payment_pending';
    status = 'pending';
    action = 'noop';
  } else if (contains(event, 'CANCEL')) {
    normalized = 'subscription_canceled';
    status = 'canceled';
    action = 'cancel';
    cancelAtPeriodEnd = true;
  } else if (contains(event, 'REFUND')) {
    normalized = 'refund_created';
    status = 'refunded';
    action = 'revoke';
  }

  return {
    gateway: 'kirvano',
    eventId: `kirvano:${event}:${saleId}:${createdAt}`,
    eventType: event,
    normalized,
    action,
    status,
    email,
    product: str(firstProduct.name),
    plan: str(plan.name),
    amount: parseMoney(p.total_price),
    currency: 'BRL',
    subscriptionId: recurring ? str(saleId) : null,
    transactionId: str(p.sale_id) ?? str(p.checkout_id),
    paymentMethod: str(payment.method) ?? str(p.payment_method),
    periodStart: null,
    periodEnd: recurring ? str(plan.next_charge_date) : null,
    cancelAtPeriodEnd,
    paidAt: str(payment.finished_at) ?? createdAt,
    raw,
  };
}

// ---------------------------------------------------------------------------
// GGCheckout
// ---------------------------------------------------------------------------

export function normalizeGGCheckout(raw: unknown): NormalizedEvent {
  const p = asRecord(raw);
  const customer = asRecord(p.customer);
  const payment = asRecord(p.payment);
  const product = asRecord(p.product);
  const products = Array.isArray(p.products) ? (p.products as unknown[]) : [];
  const firstProduct = asRecord(products[0]);

  const event = str(p.event) ?? 'unknown';
  const paymentId = str(payment.id) ?? '';
  const email = str(customer.email) ?? '';
  const paymentStatus = str(payment.status)?.toLowerCase() ?? '';

  let normalized: NormalizedEventType = 'unknown';
  let status: NormalizedEvent['status'] = 'unknown';
  let action: NormalizedEvent['action'] = 'unknown';

  if (paymentStatus === 'charged_back' || contains(event, 'chargeback')) {
    normalized = 'chargeback';
    status = 'chargeback';
    action = 'revoke';
  } else if (event.endsWith('.refunded') || paymentStatus === 'refunded') {
    normalized = 'refund_created';
    status = 'refunded';
    action = 'revoke';
  } else if (event.endsWith('.paid') || paymentStatus === 'paid') {
    normalized = 'payment_approved';
    status = 'active';
    action = 'grant';
  } else if (event.endsWith('.pending') || paymentStatus === 'pending') {
    normalized = 'payment_pending';
    status = 'pending';
    action = 'noop';
  } else if (event.endsWith('.expired') || event.endsWith('.failed') || paymentStatus === 'failed') {
    normalized = 'payment_failed';
    status = 'unknown';
    action = 'noop';
  }

  return {
    gateway: 'ggcheckout',
    eventId: `ggcheckout:${event}:${paymentId}`,
    eventType: event,
    normalized,
    action,
    status,
    email,
    product: str(firstProduct.title) ?? str(product.title),
    plan: null,
    amount: num(payment.amount),
    currency: 'BRL',
    subscriptionId: null,
    transactionId: paymentId,
    paymentMethod: str(payment.paymentMethod) ?? str(payment.method),
    periodStart: null,
    periodEnd: null,
    cancelAtPeriodEnd: false,
    paidAt: str(p.createdAt),
    raw,
  };
}

/** Normaliza um payload conforme o gateway (ponto único de entrada). */
export function normalizeEvent(gateway: Gateway, raw: unknown): NormalizedEvent {
  if (gateway === 'kirvano') return normalizeKirvano(raw);
  if (gateway === 'ggcheckout') return normalizeGGCheckout(raw);
  throw new Error(`Gateway desconhecido: ${gateway}`);
}
