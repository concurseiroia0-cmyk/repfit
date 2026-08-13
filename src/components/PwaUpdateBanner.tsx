import { RefreshCw } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Aviso de versão nova (PWA): quando um build mais novo é publicado, o
 * service worker detecta e este banner aparece — o usuário recarrega e passa
 * a rodar o código novo. Sem isso, quem já tinha o app aberto continuaria com
 * o JavaScript antigo até recarregar por conta própria (era o motivo do bug
 * da foto preta \"continuar\" mesmo com a correção publicada no servidor).
 *
 * Só aparece em produção (em dev o service worker está desabilitado).
 */
export function PwaUpdateBanner() {
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onOfflineReady() {
      // Marca para mostrar \"pronto para funcionar offline\" na próxima tela.
      try {
        localStorage.setItem('repfit.offline-ready', '1');
      } catch {
        /* sem localStorage — ignora */
      }
    },
  });

  if (!needRefresh && !offlineReady) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] flex justify-center p-3">
      <div
        role="status"
        className="pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl border border-amber-400/40 bg-slate-900/95 px-4 py-3 text-sm shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur"
      >
        <span className="shrink-0 text-amber-400">
          <RefreshCw className="h-5 w-5" />
        </span>
        <span className="font-semibold text-slate-100">
          {needRefresh ? 'Nova versão disponível' : 'Pronto para funcionar offline'}
        </span>
        {needRefresh && (
          <button
            type="button"
            onClick={() => void updateServiceWorker()}
            className="shrink-0 rounded-full bg-amber-400 px-3.5 py-1.5 text-xs font-bold text-black transition-transform duration-150 hover:-translate-y-0.5"
          >
            Recarregar
          </button>
        )}
      </div>
    </div>
  );
}
