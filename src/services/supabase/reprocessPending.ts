// ============================================================================
// Reprocessamento de webhooks pendentes (cliente).
// ----------------------------------------------------------------------------
// Quem COMPROU antes de se cadastrar: o webhook chegou com status 'no-user'
// (e-mail ainda não existia). Quando o usuário entra com o Google, chamamos a
// edge function `reprocess-pending` — ela aplica os eventos pendentes do
// e-mail dele e a assinatura aparece na hora, liberando o acesso no 1º login.
//
// A chamada é segura: o e-mail vem do JWT do usuário (nunca do corpo) e a
// função só age sobre eventos 'no-user' do próprio e-mail.
// ============================================================================

import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './config';
import { getSupabase } from './client';

export interface ReprocessResult {
  ok: boolean;
  /** processed (aplicou eventos) | noop (nada pendente) | skipped (já tem acesso) | no-user | error | signed-out | unconfigured */
  status: string;
  processed?: number;
  error?: string;
}

/**
 * Aplica webhooks pendentes do usuário logado (best effort — nunca lança).
 * Deve ser chamado ao abrir o app com sessão / logo após o login, ANTES de
 * buscar a assinatura.
 */
export async function reprocessPendingSubscriptions(): Promise<ReprocessResult> {
  if (!isSupabaseConfigured || !SUPABASE_URL || !SUPABASE_ANON_KEY) return { ok: false, status: 'unconfigured' };
  const sb = getSupabase();
  if (!sb) return { ok: false, status: 'unconfigured' };

  const { data } = await sb.auth.getSession();
  if (!data.session) return { ok: false, status: 'signed-out' };

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/reprocess-pending`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${data.session.access_token}`,
      },
    });
    const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (!res.ok || !json) {
      return {
        ok: false,
        status: 'error',
        error: json && typeof json.error === 'string' ? json.error : `HTTP ${res.status}`,
      };
    }
    return {
      ok: true,
      status: typeof json.status === 'string' ? json.status : 'ok',
      processed: typeof json.processed === 'number' ? json.processed : 0,
    };
  } catch (err) {
    return {
      ok: false,
      status: 'error',
      error: err instanceof Error ? err.message : 'sem conexão',
    };
  }
}
