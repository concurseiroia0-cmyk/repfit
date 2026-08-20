// ============================================================================
// Edge function: activate-trial
// ----------------------------------------------------------------------------
// Ativa o trial de 15 dias para o usuário autenticado.
//
// Regras:
//   1. Usuário deve estar autenticado (JWT válido)
//   2. Um usuário só pode ativar UMA VEZ (profiles.trial_activated_at)
//   3. Cria access_grants com origin = 'trial' (já é tratado por hasActiveAccess)
//   4. Atualiza profiles com datas de trial
//
// Segurança: verify_jwt = true (validado pelo Supabase Gateway)
// ============================================================================

import { createClient } from 'npm:@supabase/supabase-js@2';

const TRIAL_DAYS = 15;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ ok: false, error: 'Método não permitido' }, 405);
  }

  // 1) Autenticação via JWT
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  if (!token) return json({ ok: false, error: 'Não autenticado' }, 401);

  // Service client para escritas
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  // Valida o token
  const supabaseAnon = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { data: authData } = await supabaseAnon.auth.getUser(token);
  const user = authData.user;
  if (!user) return json({ ok: false, error: 'Sessão inválida' }, 401);

  const userId = user.id;
  const email = (user.email ?? '').toLowerCase();

  // 2) Verificar se já tem trial
  const { data: profile } = await supabase
    .from('profiles')
    .select('trial_activated_at, trial_expires_at, trial_status')
    .eq('id', userId)
    .maybeSingle();

  if (profile?.trial_activated_at) {
    return json({
      ok: true,
      alreadyActive: true,
      expiresAt: profile.trial_expires_at,
      message: 'Trial já ativado anteriormente.',
    });
  }

  // 3) Criar timestamps (usar hora do servidor)
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  // 4) Criar access_grants com origin = 'trial'
  const { error: grantError } = await supabase
    .from('access_grants')
    .insert({
      user_id: userId,
      email,
      plan_name: 'RepFit Trial',
      origin: 'trial',
      duration_minutes: TRIAL_DAYS * 24 * 60,
      access_until: expiresAt.toISOString(),
      status: 'active',
      granted_by: 'system/trial',
    });

  if (grantError) {
    console.error('[activate-trial] Erro ao criar grant:', grantError.message);
    return json({ ok: false, error: `Falha ao criar trial: ${grantError.message}` }, 500);
  }

  // 5) Atualizar profiles com dados do trial
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      trial_activated_at: now.toISOString(),
      trial_expires_at: expiresAt.toISOString(),
      trial_status: 'active',
    })
    .eq('id', userId);

  if (profileError) {
    console.error('[activate-trial] Erro ao atualizar profile:', profileError.message);
    // Grant foi criado, mas profile falhou — o grant ainda libera acesso.
    // Não reverter (o grant é a fonte de verdade do acesso).
  }

  return json({
    ok: true,
    expiresAt: expiresAt.toISOString(),
    activatedAt: now.toISOString(),
    daysRemaining: TRIAL_DAYS,
  });
});
