// ============================================================================
// Serviço do painel administrativo.
// ----------------------------------------------------------------------------
// Fala com a edge function `admin` (Supabase) usando a sessão do usuário.
// A edge function valida o JWT e confere se o e-mail é de DONO antes de agir.
// ============================================================================

import { SUPABASE_ANON_KEY, SUPABASE_URL, OWNER_EMAILS, isSupabaseConfigured } from './config';
import { getSupabase } from './client';

export interface AdminResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

async function callAdmin<T = unknown>(action: string, body: Record<string, unknown> = {}): Promise<AdminResult<T>> {
  const sb = getSupabase();
  if (!sb || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { ok: false, error: 'Supabase não configurado (.env).' };
  }
  const { data } = await sb.auth.getSession();
  if (!data.session) return { ok: false, error: 'Você precisa estar logado.' };

  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}/functions/v1/admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${data.session.access_token}`,
      },
      body: JSON.stringify({ action, ...body }),
    });
  } catch (err) {
    // fetch lança quando o pré-voo CORS falha ou sem rede. Inclui o motivo real.
    const detail = err instanceof Error && err.message ? ` (${err.message})` : '';
    return { ok: false, error: `Sem conexão com a nuvem (função admin não alcançável)${detail}.` };
  }

  const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } & T | null;
  if (!res.ok || !json) {
    const message = json && typeof json === 'object' && 'error' in json
      ? String((json as { error?: unknown }).error)
      : `HTTP ${res.status}`;
    return { ok: false, error: message };
  }
  return { ok: true, data: json as T };
}

// ---------------------------------------------------------------------------
// Ações do painel
// ---------------------------------------------------------------------------

export const adminApi = {
  simulate: (gateway: 'kirvano' | 'ggcheckout', event: string, email: string, plan: string) =>
    callAdmin('simulate', { gateway, event, email, plan }),

  grant: (email: string, plan: string, durationMinutes: number) =>
    callAdmin('grant', { email, plan, durationMinutes }),

  revoke: (grantId: string) => callAdmin('revoke', { grantId }),

  events: (limit = 10) => callAdmin<{ events: unknown[] }>('events', { limit }),

  grants: () => callAdmin<{ grants: unknown[] }>('grants'),

  config: () => callAdmin<{ webhooks: { kirvano: string; ggcheckout: string }; owners: string[]; adminEmail: string }>('config'),
};

// ---------------------------------------------------------------------------
// Donos (env ∪ app_config no banco — fonte dinâmica sem rebuild)
// ---------------------------------------------------------------------------

export async function getOwnerEmails(): Promise<string[]> {
  const owners = new Set(OWNER_EMAILS.map((e) => e.trim().toLowerCase()).filter(Boolean));
  if (isSupabaseConfigured) {
    try {
      const sb = getSupabase();
      if (sb) {
        const { data } = await sb.from('app_config').select('value').eq('key', 'owner_emails').maybeSingle();
        const arr = data?.value;
        if (Array.isArray(arr)) {
          for (const e of arr) {
            const t = String(e).trim().toLowerCase();
            if (t) owners.add(t);
          }
        }
      }
    } catch {
      // sem internet/erro → usa apenas os do env
    }
  }
  return [...owners];
}
