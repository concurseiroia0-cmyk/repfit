// ============================================================================
// Helpers do fluxo de vinculação de dispositivo (browser ↔ PWA).
// ----------------------------------------------------------------------------
// Funções PURAS (sem Deno/Supabase) para serem testadas com vitest.
// Usam apenas WebCrypto — disponível em Deno, navegador e Node 20+.
// ============================================================================

/** Quantos segundos o código permanece válido (5 minutos). */
export const DEVICE_CODE_TTL_SECONDS = 300;

/** Máximo de tentativas inválidas antes de bloquear o código (força bruta). */
export const DEVICE_CODE_MAX_ATTEMPTS = 5;

/**
 * Gera um código de 6 dígitos criptograficamente seguro e uniforme.
 * Usa rejeição por amostragem para eliminar o viés do módulo (2^32 % 10^6 ≠ 0).
 */
export function generateDeviceCode(): string {
  const upper = 1_000_000;
  const limit = Math.floor(0x1_0000_0000 / upper) * upper; // maior múltiplo de 10^6 ≤ 2^32
  const buf = new Uint32Array(1);
  let n = 0;
  do {
    crypto.getRandomValues(buf);
    n = buf[0];
  } while (n >= limit);
  return String(n % upper).padStart(6, '0');
}

/** Normaliza a entrada: mantém apenas dígitos. Retorna null se não forem 6. */
export function normalizeDeviceCode(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  return /^\d{6}$/.test(digits) ? digits : null;
}

/** SHA-256 hex do código + pepper (nunca armazenar o código em texto puro). */
export async function hashDeviceCode(code: string, pepper: string): Promise<string> {
  const data = new TextEncoder().encode(`${pepper}:${code}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Comparação em tempo constante (evita timing attack na busca por hash). */
export function timingSafeEqual(a: string, b: string): boolean {
  const bufA = new TextEncoder().encode(a);
  const bufB = new TextEncoder().encode(b);
  if (bufA.length !== bufB.length) return false;
  let diff = 0;
  for (let i = 0; i < bufA.length; i++) diff |= bufA[i] ^ bufB[i];
  return diff === 0;
}
