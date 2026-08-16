// ============================================================================
// SyncManager — sincronização AUTOMÁTICA IndexedDB ↔ Supabase.
// ----------------------------------------------------------------------------
// Dispara syncAll() quando:
//   1. o app abre com uma sessão já ativa;
//   2. o usuário entra (login Google ou código de vinculação);
//   3. a internet volta (evento 'online');
//   4. o app volta ao primeiro plano (visibilitychange → visible) — cobre o
//      retorno do magic link de vinculação e o PWA reaberto no celular.
// Com throttle de 60s e tudo guardado em try/catch — nunca lança, nunca
// interrompe o uso offline. Sem Supabase configurado, não faz nada.
//
// Quando há dados novos (enviados ou baixados), mostra um TOAST para o usuário
// saber que o celular acabou de receber o histórico da nuvem (ex.: treinos e
// medidas feitos em outro dispositivo).
// ============================================================================

import { useEffect, useRef } from 'react';
import { getCurrentUser, onAuthChange } from '../services/supabase/client';
import { isSupabaseConfigured } from '../services/supabase/config';
import { runSync } from '../services/supabase/syncState';
import { useToast } from './ui/Toast';

const THROTTLE_MS = 60_000;

export function SyncManager() {
  const lastRunRef = useRef(0);
  const { push } = useToast();

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const maybeSync = () => {
      const now = Date.now();
      if (now - lastRunRef.current < THROTTLE_MS) return;
      lastRunRef.current = now;
      void runSync().then((result) => {
        if (result.status !== 'ok') return;
        const total =
          result.pushed +
          result.pulled +
          result.measurementsPushed +
          result.measurementsPulled;
        if (total === 0) return;
        const parts: string[] = [];
        if (result.pushed > 0) parts.push(`${result.pushed} treino(s) enviados`);
        if (result.pulled > 0) parts.push(`${result.pulled} treino(s) baixados`);
        if (result.measurementsPushed > 0) parts.push(`${result.measurementsPushed} medida(s) enviadas`);
        if (result.measurementsPulled > 0) parts.push(`${result.measurementsPulled} medida(s) baixadas`);
        push(`Sincronizado: ${parts.join(', ')}.`, 'success');
      });
    };

    // Sessão já ativa ao abrir o app.
    void getCurrentUser().then((u) => {
      if (u) maybeSync();
    });

    // Login/deslogar (Google ou código de vinculação).
    const unsubscribe = onAuthChange((u) => {
      if (u) maybeSync();
    });

    // Internet voltou.
    window.addEventListener('online', maybeSync);

    // App voltou ao primeiro plano (reaberto, aba ativa de novo, retorno do
    // magic link de vinculação) — garante o pull do histórico em qualquer lugar.
    const onVisible = () => {
      if (document.visibilityState === 'visible') maybeSync();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      unsubscribe();
      window.removeEventListener('online', maybeSync);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [push]);

  return null;
}
