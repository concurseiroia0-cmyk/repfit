import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

const KEY = 'repfit.offline-ready';

/**
 * Aviso exibido UMA vez quando o service worker termina de pré-carregar o
 * app inteiro: a partir daí o RepFit funciona 100% sem internet.
 */
export function OfflineReadyNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) === '1') {
        setShow(true);
        localStorage.removeItem(KEY);
      }
    } catch {
      /* ignora */
    }
  }, []);

  if (!show) return null;

  return (
    <div
      role="status"
      className="mb-4 flex items-start gap-2.5 rounded-2xl border border-emerald-300/60 bg-emerald-50 p-3.5 text-sm text-emerald-800 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-300"
    >
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        <b>App pronto para funcionar 100% offline.</b> Todo o RepFit já está salvo neste dispositivo — pode
        desligar a internet que seus dados e o app continuam funcionando.
      </span>
    </div>
  );
}
