/**
 * Salvar/compartilhar a imagem do card.
 * Compartilhar = Web Share API com o arquivo PNG (funciona no celular);
 * se a API não existir ou falhar, cai no download do arquivo.
 */

/** Baixa um Blob como arquivo (link temporário + clique). */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

type ShareResult = 'shared' | 'downloaded' | 'canceled';

/**
 * Compartilha o PNG via Web Share (celular/desktop). Retorna:
 * - 'shared'     → compartilhado (ou cancelado pelo usuário — não é erro)
 * - 'downloaded' → fallback: arquivo baixado
 * - 'canceled'   → usuário cancelou a share sheet nativa
 */
export async function shareImage(blob: Blob, filename: string): Promise<ShareResult> {
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  const file = new File([blob], filename, { type: 'image/png' });

  if (typeof navigator.share === 'function' && nav.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename, text: 'Meu treino no RepFit 💪' });
      return 'shared';
    } catch (err) {
      const e = err as Error;
      if (e?.name === 'AbortError') return 'canceled'; // usuário fechou a folha
      // outro erro → tenta download
    }
  }

  downloadBlob(blob, filename);
  return 'downloaded';
}
