// ============================================================================
// Internacionalização (pt-BR / en-US).
// ----------------------------------------------------------------------------
// Estratégia: as CHAVES são os textos originais em pt-BR (chaves naturais).
// Assim o português já funciona sem dicionário e o inglês é um mapa PT → EN.
//
// Ordem de escolha do idioma:
//   1. escolha manual salva (localStorage 'repfit-lang', escrito nas Configurações);
//   2. idioma do navegador (aceita pt-* como português; outros caem no inglês
//      só se existir tradução — o fallback final é sempre pt-BR).
// ============================================================================

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enUS from './en-US.json';

export const LANGS = ['pt-BR', 'en-US'] as const;
export type Lang = (typeof LANGS)[number];

export const LANG_STORAGE_KEY = 'repfit-lang';

/** Traduções em inglês (chave = texto em pt-BR). */
const enUSResources = { translation: enUS };

// Detector simples: localStorage → navegador → pt-BR.
function detectLanguage(): Lang {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'en-US' || saved === 'pt-BR') return saved;
    const nav = navigator.language?.toLowerCase() ?? '';
    if (nav.startsWith('en')) return 'en-US';
  } catch {
    // localStorage/navigator indisponível (SSR/webview restrito): usa pt-BR.
  }
  return 'pt-BR';
}

void i18n.use(initReactI18next).init({
  resources: { 'en-US': enUSResources },
  lng: detectLanguage(),
  fallbackLng: 'pt-BR',
  // Chaves naturais: pt-BR usa a própria chave como texto.
  partialBundledLanguages: true,
  interpolation: { escapeValue: false },
  returnEmptyString: false,
});

/** Idioma ativo ('pt-BR' | 'en-US'). */
export function currentLang(): Lang {
  return (i18n.language as Lang) ?? 'pt-BR';
}

/** true quando o idioma ativo é o inglês. */
export function isEn(): boolean {
  return currentLang().startsWith('en');
}

/** Troca o idioma e persiste a escolha manual. */
export async function changeLang(lang: Lang): Promise<void> {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // sem persistência, só troca para a sessão.
  }
  await i18n.changeLanguage(lang);
  document.documentElement.lang = lang;
}

// Sincroniza o atributo lang do <html> no carregamento (com guarda para
// ambientes sem DOM, ex.: testes unitários em Node).
if (typeof document !== 'undefined') {
  document.documentElement.lang = currentLang();
}

export default i18n;
