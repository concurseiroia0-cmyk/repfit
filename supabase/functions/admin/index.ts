// ============================================================================
// Painel administrativo (edge function).
// ----------------------------------------------------------------------------
// Protegida por: JWT válido do Supabase (verify_jwt = true no config.toml) +
// e-mail na lista de donos (app_config.owner_emails ∪ env OWNER_EMAILS).
//
// Ações (POST /functions/v1/admin):
//   { action: 'simulate', gateway, event, email, plan } → processa como o webhook real
//   { action: 'grant', email, plan, durationMinutes }   → acesso gratuito manual
//   { action: 'revoke', grantId }                        → revoga acesso gratuito
//   { action: 'events', limit }                          → últimos webhooks
//   { action: 'grants' }                                 → concessões ativas
//   { action: 'config' }                                 → URLs dos webhooks + donos
//
// O simulador usa o MESMO processador dos webhooks reais (processEvent).
// ============================================================================

import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  getRevenueMetrics,
  grantFreeAccess,
  listActiveGrants,
  listRecentEvents,
  processEvent,
  revokeGrant,
} from '../_shared/processor.ts';
import { getOwnerEmails } from '../_shared/owners.ts';
import type { Gateway } from '../_shared/types.ts';

const APP_ORIGIN = Deno.env.get('SUPABASE_URL')?.includes('ybhiyi')
  ? 'https://concurseiroia0-cmyk.github.io'
  : '*';
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': APP_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

// ---------------------------------------------------------------------------
// Payloads de exemplo para o SIMULADOR (mesma estrutura real de cada gateway).
// ---------------------------------------------------------------------------

function isoNow(): string {
  return new Date().toISOString();
}

function isoPlusDays(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

function sampleKirvano(event: string, email: string, plan: string): Record<string, unknown> {
  const base = {
    checkout_id: 'SIMULATOR_CHECKOUT',
    sale_id: `SIMULATOR_SALE_${Date.now()}`,
    payment_method: 'PIX',
    total_price: 'R$ 49,90',
    type: 'RECURRING',
    created_at: isoNow().replace('T', ' ').slice(0, 19),
    customer: { name: 'Usuário Teste', email, document: '00000000000', phone_number: '5511999999999' },
    payment: { method: 'PIX', finished_at: isoNow() },
    plan: { name: plan, charge_frequency: 'MONTHLY', next_charge_date: isoPlusDays(30).replace('T', ' ').slice(0, 19) },
    products: [{ id: 'sim-product', name: plan, offer_id: 'sim-offer', offer_name: plan, price: 'R$ 49,90' }],
  };
  switch (event) {
    case 'SALE_APPROVED':
      return { ...base, event: 'SALE_APPROVED', event_description: 'Compra aprovada (assinatura)', status: 'APPROVED' };
    case 'SUBSCRIPTION_CANCELED':
      return { ...base, event: 'SUBSCRIPTION_CANCELED', event_description: 'Assinatura cancelada', status: 'CANCELED' };
    case 'SALE_REFUSED':
      return { ...base, event: 'SALE_REFUSED', event_description: 'Compra recusada / inadimplência', status: 'REFUSED' };
    case 'SALE_CHARGEBACK':
      return { ...base, event: 'SALE_CHARGEBACK', event_description: 'Chargeback', status: 'CHARGEBACK' };
    default:
      return { ...base, event, event_description: event };
  }
}

function sampleGGCheckout(event: string, email: string, plan: string): Record<string, unknown> {
  const payment = (status: string, method: string) => ({
    id: `SIMULATOR_PAY_${Date.now()}`,
    method,
    paymentMethod: method.split('.')[0],
    gateway: 'simulador',
    status,
    amount: 49.0,
  });
  switch (event) {
    case 'card.paid':
      return {
        event: 'card.paid', createdAt: isoNow(),
        customer: { name: 'Usuário Teste', email, document: '00000000000', phone: '5511999999999', ip: '177.45.23.100' },
        payment: payment('paid', 'card.paid'),
        product: { id: 'sim-product', type: 'main', title: plan },
        products: [{ id: 'sim-product', type: 'main', title: plan, price: 4900 }],
        webhook: { id: 'webhook_sim', businessId: 'sim', events: ['card.paid'] },
      };
    case 'card.failed':
      return {
        event: 'card.failed', createdAt: isoNow(),
        customer: { name: 'Usuário Teste', email, document: '00000000000', phone: '5511999999999', ip: '177.45.23.100' },
        payment: payment('failed', 'card.failed'),
        product: { id: 'sim-product', type: 'main', title: plan },
        products: [{ id: 'sim-product', type: 'main', title: plan, price: 4900 }],
        webhook: { id: 'webhook_sim', businessId: 'sim', events: ['card.failed'] },
      };
    case 'card.refunded':
      return {
        event: 'card.refunded', createdAt: isoNow(),
        customer: { name: 'Usuário Teste', email, document: '00000000000', phone: '5511999999999', ip: '177.45.23.100' },
        payment: payment('refunded', 'card.refunded'),
        product: { id: 'sim-product', type: 'main', title: plan },
        products: [{ id: 'sim-product', type: 'main', title: plan, price: 4900 }],
        webhook: { id: 'webhook_sim', businessId: 'sim', events: ['card.refunded'] },
      };
    default:
      return {
        event, createdAt: isoNow(),
        customer: { name: 'Usuário Teste', email, document: '00000000000', phone: '5511999999999', ip: '177.45.23.100' },
        payment: payment('pending', event),
        product: { id: 'sim-product', type: 'main', title: plan },
        products: [{ id: 'sim-product', type: 'main', title: plan, price: 4900 }],
        webhook: { id: 'webhook_sim', businessId: 'sim', events: [event] },
      };
  }
}

function buildSamplePayload(gateway: Gateway, event: string, email: string, plan: string): Record<string, unknown> {
  return gateway === 'kirvano' ? sampleKirvano(event, email, plan) : sampleGGCheckout(event, email, plan);
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  // Pré-voo CORS: 204 SEM corpo (corpo em 204 lança TypeError no runtime).
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') return json({ ok: false, error: 'Método não permitido' }, 405);

  // 1) Autenticação: JWT do Supabase (verify_jwt já exige; valida de novo aqui).
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  if (!token) return json({ ok: false, error: 'Não autenticado' }, 401);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { data: authData } = await supabase.auth.getUser(token);
  const user = authData.user;
  if (!user) return json({ ok: false, error: 'Sessão inválida' }, 401);

  // 2) Autorização: apenas donos.
  const owners = await getOwnerEmails();
  if (!owners.includes((user.email ?? '').toLowerCase())) {
    return json({ ok: false, error: 'Acesso negado: apenas o dono do RepFit' }, 403);
  }

  // 3) Ação.
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: 'JSON inválido' }, 400);
  }
  // Validação de tamanho: previne payloads excessivamente grandes.
  const rawBody = JSON.stringify(body);
  if (rawBody.length > 8192) {
    return json({ ok: false, error: 'Payload excede 8 KB' }, 413);
  }
  const action = String(body.action ?? '');
  if (action.length > 50) {
    return json({ ok: false, error: 'Ação inválida' }, 400);
  }
  const adminEmail = (user.email ?? '').toLowerCase();

  try {
    switch (action) {
      case 'simulate': {
        const gateway = String(body.gateway ?? '') as Gateway;
        const event = String(body.event ?? '');
        const email = String(body.email ?? '').trim();
        const plan = String(body.plan ?? 'RepFit');
        if (gateway !== 'kirvano' && gateway !== 'ggcheckout') {
          return json({ ok: false, error: 'Gateway inválido' }, 400);
        }
        if (!email || !event) return json({ ok: false, error: 'E-mail e evento são obrigatórios' }, 400);
        const payload = buildSamplePayload(gateway, event, email, plan);
        const result = await processEvent(gateway, payload);
        return json({ ok: true, action: 'simulate', result });
      }

      case 'grant': {
        const email = String(body.email ?? '').trim();
        const plan = String(body.plan ?? 'RepFit');
        const durationMinutes = Number(body.durationMinutes);
        if (!email) return json({ ok: false, error: 'E-mail obrigatório' }, 400);
        if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
          return json({ ok: false, error: 'Duração inválida' }, 400);
        }
        const result = await grantFreeAccess({ email, planName: plan, durationMinutes, grantedBy: adminEmail });
        return json({ ok: true, action: 'grant', result });
      }

      case 'revoke': {
        const grantId = String(body.grantId ?? '');
        if (!grantId) return json({ ok: false, error: 'grantId obrigatório' }, 400);
        const result = await revokeGrant(grantId, adminEmail);
        return json({ ok: true, action: 'revoke', result });
      }

      case 'events': {
        const events = await listRecentEvents(Number(body.limit) || 10);
        return json({ ok: true, action: 'events', events });
      }

      case 'metrics': {
        const metrics = await getRevenueMetrics();
        return json({ ok: true, action: 'metrics', metrics });
      }

      case 'grants': {
        const grants = await listActiveGrants();
        return json({ ok: true, action: 'grants', grants });
      }

      case 'config': {
        const url = Deno.env.get('SUPABASE_URL') ?? '';
        return json({
          ok: true,
          action: 'config',
          webhooks: {
            kirvano: `${url}/functions/v1/webhook-kirvano`,
            ggcheckout: `${url}/functions/v1/webhook-ggcheckout`,
          },
          owners,
          adminEmail,
        });
      }

      default:
        return json({ ok: false, error: `Ação desconhecida: ${action}` }, 400);
    }
  } catch (err) {
    return json({ ok: false, error: err instanceof Error ? err.message : 'erro interno' }, 500);
  }
});
