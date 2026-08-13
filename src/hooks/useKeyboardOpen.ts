import { useEffect, useState } from 'react';

/**
 * Detecta se o teclado virtual está aberto no celular.
 *
 * Com `interactive-widget=resizes-content` (index.html) o layout viewport
 * encolhe quando o teclado abre no Android — o `window.innerHeight` diminui.
 * No iOS o teclado sobrepõe o conteúdo e quem encolhe é o `visualViewport`.
 * A função cobre os dois casos e usa o maior `innerHeight` visto como
 * referência de "altura sem teclado".
 */
export function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let fullHeight = window.innerHeight;
    const vv = window.visualViewport;

    const check = () => {
      // Referência: maior altura já vista (teclado fechado).
      fullHeight = Math.max(fullHeight, window.innerHeight);
      const resized = window.innerHeight < fullHeight * 0.8; // Android (resizes-content)
      const overlaid = vv ? vv.height < window.innerHeight * 0.8 : false; // iOS
      setOpen(resized || overlaid);
    };

    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    vv?.addEventListener('resize', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
      vv?.removeEventListener('resize', check);
    };
  }, []);

  return open;
}
