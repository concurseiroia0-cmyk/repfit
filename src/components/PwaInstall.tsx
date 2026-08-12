import { Download, Share } from 'lucide-react';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { useToast } from './ui/Toast';

/**
 * Botão de instalação do PWA.
 * - Navegadores com `beforeinstallprompt`: abre o diálogo nativo.
 * - iOS: mostra um toast com as instruções (Compartilhar → Adicionar à Tela de Início).
 */
export function InstallAppButton({
  label = 'Instalar o app',
  size = 'md',
  full = false,
  className,
}: {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  full?: boolean;
  className?: string;
}) {
  const { canInstall, installed, promptInstall } = usePwaInstall();
  const { push } = useToast();

  if (installed) return null;

  async function handleClick() {
    if (canInstall) {
      const ok = await promptInstall();
      if (ok) push('App instalado! ⚡ Ele agora abre como um aplicativo.', 'success');
    } else if (isIOSHint()) {
      push('No iPhone/iPad: toque em Compartilhar → “Adicionar à Tela de Início”.', 'info');
    } else {
      push('Use o ícone de instalar na barra de endereço do navegador.', 'info');
    }
  }

  const sizes = { sm: 'h-9 px-3 text-sm gap-1.5', md: 'h-10 px-4 text-sm gap-2', lg: 'h-12 px-6 text-base gap-2' };

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      className={`inline-flex items-center justify-center rounded-full bg-amber-400 font-semibold text-black shadow-[0_4px_20px_rgba(251,191,36,0.35)] transition-all duration-150 hover:bg-amber-300 active:bg-amber-500 enabled:hover:-translate-y-0.5 active:translate-y-0 motion-reduce:translate-y-0 ${sizes[size]} ${
        full ? 'w-full' : ''
      } ${className ?? ''}`}
    >
      {canInstall || !isIOSHint() ? <Download className="h-4 w-4" /> : <Share className="h-4 w-4" />}
      {label}
    </button>
  );
}

function isIOSHint(): boolean {
  try {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  } catch {
    return false;
  }
}
