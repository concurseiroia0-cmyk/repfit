// ============================================================================
// PROCESSADOR ÚNICO de assinatura.
// ----------------------------------------------------------------------------
// Usado pelos DOIS webhooks reais E pelo simulador do painel admin (mesma
// função — nada de lógica duplicada).
//
// Fluxo:
//   Gateway → Webhook → Validação de segurança → Normalização → Idempotência
//   → Processador único → Supabase → Atualização do acesso → Log → HTTP
//
// Segurança da escrita: usa a SERVICE ROLE (auto-injetada nas edge functions),
// que ignora RLS — nunca uma policy permissiva.
// ============================================================================

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import type { Gateway, NormalizedEvent, WebhookResult } from './types.ts';
import { normalizeEvent } from './normalize.ts';

export type DbClient = SupabaseClient;

function getServiceClient(): DbClient {
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ---------------------------------------------------------------------------
// Persistência do evento (auditoria)
// ---------------------------------------------------------------------------

async function persistEvent(
  supabase: DbClient,
  event: NormalizedEvent,
  processingStatus: string,
  error?: string
): Promise<string | null> {
  const { data, error: err } = await supabase
    .from('subscription_events')
    .insert({
      provider: event.gateway,
      external_event_id: event.eventId,
      event_type: event.eventType,
      normalized_event_type: event.normalized,
      payload: event.raw,
      email: event.email || null,
      product: event.product,
      plan: event.plan,
      processing_status: processingStatus,
      processed: processingStatus === 'processed',
      processed_at: processingStatus === 'processed' ? new Date().toISOString() : null,
      error: error ?? null,
    })
    .select('id')
    .single();
  if (err || !data) {
    console.error('[repfit-webhook] falha ao persistir evento:', err?.message ?? 'sem resposta');
    return null;
  }
  return data.id;
}

async function markEvent(supabase: DbClient, eventId: string, status: string, error?: string): Promise<void> {
  await supabase
    .from('subscription_events')
    .update({
      processing_status: status,
      processed: status === 'processed',
      processed_at: status === 'processed' ? new Date().toISOString() : null,
      error: error ?? null,
    })
    .eq('id', eventId);
}

// ---------------------------------------------------------------------------
// Idempotência: (provider, external_event_id) tem índice único no banco.
// ---------------------------------------------------------------------------

async function alreadyProcessed(supabase: DbClient, event: NormalizedEvent): Promise<boolean> {
  const { data } = await supabase
    .from('subscription_events')
    .select('id, processing_status')
    .eq('provider', event.gateway)
    .eq('external_event_id', event.eventId)
    .maybeSingle();
  return Boolean(data);
}

// ---------------------------------------------------------------------------
// Atualização da assinatura / pagamento / acesso
// ---------------------------------------------------------------------------

async function findUserIdByEmail(supabase: DbClient, email: string): Promise<string | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .ilike('email', email.trim())
    .maybeSingle();
  return data?.id ?? null;
}

async function upsertSubscription(supabase: DbClient, userId: string, e: NormalizedEvent): Promise<string | null> {
  const row = {
    user_id: userId,
    provider: e.gateway,
    external_customer_id: null,
    external_subscription_id: e.subscriptionId,
    plan_name: e.plan ?? e.product ?? 'RepFit',
    status: e.status,
    amount: e.amount,
    currency: e.currency ?? 'BRL',
    started_at: e.periodStart,
    current_period_start: e.periodStart,
    current_period_end: e.periodEnd,
    cancel_at_period_end: e.cancelAtPeriodEnd,
    canceled_at: e.action === 'cancel' ? new Date().toISOString() : null,
  };

  // 1) Tenta achar a assinatura existente (por id externo ou a mais recente do usuário).
  let id: string | null = null;
  if (e.subscriptionId) {
    const { data: byExt } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('external_subscription_id', e.subscriptionId)
      .maybeSingle();
    if (byExt) id = byExt.id;
  }
  if (!id) {
    const { data: latest } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latest) id = latest.id;
  }

  if (id) {
    const { error } = await supabase.from('subscriptions').update(row).eq('id', id);
    if (error) throw new Error(`Falha ao atualizar assinatura: ${error.message}`);
    return id;
  }
  const { data, error } = await supabase.from('subscriptions').insert(row).select('id').single();
  if (error) throw new Error(`Falha ao criar assinatura: ${error.message}`);
  return data.id;
}

async function insertPayment(supabase: DbClient, userId: string, subscriptionId: string | null, e: NormalizedEvent): Promise<void> {
  const status =
    e.normalized === 'payment_failed' ? 'failed'
    : e.normalized === 'refund_created' || e.normalized === 'chargeback' ? 'refunded'
    : e.normalized === 'payment_pending' ? 'pending'
    : 'paid';

  const { error } = await supabase.from('payments').insert({
    user_id: userId,
    subscription_id: subscriptionId,
    provider: e.gateway,
    external_payment_id: e.transactionId,
    amount: e.amount ?? 0,
    currency: e.currency ?? 'BRL',
    status,
    payment_method: e.paymentMethod,
    paid_at: status === 'paid' ? (e.paidAt ?? new Date().toISOString()) : null,
  });
  if (error) console.error('[repfit-webhook] falha ao registrar pagamento:', error.message);
}

// ---------------------------------------------------------------------------
// PROCESSADOR ÚNICO
// ---------------------------------------------------------------------------

export async function processEvent(gateway: Gateway, payload: unknown): Promise<WebhookResult> {
  const supabase = getServiceClient();
  let event: NormalizedEvent;
  try {
    event = normalizeEvent(gateway, payload);
  } catch (err) {
    return { ok: false, status: 'invalid', error: err instanceof Error ? err.message : 'payload inválido' };
  }

  if (!event.email) {
    await persistEvent(supabase, event, 'invalid', 'evento sem e-mail do comprador');
    return { ok: false, status: 'invalid', eventId: event.eventId, eventType: event.eventType, error: 'evento sem e-mail' };
  }

  // Idempotência: mesmo (provider, eventId) já processado → ignora.
  if (await alreadyProcessed(supabase, event)) {
    return { ok: true, status: 'duplicate', eventId: event.eventId, eventType: event.eventType, email: event.email };
  }

  const eventRowId = await persistEvent(supabase, event, 'received');
  if (!eventRowId) {
    return { ok: false, status: 'error', eventId: event.eventId, eventType: event.eventType, email: event.email, error: 'não foi possível registrar o evento' };
  }

  // Localiza o usuário pelo e-mail — NÃO cria usuário automaticamente.
  const userId = await findUserIdByEmail(supabase, event.email);
  if (!userId) {
    await markEvent(supabase, eventRowId, 'no-user');
    return { ok: true, status: 'no-user', eventId: event.eventId, eventType: event.eventType, email: event.email };
  }

  try {
    switch (event.action) {
      case 'grant': {
        const subId = await upsertSubscription(supabase, userId, event);
        await insertPayment(supabase, userId, subId, event);
        break;
      }
      case 'cancel': {
        await upsertSubscription(supabase, userId, event);
        break;
      }
      case 'revoke': {
        await upsertSubscription(supabase, userId, event); // status refunded/chargeback → sem acesso
        break;
      }
      case 'noop':
      case 'unknown':
      default:
        // Nenhuma alteração de acesso (eventos informativos/pendentes).
        break;
    }
    await markEvent(supabase, eventRowId, 'processed');
    return { ok: true, status: 'processed', eventId: event.eventId, eventType: event.eventType, email: event.email };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erro desconhecido';
    await markEvent(supabase, eventRowId, 'failed', message);
    return { ok: false, status: 'error', eventId: event.eventId, eventType: event.eventType, email: event.email, error: message };
  }
}

// ---------------------------------------------------------------------------
// Concessão / revogação de acesso gratuito (manual/free)
// ---------------------------------------------------------------------------

export async function grantFreeAccess(args: {
  email: string;
  planName?: string;
  durationMinutes: number;
  grantedBy: string;
}): Promise<WebhookResult & { accessUntil?: string }> {
  const supabase = getServiceClient();
  const email = args.email.trim().toLowerCase();
  if (!email) return { ok: false, status: 'invalid', error: 'e-mail vazio' };

  // Localiza o usuário; se não existir, cria (e-mail confirmado, senha aleatória)
  // — o trigger handle_new_user cria o profile automaticamente.
  let userId = await findUserIdByEmail(supabase, email);
  if (!userId) {
    const password = crypto.randomUUID();
    const { data: created, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: email },
    });
    if (error || !created?.user) {
      return { ok: false, status: 'error', error: `falha ao criar usuário: ${error?.message ?? 'sem resposta'}` };
    }
    userId = created.user.id;
  }

  const accessUntil = new Date(Date.now() + args.durationMinutes * 60_000).toISOString();
  const { data, error } = await supabase
    .from('access_grants')
    .insert({
      user_id: userId,
      email,
      plan_name: args.planName ?? 'RepFit',
      origin: 'manual/free',
      duration_minutes: args.durationMinutes,
      access_until: accessUntil,
      status: 'active',
      granted_by: args.grantedBy,
    })
    .select('id')
    .single();
  if (error) {
    return { ok: false, status: 'error', error: `falha ao conceder acesso: ${error.message}` };
  }

  return { ok: true, status: 'processed', email, accessUntil, eventId: data.id };
}

export async function revokeGrant(grantId: string, revokedBy: string): Promise<WebhookResult> {
  const supabase = getServiceClient();
  const { error } = await supabase
    .from('access_grants')
    .update({ status: 'revoked', revoked_at: new Date().toISOString(), revoked_by: revokedBy })
    .eq('id', grantId);
  if (error) return { ok: false, status: 'error', error: error.message };
  return { ok: true, status: 'processed', eventId: grantId };
}

export async function listRecentEvents(limit = 10): Promise<unknown[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('subscription_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listActiveGrants(): Promise<unknown[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('access_grants')
    .select('*')
    .eq('status', 'active')
    .order('granted_at', { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return data ?? [];
}
