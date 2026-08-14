// ============================================================================
// Webhook público da GGCHECKOUT.
// ----------------------------------------------------------------------------
// URL: https://ybhiyiobmcoszmvrwkef.supabase.co/functions/v1/webhook-ggcheckout
// Segurança (documentação oficial): se um Secret for definido, a GGCheckout
// envia `Authorization: Bearer <secret>` E `x-secret: <secret>`.
// Validado contra GGCHECKOUT_WEBHOOK_SECRET (env secret).
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
  const expected = Deno.env.get('GGCHECKOUT_WEBHOOK_SECRET');
  if (!verifySecret(secret, expected)) {
    console.warn('[ggcheckout] webhook REJEITADO: secret inválido');
    return json({ ok: false, status: 'invalid', error: 'Secret inválido' }, 401);
  }

  // 2) Corpo.
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, status: 'invalid', error: 'Payload não é JSON válido' }, 400);
  }

  // 3) Processador ÚNICO (mesmo do simulador).
  const result: WebhookResult = await processEvent('ggcheckout', payload);
  const status = result.ok ? 200 : 400;
  return json(result, status);
});
