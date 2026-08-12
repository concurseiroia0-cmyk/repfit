/**
 * Ajuda para inputs no celular: o teclado reduz o "visual viewport" DEPOIS do
 * focus — se o campo ficar coberto, o usuário digita sem ver os números
 * (problema clássico no Chrome Android). Esta função mantém o campo visível:
 * agenda rolagens pós-focus e reage ao redimensionamento do visualViewport
 * enquanto o campo estiver focado.
 */
export function scheduleKeepInputVisible(el: HTMLInputElement | HTMLTextAreaElement, delays: number[] = [0, 260, 620]) {
  const run = () => {
    try {
      const vv = window.visualViewport;
      const rect = el.getBoundingClientRect();
      const bottom = vv ? vv.height : window.innerHeight;
      if (rect.top < 0 || rect.bottom > bottom) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    } catch {
      /* navegadores antigos */
    }
  };

  for (const d of delays) window.setTimeout(run, d);

  // O teclado pode abrir (e redimensionar o viewport) lentamente — reage a
  // cada resize enquanto o campo estiver com foco, depois limpa no blur.
  const onResize = () => {
    if (document.activeElement === el) run();
  };
  const onBlur = () => {
    window.visualViewport?.removeEventListener('resize', onResize);
    el.removeEventListener('blur', onBlur);
  };
  window.visualViewport?.addEventListener('resize', onResize);
  el.addEventListener('blur', onBlur);
}
