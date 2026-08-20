// ============================================================================
// Serviço de trial de 15 dias grátis.
// ----------------------------------------------------------------------------
// O trial é armazenado como um access_grants com origin = 'trial'.
// A validação é feita pelo backend (edge function activate-trial) que:
//   1. Verifica se o usuário já tem trial (profiles.trial_activated_at IS NOT NULL)
//   2. Cria access_grants com origin = 'trial', duration = 15 dias
//   3. Atualiza profiles com trial_activated_at, trial_expires_at, trial_status
//
// A função hasActiveAccess() (subscription.ts) já trata o grant como acesso
// válido — nenhuma mudança necessária na lógica de gating.
// ============================================================================

import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './supabase/config';
import { getSupabase } from './supabase/client';

const TRIAL_DURATION_DAYS = 15;

export interface TrialInfo {
  activated: boolean;
  activatedAt: string | null;
  expiresAt: string | null;
  daysRemaining: number | null;
  status: string; // 'none' | 'active' | 'expired' | 'converted'
}

/**
 * Informações do trial a partir do profile do usuário.
 * Chamado no frontend para exibir banner e status.
 */
export function getTrialInfo(profile: {
  trial_activated_at: string | null;
  trial_expires_at: string | null;
  trial_status: string;
} | null): TrialInfo {
  if (!profile || profile.trial_status === 'none' || !profile.trial_activated_at) {
    return { activated: false, activatedAt: null, expiresAt: null, daysRemaining: null, status: 'none' };
  }

  const now = Date.now();
  const expiresMs = profile.trial_expires_at ? new Date(profile.trial_expires_at).getTime() : null;
  const daysRemaining = expiresMs != null
    ? Math.max(0, Math.ceil((expiresMs - now) / (24 * 60 * 60 * 1000)))
    : null;

  // Determinar status efetivo (pode ter expirado sem trigger de update)
  let effectiveStatus = profile.trial_status;
  if (effectiveStatus === 'active' && expiresMs != null && expiresMs <= now) {
    effectiveStatus = 'expired';
  }

  return {
    activated: true,
    activatedAt: profile.trial_activated_at,
    expiresAt: profile.trial_expires_at,
    daysRemaining,
    status: effectiveStatus,
  };
}

/**
 * Ativa o trial de 15 dias para o usuário logado.
 * Retorna o resultado da edge function.
 */
export async function activateTrial(): Promise<{
  ok: boolean;
  expiresAt?: string;
  error?: string;
  alreadyActive?: boolean;
}> {
  if (!isSupabaseConfigured || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { ok: false, error: 'Supabase não configurado.' };
  }

  const sb = getSupabase();
  if (!sb) return { ok: false, error: 'Supabase não disponível.' };

  const { data } = await sb.auth.getSession();
  if (!data.session) return { ok: false, error: 'Você precisa estar logado.' };

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/activate-trial`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${data.session.access_token}`,
      },
      body: JSON.stringify({}),
    });

    const json = await res.json().catch(() => null) as {
      ok?: boolean;
      expiresAt?: string;
      error?: string;
      alreadyActive?: boolean;
    } | null;

    if (!res.ok || !json) {
      return { ok: false, error: json?.error ?? `HTTP ${res.status}` };
    }

    return {
      ok: json.ok ?? false,
      expiresAt: json.expiresAt,
      error: json.error,
      alreadyActive: json.alreadyActive,
    };
  } catch (err) {
    const detail = err instanceof Error && err.message ? ` (${err.message})` : '';
    return { ok: false, error: `Sem conexão com a nuvem${detail}.` };
  }
}

/**
 * Busca o profile do usuário no Supabase para obter dados de trial.
 */
export async function fetchTrialProfile(): Promise<TrialInfo | null> {
  if (!isSupabaseConfigured) return null;
  const sb = getSupabase();
  if (!sb) return null;

  const { data: authData } = await sb.auth.getUser();
  if (!authData.user) return null;

  const { data } = await sb
    .from('profiles')
    .select('trial_activated_at, trial_expires_at, trial_status')
    .eq('id', authData.user.id)
    .maybeSingle();

  return getTrialInfo(data);
}
