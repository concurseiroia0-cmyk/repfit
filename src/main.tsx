import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { PwaUpdateBanner } from './components/PwaUpdateBanner';
import { seedCatalogIfEmpty } from './db/seed';
import { useSettings } from './services/settingsService';
import { useTheme } from './hooks/useTheme';
import { ensurePersistentStorage } from './utils/storage';
import './index.css';

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
    <PwaUpdateBanner />
  </StrictMode>
);
