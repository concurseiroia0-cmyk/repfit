// ============================================================================
// Hook React de autenticação do Supabase.
// ----------------------------------------------------------------------------
// Reativo: ao logar/deslogar (popup ou redirect do Google), `user` atualiza
// sozinho. Sem Supabase configurado, `configured = false` e nada quebra.
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import { isSupabaseConfigured } from './config';
import {
  getCurrentUser,
  onAuthChange,
  signInWithGoogle as doSignIn,
  signOut as doSignOut,
  type AuthUser,
} from './client';

export interface SupabaseAuth {
  /** Usuário autenticado (ou null). */
  user: AuthUser | null;
  /** Primeira checagem de sessão em andamento. */
  loading: boolean;
  /** True quando VITE_SUPABASE_URL/ANON_KEY existem. */
  configured: boolean;
  /** Abre o popup de login do Google. */
  signIn: () => Promise<{ error: Error | null }>;
  /** Encerra a sessão (dados locais permanecem). */
  signOut: () => Promise<{ error: Error | null }>;
}

export function useSupabaseAuth(): SupabaseAuth {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    let mounted = true;
    void getCurrentUser().then((u) => {
      if (mounted) {
        setUser(u);
        setLoading(false);
      }
    });
    const unsubscribe = onAuthChange((u) => {
      if (mounted) setUser(u);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async () => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.') };
    }
    return doSignIn();
  }, []);

  const signOut = useCallback(async () => doSignOut(), []);

  return { user, loading, configured: isSupabaseConfigured, signIn, signOut };
}
