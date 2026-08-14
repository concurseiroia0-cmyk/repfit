// ============================================================================
// Cliente Supabase (tipado com Database) + helpers de autenticação.
// ----------------------------------------------------------------------------
// Autenticação: Supabase Auth com Google OAuth (já habilitado no painel).
// O perfil é criado automaticamente pelo trigger handle_new_user (0001).
//
// Se o Supabase não estiver configurado (sem .env), TODAS as funções retornam
// null/erro — o app continua 100% offline/IndexedDB como antes.
// ============================================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database, ProfileRow } from '../../types/supabase';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './config';

let client: SupabaseClient<Database> | null = null;

/** Retorna o cliente (ou null quando não configurado). */
export function getSupabase(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured || !SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (!client) {
    client = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true, // mantém login entre sessões (localStorage)
        autoRefreshToken: true,
        detectSessionInUrl: true, // captura o callback do OAuth (redirect)
      },
    });
  }
  return client;
}

export const supabaseUnavailable = (): never => {
  throw new Error('Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.');
};

/** Login com Google (popup). Redireciona de volta para a origem após autenticar. */
export async function signInWithGoogle(): Promise<{
  error: Error | null;
}> {
  const sb = getSupabase();
  if (!sb) return { error: supabaseUnavailable() };
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // Resolve para a base do app (ex.: '/repfit/' no GitHub Pages) para o
      // callback do Google voltar para o app e não para a raiz do domínio.
      redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
    },
  });
  return { error: error ? new Error(error.message) : null };
}

/** Encerra a sessão local (não apaga os dados locais do IndexedDB). */
export async function signOut(): Promise<{ error: Error | null }> {
  const sb = getSupabase();
  if (!sb) return { error: supabaseUnavailable() };
  const { error } = await sb.auth.signOut();
  return { error: error ? new Error(error.message) : null };
}

export interface AuthUser {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
}

/** Usuário autenticado no momento (ou null). */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.auth.getUser();
  if (error || !data.user) return null;
  const meta = data.user.user_metadata ?? {};
  return {
    id: data.user.id,
    email: data.user.email ?? null,
    fullName: (meta.full_name as string | undefined) ?? (meta.name as string | undefined) ?? null,
    avatarUrl: (meta.avatar_url as string | undefined) ?? (meta.picture as string | undefined) ?? null,
  };
}

/** Observa mudanças de autenticação (login/logout/refresh). Retorna unsubscribe. */
export function onAuthChange(cb: (user: AuthUser | null) => void): () => void {
  const sb = getSupabase();
  if (!sb) return () => undefined;
  const { data } = sb.auth.onAuthStateChange((_event, session) => {
    if (!session?.user) {
      cb(null);
      return;
    }
    const meta = session.user.user_metadata ?? {};
    cb({
      id: session.user.id,
      email: session.user.email ?? null,
      fullName: (meta.full_name as string | undefined) ?? (meta.name as string | undefined) ?? null,
      avatarUrl: (meta.avatar_url as string | undefined) ?? (meta.picture as string | undefined) ?? null,
    });
  });
  return () => data.subscription.unsubscribe();
}

/**
 * Garante que o perfil existe e sincroniza nome/avatar do provedor com o banco
 * (o trigger handle_new_user já cria na primeira entrada; este é o reforço).
 */
export async function upsertProfile(
  user: AuthUser
): Promise<{ profile: ProfileRow | null; error: Error | null }> {
  const sb = getSupabase();
  if (!sb) return { profile: null, error: supabaseUnavailable() };
  const { error } = await sb
    .from('profiles')
    .upsert(
      { id: user.id, full_name: user.fullName, email: user.email, avatar_url: user.avatarUrl },
      { onConflict: 'id' }
    );
  if (error) return { profile: null, error: new Error(error.message) };
  const { data } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
  return { profile: data ?? null, error: null };
}
