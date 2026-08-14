import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ToastProvider } from './components/ui/Toast';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { NewWorkoutPage } from './pages/NewWorkoutPage';
import { HistoryPage } from './pages/HistoryPage';
import { WorkoutDetailPage } from './pages/WorkoutDetailPage';
import { CalendarPage } from './pages/CalendarPage';
import { EvolutionPage } from './pages/EvolutionPage';
import { MeasurementsPage } from './pages/MeasurementsPage';
import { SettingsPage } from './pages/SettingsPage';
import { WelcomePage } from './pages/WelcomePage';
import { ProfileSetupPage } from './pages/ProfileSetupPage';
import { LoginPage } from './pages/LoginPage';
import { SyncManager } from './components/SyncManager';
import { SubscriptionGate } from './components/SubscriptionGate';
import { useSettings } from './services/settingsService';
import { db } from './db/db';

// Base do deploy (ex.: '/repfit/' no GitHub Pages). O router precisa saber que
// o app vive em um subcaminho para gerar os links certos.
const ROUTER_BASE = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

/**
 * Mostra a tela de boas-vindas no primeiro uso (sem dados e sem ter sido
 * dispensada). Quem já tem dados nunca é redirecionado — não interrompe o uso.
 */
function WelcomeGate({ children }: { children: ReactNode }) {
  const settings = useSettings();
  const workoutCount = useLiveQuery(() => db.workouts.count(), [], null);
  const location = useLocation();

  if (workoutCount === null) return null; // evita flash enquanto carrega
  if (!settings.welcomeSeen && workoutCount === 0) {
    return <Navigate to="/boas-vindas" replace />;
  }
  // Logo após as boas-vindas, quem ainda não preencheu o perfil é
  // convidado a informar sexo/idade/altura/peso (pode pular).
  if (!settings.profileDone && workoutCount === 0) {
    return <Navigate to="/perfil" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter basename={ROUTER_BASE}>
      <ToastProvider>
        {/* Sincronização automática (login/reconexão) — inofensiva sem .env */}
        <SyncManager />
        <Routes>
          <Route path="/boas-vindas" element={<WelcomePage />} />
          <Route path="/perfil" element={<ProfileSetupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <SubscriptionGate>
                <WelcomeGate>
                  <AppLayout />
                </WelcomeGate>
              </SubscriptionGate>
            }
          >
            <Route path="/" element={<HomePage />} />
            <Route path="/novo" element={<NewWorkoutPage />} />
            <Route path="/editar/:id" element={<NewWorkoutPage />} />
            <Route path="/treino/:id" element={<WorkoutDetailPage />} />
            <Route path="/historico" element={<HistoryPage />} />
            <Route path="/calendario" element={<CalendarPage />} />
            <Route path="/medidas" element={<MeasurementsPage />} />
            <Route path="/evolucao" element={<EvolutionPage />} />
            <Route path="/configuracoes" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
