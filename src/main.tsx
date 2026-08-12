import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { seedCatalogIfEmpty } from './db/seed';
import { useSettings } from './services/settingsService';
import { useTheme } from './hooks/useTheme';
import { ensurePersistentStorage } from './utils/storage';
import './index.css';

// Registra o service worker (PWA/offline).
// Quando o pré-carregamento do app inteiro termina, marca para mostrar
// o aviso "pronto para funcionar offline" na próxima tela.
registerSW({
  immediate: true,
  onOfflineReady() {
    try {
      localStorage.setItem('repfit.offline-ready', '1');
    } catch {
      /* sem localStorage — ignora */
    }
  },
});

// Garante o catálogo inicial de sugestões.
void seedCatalogIfEmpty();

// Pede ao navegador para não limpar os dados do app automaticamente.
void ensurePersistentStorage();

function ThemeSync() {
  const settings = useSettings();
  useTheme(settings.theme);
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeSync />
  </StrictMode>
);
