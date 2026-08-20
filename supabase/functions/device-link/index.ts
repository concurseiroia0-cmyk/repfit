// ============================================================================
// Vinculação de dispositivo (browser ↔ PWA) — edge function `device-link`.
// ----------------------------------------------------------------------------
// URL: https://ybhiyiobmcoszmvrwkef.supabase.co/functions/v1/device-link
//
// Ações (POST):
//   { action: 'generate' }                  → requer JWT válido do Supabase
//       Gera um código de 6 dígitos (criptograficamente seguro, uso único,
//       5 min), guarda apenas SHA-256(código + DEVICE_LINK_PEPPER) e devolve o
//       código em texto puro APENAS para o chamador autenticado.
//   { action: 'redeem', code, redirectTo }  → público (sem JWT)
//       Valida o código (expiração, uso único, tentativas) e o marca como usado
//       ATOMICAMENTE via RPC claim_device_link_code; então gera um magic link
//       do Supabase para o dono do código. Retorna { ok, url } — o PWA abre a
//       URL, que cria a sessão REAL do Supabase para o MESMO usuário e volta
//       para o app via redirect.
//
// Segurança:
//   * nunca expõe user_id/e-mail no redeem (mensagem genérica em qualquer erro);
//   * o código não fica em texto puro no banco (hash + pepper em secret);
//   * uso único + tentativas limitadas (5) + expiração de 5 min;
//   * 'generate' valida o JWT manualmente (deploy com --no-verify-jwt porque o
//     'redeem' é público — o PWA não tem JWT antes de conectar);
//   * service_role NUNCA vai para o frontend — fica só nesta função.
// ============================================================================

import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  DEVICE_CODE_MAX_ATTEMPTS,
  DEVICE_CODE_TTL_SECONDS,
  generateDeviceCode,
  hashDeviceCode,
  normalizeDeviceCode,
} from '../_shared/deviceLink.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

/** Mensagem genérica para qualquer falha no redeem (evita enumeração). */
const GENERIC_REDEEM_ERROR = 'Código inválido ou expirado.';

/** Redirecionamento só aceita http(s) — nunca javascript:/data:/etc. */
function isSafeRedirectUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json({ ok: false, error: 'Método não permitido' }, 405);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: 'JSON inválido' }, 400);
  }
  // Validação de tamanho: previne payloads excessivamente grandes.
  const rawBody = JSON.stringify(body);
  if (rawBody.length > 2048) {
    return json({ ok: false, error: 'Payload excede 2 KB' }, 413);
  }

  const action = String(body.action ?? '');
  if (action.length > 30) {
    return json({ ok: false, error: 'Ação inválida' }, 400);
  }

  // Cliente com service_role — só existe DENTRO da edge function.
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const pepper = Deno.env.get('DEVICE_LINK_PEPPER');

  // -------------------------------------------------------------------------
  // GERAR (autenticado)
  // -------------------------------------------------------------------------
  if (action === 'generate') {
    const authHeader = req.headers.get('authorization') ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    if (!token) return json({ ok: false, error: 'Não autenticado' }, 401);

    const { data: authData } = await supabase.auth.getUser(token);
    const user = authData.user;
    if (!user) return json({ ok: false, error: 'Sessão inválida' }, 401);
    if (!pepper) {
      console.error('[device-link] DEVICE_LINK_PEPPER não configurado');
      return json({ ok: false, error: 'Servidor mal configurado' }, 500);
    }

    // Invalida códigos anteriores ainda não usados (um código ativo por usuário)
    // e limpa os já expirados desse usuário.
    await supabase
      .from('device_link_codes')
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('used_at', null)
      .is('revoked_at', null);
    await supabase
      .from('device_link_codes')
      .delete()
      .eq('user_id', user.id)
      .lt('expires_at', new Date().toISOString());

    // Gera e tenta inserir; colisão de hash (mesmo código gerado por acaso) →
    // tenta de novo. Espaço de 10^6 — colisão raríssima, mas tratada.
    const expiresAt = new Date(Date.now() + DEVICE_CODE_TTL_SECONDS * 1000).toISOString();
    let inserted = false;
    let code = '';
    for (let attempt = 0; attempt < 5 && !inserted; attempt++) {
      code = generateDeviceCode();
      const codeHash = await hashDeviceCode(code, pepper);
      const { error } = await supabase.from('device_link_codes').insert({
        user_id: user.id,
        code_hash: codeHash,
        expires_at: expiresAt,
      });
      if (!error) inserted = true;
    }
    if (!inserted) {
      console.error('[device-link] falha ao inserir código (colisões repetidas)');
      return json({ ok: false, error: 'Não foi possível gerar o código' }, 500);
    }

    return json({
      ok: true,
      code,
      expiresInSeconds: DEVICE_CODE_TTL_SECONDS,
    });
  }

  // -------------------------------------------------------------------------
  // REDEEM (público — sem JWT)
  // -------------------------------------------------------------------------
  if (action === 'redeem') {
    if (!pepper) {
      console.error('[device-link] DEVICE_LINK_PEPPER não configurado');
      return json({ ok: false, error: 'Servidor mal configurado' }, 500);
    }
    const code = normalizeDeviceCode(String(body.code ?? ''));
    if (!code) return json({ ok: false, error: GENERIC_REDEEM_ERROR }, 400);

    const redirectTo = String(body.redirectTo ?? '');
    if (!isSafeRedirectUrl(redirectTo)) {
      return json({ ok: false, error: 'redirectTo inválido' }, 400);
    }

    const codeHash = await hashDeviceCode(code, pepper);

    // Reivindicação atômica no banco (RPC): retorna user_id só quando o código
    // é válido e não usado; registra tentativas inválidas para o limite.
    const { data: userId, error: claimError } = await supabase.rpc('claim_device_link_code', {
      p_code_hash: codeHash,
      p_max_attempts: DEVICE_CODE_MAX_ATTEMPTS,
    });
    if (claimError) {
      console.error('[device-link] erro ao reivindicar código:', claimError.message);
      return json({ ok: false, error: GENERIC_REDEEM_ERROR }, 500);
    }
    if (!userId) {
      return json({ ok: false, error: GENERIC_REDEEM_ERROR }, 400);
    }

    // Código válido → identifica o usuário e gera um magic link REAL do Supabase.
    // O PWA abre essa URL: o GoTrue confirma, cria a sessão e redireciona de
    // volta para o app — mesma conta, sem reautenticar no Google.
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    const email = userData.user?.email;
    if (!email) {
      console.error('[device-link] usuário sem e-mail (impossível vincular)');
      return json({ ok: false, error: GENERIC_REDEEM_ERROR }, 500);
    }

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo },
    });
    if (linkError || !linkData?.properties.action_link) {
      console.error('[device-link] falha ao gerar magic link:', linkError?.message ?? 'sem action_link');
      return json({ ok: false, error: GENERIC_REDEEM_ERROR }, 500);
    }

    return json({
      ok: true,
      url: linkData.properties.action_link,
    });
  }

  return json({ ok: false, error: `Ação desconhecida: ${action}` }, 400);
});
