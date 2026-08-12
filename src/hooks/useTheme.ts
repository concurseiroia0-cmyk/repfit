import { useEffect } from 'react';
import type { ThemeMode } from '../types';

const STORAGE_KEY = 'diario.tema';

export function effectiveTheme(theme: ThemeMode): 'light' | 'dark' {
  if (theme === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

/** Aplica a classe 'dark' no <html> e guarda um espelho em localStorage (anti-flash). */
export function useTheme(theme: ThemeMode): void {
  useEffect(() => {
    const eff = effectiveTheme(theme);
    document.documentElement.classList.toggle('dark', eff === 'dark');
    try {
      localStorage.setItem(STORAGE_KEY, eff);
    } catch {
      // ignora
    }
  }, [theme]);
}
