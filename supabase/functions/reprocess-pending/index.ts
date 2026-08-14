// ============================================================================
// reprocess-pending — aplica webhooks que chegaram ANTES do cadastro.
// ----------------------------------------------------------------------------
// URL: https://ybhiyiobmcoszmvrwkef.supabase.co/functions/v1/reprocess-pending
//
// Quando um webhook chega para um e-mail que ainda não existe no banco, o
// evento fica com status 'no-user' (pendente). Quando o usuário SE CADASTRA
// (Google), o app chama esta função com o JWT dele: ela localiza os eventos
// 'no-user' daquele e-mail e aplica a assinatura automaticamente — quem
// comprou antes de se cadastrar (com o mesmo e-mail) já entra com acesso.
//
// Segurança:
//   * O e-mail vem do JWT do usuário logado (NUNCA do corpo da requisição) —
//     ninguém reprocessa evento de outro usuário;
//   * A escrita usa a service role (auto-injetada), que ignora RLS;
//   * claim atômico (no-user → processing) + reenvio idempotente;
//   * se o usuário já possui acesso, nada é alterado.
// ============================================================================

import { createClient } from 'npm:@supabase/supabase-js@2';
import { reprocessPendingEventsForUser } from '../_shared/processor.ts';

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

Deno.serve(async (req) => {
  // Pré-voo CORS: 204 SEM corpo (corpo em 204 lança TypeError no runtime).
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json({ ok: false, error: 'Método não permitido' }, 405);
  }

  // 1) Autenticação: JWT do Supabase — o e-mail vem do TOKEN, nunca do corpo.
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
  if (!user?.email) return json({ ok: false, error: 'Sessão inválida' }, 401);

  try {
    const result = await reprocessPendingEventsForUser(user.email);
    return json({ ok: true, ...result });
  } catch (err) {
    return json(
      { ok: false, error: err instanceof Error ? err.message : 'erro interno' },
      500
    );
  }
});
