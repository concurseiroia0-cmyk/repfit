import { useCallback, useEffect, useRef, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export interface PwaInstall {
  /** O navegador aceita instalação (beforeinstallprompt disponível). */
  canInstall: boolean;
  /** Já está rodando como app instalado (tela cheia / tela de início). */
  installed: boolean;
  /** Abre o diálogo nativo de instalação. Retorna true se o usuário aceitou. */
  promptInstall: () => Promise<boolean>;
}

/**
 * Gerencia o fluxo de instalação do PWA:
 * - captura o evento `beforeinstallprompt` e permite chamar `prompt()` sob gesto do usuário;
 * - detecta se o app já está instalado (display-mode standalone / iOS).
 */
export function usePwaInstall(): PwaInstall {
  const deferred = useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(isStandalone);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferred.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };
    const onInstalled = () => {
      setInstalled(true);
      setCanInstall(false);
    };
    const onDisplayMode = () => {
      if (isStandalone()) {
        setInstalled(true);
        setCanInstall(false);
      }
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener('resize', onDisplayMode);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('resize', onDisplayMode);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    const e = deferred.current;
    if (!e) return false;
    await e.prompt();
    const choice = await e.userChoice;
    if (choice.outcome === 'accepted') {
      deferred.current = null;
      setCanInstall(false);
      setInstalled(true);
      return true;
    }
    return false;
  }, []);

  return { canInstall, installed, promptInstall };
}
