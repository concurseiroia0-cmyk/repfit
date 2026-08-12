import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn, uid } from '../../utils/misc';

type ToastKind = 'success' | 'info' | 'error';
interface ToastItem {
  id: string;
  message: string;
  kind: ToastKind;
}

const ToastContext = createContext<{ push: (message: string, kind?: ToastKind) => void }>({
  push: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

const ICONS: Record<ToastKind, ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />,
  info: <Info className="h-5 w-5 shrink-0 text-sky-500" />,
  error: <XCircle className="h-5 w-5 shrink-0 text-rose-500" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = uid();
    setToasts((t) => [...t, { id, message, kind }]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4200);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur',
              'animate-[toast-in_.25s_ease-out]',
              'border-slate-200 bg-white/95 text-slate-800 dark:border-white/15 dark:bg-slate-800/95 dark:text-slate-100'
            )}
          >
            {ICONS[t.kind]}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
      <style>{`@keyframes toast-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </ToastContext.Provider>
  );
}
