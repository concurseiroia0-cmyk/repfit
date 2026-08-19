import { useEffect, useState } from 'react';

/**
 * Detecta se o teclado virtual está aberto no celular.
 *
 * Com `interactive-widget=resizes-content` (index.html) o layout viewport
 * encolhe quando o teclado abre no Android — o `window.innerHeight` diminui.
 * No iOS o teclado sobrepõe o conteúdo e quem encolhe é o `visualViewport`.
 *
 * A detecção é reforçada com:
 *  - Reset periódico (200ms): se a viewport estiver estável e no tamanho
 *    "cheio" por 3 frames seguidos, força teclado fechado.
 *  - Evento `focusout`: quando um campo perde foco, aguarda 120ms e reavalia
 *    (fecha o teclado geralmente leva ~100ms no iOS/Android).
 */
export function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let fullHeight = window.innerHeight;
    let stableCount = 0;
    const vv = window.visualViewport;

    const check = () => {
      // Referência: maior altura já vista (teclado fechado).
      fullHeight = Math.max(fullHeight, window.innerHeight);

      const currentH = window.innerHeight;
      const vvH = vv ? vv.height : currentH;
      const thresh = fullHeight * 0.8;

      const resized = currentH < thresh; // Android (resizes-content)
      const overlaid = vvH < currentH * 0.8; // iOS (overlay)

      const keyboardDetected = resized || overlaid;
      setOpen(keyboardDetected);

      // Se a viewport voltou ao tamanho cheio, reseta o contador de estabilidade.
      if (!keyboardDetected) {
        stableCount++;
      } else {
        stableCount = 0;
      }
    };

    // Check periódico: se a viewport estiver estável 3x seguidas, fecha.
    const interval = window.setInterval(() => {
      if (stableCount >= 3) {
        setOpen(false);
      }
    }, 200);

    // Quando o foco sai de um campo de texto, reavalia após um breve delay
    // (o teclado fecha em ~100ms depois do blur).
    const onFocusOut = () => {
      window.setTimeout(check, 120);
    };

    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    vv?.addEventListener('resize', check);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
      vv?.removeEventListener('resize', check);
      document.removeEventListener('focusout', onFocusOut);
      window.clearInterval(interval);
    };
  }, []);

  return open;
}
