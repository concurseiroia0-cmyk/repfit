import { Outlet } from 'react-router-dom';
import { WifiOff } from 'lucide-react';
import { useOnline } from '../../hooks/useOnline';
import { BottomNav, Sidebar } from './Navigation';

function OfflineBanner() {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-xs font-semibold text-amber-800 shadow-lg dark:border-amber-400/40 dark:bg-amber-400/15 dark:text-amber-300">
        <WifiOff className="h-3.5 w-3.5" />
        Offline — seus dados continuam salvos neste dispositivo
      </div>
    </div>
  );
}

export function AppLayout() {
  const online = useOnline();

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:pl-64">
        <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 sm:px-6 lg:pb-14 lg:pt-8">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      {!online && <OfflineBanner />}
    </div>
  );
}
