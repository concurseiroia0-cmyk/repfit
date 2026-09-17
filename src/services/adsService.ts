/**
 * Serviço de anúncios do Google AdSense (ca-pub-9155959825288070).
 *
 * A vinheta (Vignette / interstitial) é um formato automático do AdSense:
 * o próprio Google decide quando exibi-la (geralmente entre navegações),
 * mas ela só pode aparecer se o script do AdSense estiver carregado.
 * Por isso, após cada treino salvo, garantimos que o script está presente.
 *
 * O script só é injetado se o domínio atual estiver na lista de domínios
 * verificados — evita carregar AdSense em localhost/preview e garante que
 * o Google só valide tráfego do domínio aprovado.
 */

/** ID do publisher do AdSense. */
export const ADSENSE_CLIENT = 'ca-pub-9155959825288070';

/** Domínios onde os anúncios são permitidos (verificados no Google AdSense). */
const DOMINIOS_PERMITIDOS = [
  'repfit.inosaas.com.br',
  'www.repfit.inosaas.com.br',
];

/** URL base do script do AdSense. */
const ADSENSE_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;

/** Retorna true se o domínio atual está na lista de domínios verificados. */
export function isDominioVerificado(): boolean {
  try {
    const host = window.location.hostname;
    return DOMINIOS_PERMITIDOS.some(
      (d) => host === d || host.endsWith(`.${d}`),
    );
  } catch {
    return false;
  }
}

/** Injeta o script do AdSense no <head> (idempotente). */
function injectAdSenseScript(): void {
  if (document.querySelector('script[data-adsense]')) return;
  const s = document.createElement('script');
  s.async = true;
  s.src = ADSENSE_SRC;
  s.crossOrigin = 'anonymous';
  s.dataset.adsense = 'true';
  document.head.appendChild(s);
}

/** Garante que o AdSense está carregado (se o domínio for verificado). */
export function ensureAdSense(): void {
  if (!isDominioVerificado()) return;
  injectAdSenseScript();
}

/**
 * Dispara a vinheta (interstitial) do AdSense.
 *
 * A vinheta é um formato automático: o Google decide se/quando mostrar,
 * respeitando limites de frequência por usuário. Nossa função apenas
 * sinaliza uma nova "navegação" (fim do treino) para dar ao Google a
 * oportunidade de exibi-la.
 *
 * Chamada após salvar cada treino com sucesso.
 */
export function mostrarVinhetaAposTreino(): void {
  if (!isDominioVerificado()) return;
  ensureAdSense();
  // Sinaliza ao Google que houve uma navegação — é o gatilho que o
  // AdSense usa para avaliar a exibição da vinheta.
  window.setTimeout(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).adsbygoogle = (window as any).adsbygoogle || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).adsbygoogle.push({} as Record<string, unknown>);
    } catch {
      // AdSense bloqueado (adblock, offline): ignorar silenciosamente.
    }
  }, 0);
}
