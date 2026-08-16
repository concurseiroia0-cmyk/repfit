// ============================================================================
// Vinculação de dispositivo (browser ↔ PWA) — serviço frontend.
// ----------------------------------------------------------------------------
// Fala com a edge function `device-link` do Supabase:
//   generate  → cria um código de 6 dígitos para o usuário LOGADO (JWT) — exibe
//               no Chrome para digitar no PWA;
//   redeem    → o PWA (sem sessão) envia o código e recebe { url } — um magic
//               link do Supabase que autentica a MESMA conta sem OAuth de novo.
//
// Nenhuma credencial sensível vai para o frontend; a autenticação final é a
// sessão REAL criada pelo Supabase ao abrir a URL (mesmo fluxo do OAuth).
// ============================================================================

import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './config';
import { getSupabase } from './client';
import { buildGoogleRedirectUrl } from './client';

export interface GenerateCodeResult {
  ok: boolean;
  code?: string;
  expiresInSeconds?: number;
  error?: string;
}

export interface RedeemCodeResult {
  ok: boolean;
  url?: string;
  error?: string;
}

/** URL de retorno dentro do app (a mesma usada pelo OAuth do Google). */
export function deviceLinkRedirectUrl(): string {
  return buildGoogleRedirectUrl(`${window.location.origin}${import.meta.env.BASE_URL}`);
}

/**
 * Gera um código de vinculação para o usuário AUTENTICADO (Chrome).
 * Exige sessão válida — a edge function valida o JWT antes de emitir o código.
 */
export async function generateDeviceLinkCode(): Promise<GenerateCodeResult> {
  if (!isSupabaseConfigured || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { ok: false, error: 'Supabase não configurado (.env).' };
  }
  const sb = getSupabase();
  if (!sb) return { ok: false, error: 'Supabase não configurado (.env).' };
  const { data } = await sb.auth.getSession();
  if (!data.session) return { ok: false, error: 'Você precisa estar logado para gerar um código.' };

  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}/functions/v1/device-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${data.session.access_token}`,
      },
      body: JSON.stringify({ action: 'generate' }),
    });
  } catch (err) {
    const detail = err instanceof Error && err.message ? ` (${err.message})` : '';
    return { ok: false, error: `Sem conexão com a nuvem${detail}.` };
  }

  const payload = (await res.json().catch(() => null)) as {
    ok?: boolean;
    code?: string;
    expiresInSeconds?: number;
    error?: string;
  } | null;
  if (!res.ok || !payload?.ok || !payload.code) {
    return { ok: false, error: payload?.error ?? `HTTP ${res.status}` };
  }
  return { ok: true, code: payload.code, expiresInSeconds: payload.expiresInSeconds };
}

/**
 * Valida o código digitado no PWA (sem sessão) e devolve a URL do magic link.
 * O PWA abre essa URL → o Supabase cria a sessão real e volta para o app.
 * Qualquer erro retorna a mensagem genérica (não revela se o código existe).
 */
export async function redeemDeviceLinkCode(code: string): Promise<RedeemCodeResult> {
  if (!isSupabaseConfigured || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { ok: false, error: 'Supabase não configurado (.env).' };
  }

  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}/functions/v1/device-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        action: 'redeem',
        code,
        redirectTo: deviceLinkRedirectUrl(),
      }),
    });
  } catch (err) {
    const detail = err instanceof Error && err.message ? ` (${err.message})` : '';
    return { ok: false, error: `Sem conexão com a nuvem${detail}.` };
  }

  const payload = (await res.json().catch(() => null)) as {
    ok?: boolean;
    url?: string;
    error?: string;
  } | null;
  if (!res.ok || !payload?.ok || !payload.url) {
    return { ok: false, error: payload?.error ?? 'Código inválido ou expirado.' };
  }
  return { ok: true, url: payload.url };
}
