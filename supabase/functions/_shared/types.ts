// ============================================================================
// Tipos compartilhados do processador de webhooks (Kirvano + GGCheckout).
// Formato INTERNO único após a normalização.
// ============================================================================

export type Gateway = 'kirvano' | 'ggcheckout';

export type NormalizedEventType =
  | 'subscription_created'
  | 'subscription_activated'
  | 'subscription_renewed'
  | 'payment_approved'
  | 'payment_pending'
  | 'payment_failed'
  | 'subscription_canceled'
  | 'subscription_expired'
  | 'refund_created'
  | 'chargeback'
  | 'unknown';

/** Ação de acesso derivada do evento normalizado. */
export type AccessAction = 'grant' | 'cancel' | 'revoke' | 'noop' | 'unknown';

/** Estados internos aceitos pela tabela subscriptions. */
export type InternalStatus =
  | 'active'
  | 'trial'
  | 'past_due'
  | 'canceled'
  | 'expired'
  | 'pending'
  | 'lifetime'
  | 'refunded'
  | 'chargeback'
  | 'unknown';

export interface NormalizedEvent {
  gateway: Gateway;
  /** Chave de idempotência (evento/transação único da plataforma). */
  eventId: string;
  /** Nome ORIGINAL do evento (ex.: 'SALE_APPROVED', 'pix.paid'). */
  eventType: string;
  normalized: NormalizedEventType;
  action: AccessAction;
  status: InternalStatus;
  email: string;
  product: string | null;
  plan: string | null;
  amount: number | null;
  currency: string | null;
  subscriptionId: string | null;
  transactionId: string | null;
  paymentMethod: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  paidAt: string | null;
  /** Payload ORIGINAL recebido (auditoria). */
  raw: unknown;
}

export interface WebhookResult {
  ok: boolean;
  status:
    | 'processed'
    | 'duplicate'
    | 'no-user'
    | 'invalid'
    | 'unknown'
    | 'error';
  eventId?: string;
  eventType?: string;
  email?: string;
  error?: string;
}
