// ============================================================================
// SyncManager — sincronização AUTOMÁTICA IndexedDB ↔ Supabase.
// ----------------------------------------------------------------------------
// Dispara syncAll() quando:
//   1. o app abre com uma sessão já ativa;
//   2. o usuário entra (login Google);
//   3. a internet volta (evento 'online').
// Com throttle de 60s e tudo guardado em try/catch — nunca lança, nunca
// interrompe o uso offline. Sem Supabase configurado, não faz nada.
// ============================================================================

import { useEffect, useRef } from 'react';
import { getCurrentUser, onAuthChange } from '../services/supabase/client';
import { isSupabaseConfigured } from '../services/supabase/config';
import { runSync } from '../services/supabase/syncState';

const THROTTLE_MS = 60_000;

export function SyncManager() {
  const lastRunRef = useRef(0);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const maybeSync = () => {
      const now = Date.now();
      if (now - lastRunRef.current < THROTTLE_MS) return;
      lastRunRef.current = now;
      void runSync();
    };

    // Sessão já ativa ao abrir o app.
    void getCurrentUser().then((u) => {
      if (u) maybeSync();
    });

    // Login/deslogar.
    const unsubscribe = onAuthChange((u) => {
      if (u) maybeSync();
    });

    // Internet voltou.
    window.addEventListener('online', maybeSync);

    return () => {
      unsubscribe();
      window.removeEventListener('online', maybeSync);
    };
  }, []);

  return null;
}
