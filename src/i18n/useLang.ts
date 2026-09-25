// ============================================================================
// Hook de idioma para os componentes React.
// Re-renderiza a árvore quando o idioma muda e expõe helpers de formatação
// (datas/números) no idioma ativo.
// ============================================================================

import { useSyncExternalStore } from 'react';
import i18n, { currentLang, isEn, type Lang } from './index';
import { enUS, ptBR } from 'date-fns/locale';

/** Locale do date-fns para o idioma ativo. */
export function dateLocale() {
  return isEn() ? enUS : ptBR;
}

/** Locale BCP-47 para Intl (números, datas nativas). */
export function intlLocale(): string {
  return currentLang();
}

/** Formata 'YYYY-MM-DD' no idioma ativo (padrão dd/MM/yyyy ou MMM d, yyyy). */
export function formatDateLocale(s: string, pattern = 'P'): string {
  const [y, m, d] = s.split('-').map(Number);
  const date = new Date(y || 1970, (m || 1) - 1, d || 1);
  return new Intl.DateTimeFormat(intlLocale(), { dateStyle: 'medium' }).format(date);
}

/** Formata número no idioma ativo (22.5 -> "22,5" em pt / "22.5" em en). */
export function formatNumberLocale(n: number): string {
  return new Intl.NumberFormat(intlLocale(), { maximumFractionDigits: 1 }).format(n);
}

interface LangState {
  lang: Lang;
  /** Contador que muda a cada troca (força re-render). */
  version: number;
}

let state: LangState = { lang: currentLang(), version: 0 };
const listeners = new Set<() => void>();

i18n.on('languageChanged', (lng) => {
  state = { lang: (lng as Lang) ?? 'pt-BR', version: state.version + 1 };
  listeners.forEach((l) => l());
});

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): LangState {
  return state;
}

/**
 * Hook que assina mudanças de idioma do i18next.
 * Retorna { lang, t } — t é a função de tradução (chave natural em pt-BR).
 */
export function useLang(): { lang: Lang; t: (key: string, opts?: Record<string, unknown>) => string } {
  useSyncExternalStore(subscribe, getSnapshot);
  const t = (key: string, opts?: Record<string, unknown>): string =>
    i18n.t(key, opts ?? {}) as string;
  return { lang: state.lang, t };
}
