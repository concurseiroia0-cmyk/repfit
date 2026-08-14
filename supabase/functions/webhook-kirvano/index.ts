// ============================================================================
// Webhook público da KIRVANO.
// ----------------------------------------------------------------------------
// URL: https://ybhiyiobmcoszmvrwkef.supabase.co/functions/v1/webhook-kirvano
// Segurança: token opcional configurado na Kirvano (Integrações → Webhooks →
// Token), validado contra KIRVANO_WEBHOOK_TOKEN (env secret).
// ============================================================================

import { processEvent } from '../_shared/processor.ts';
import { extractSecretFromHeaders, verifySecret } from '../_shared/security.ts';
import type { WebhookResult } from '../_shared/types.ts';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ ok: false, status: 'invalid', error: 'Método não permitido' }, 405);
  }

  // 1) Validação de segurança (antes de qualquer processamento).
  const secret = extractSecretFromHeaders(req.headers);
  const expected = Deno.env.get('KIRVANO_WEBHOOK_TOKEN');
  if (!verifySecret(secret, expected)) {
    console.warn('[kirvano] webhook REJEITADO: token inválido');
    return json({ ok: false, status: 'invalid', error: 'Token inválido' }, 401);
  }

  // 2) Corpo.
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, status: 'invalid', error: 'Payload não é JSON válido' }, 400);
  }

  // 3) Processador ÚNICO (mesmo do simulador).
  const result: WebhookResult = await processEvent('kirvano', payload);
  // Plataformas retentam em erro (>= 400): 200 para eventos válidos mesmo sem usuário.
  const status = result.ok ? 200 : 400;
  return json(result, status);
});
