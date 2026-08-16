/**
 * Fonte do wordmark "RepFit" do card de mapa muscular (Hammersmith One).
 *
 * A fonte fica em public/fonts (copiada para a raiz do build) e o @font-face é
 * injetado via JS com import.meta.env.BASE_URL — resolve certo em dev (/) e em
 * produção (/repfit/). Está no documento antes da exportação, então o
 * html-to-image embute a fonte no PNG; e o PWA (NetworkFirst same-origin) a
 * mantém disponível offline após o primeiro acesso.
 */
const BASE = import.meta.env.BASE_URL;

let injected = false;

export function ensureBrandFont(): void {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const style = document.createElement('style');
  style.setAttribute('data-repfit-font', '');
  style.textContent = `@font-face{font-family:'Hammersmith One';font-style:normal;font-weight:400;font-display:swap;src:url(${BASE}fonts/hammersmith-one.woff2) format('woff2')}`;
  document.head.appendChild(style);
}
