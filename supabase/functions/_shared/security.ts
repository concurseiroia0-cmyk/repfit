// ============================================================================
// Validação de segurança dos webhooks.
// ----------------------------------------------------------------------------
// Nunca confia no corpo do webhook: o token/secreto vem nas variáveis de
// ambiente (NUNCA no código) e é comparado com os headers da requisição.
// ============================================================================

/** Comparação em tempo constante (evita timing attack). */
export function timingSafeEqual(a: string, b: string): boolean {
  const bufA = new TextEncoder().encode(a);
  const bufB = new TextEncoder().encode(b);
  if (bufA.length !== bufB.length) return false;
  let diff = 0;
  for (let i = 0; i < bufA.length; i++) {
    diff |= bufA[i] ^ bufB[i];
  }
  return diff === 0;
}

/**
 * Extrai o segredo enviado pelo gateway a partir dos headers mais comuns.
 * - GGCheckout (documentado): `Authorization: Bearer <secret>` OU `x-secret`.
 * - Kirvano (token opcional; header não documentado): tenta Authorization,
 *   x-secret, x-webhook-token e x-kirvano-token.
 */
export function extractSecretFromHeaders(headers: Headers): string | null {
  const auth = headers.get('authorization') ?? '';
  const candidates = [
    auth.startsWith('Bearer ') ? auth.slice(7) : auth,
    headers.get('x-secret') ?? '',
    headers.get('x-webhook-token') ?? '',
    headers.get('x-kirvano-token') ?? '',
    headers.get('x-kirvano-signature') ?? '',
  ];
  return candidates.find((c) => c.trim() !== '')?.trim() ?? null;
}

/** Valida o segredo recebido contra o esperado (env). */
export function verifySecret(received: string | null, expected: string | undefined | null): boolean {
  if (!expected) return true; // segredo não configurado → aceita (documentar o risco)
  if (!received) return false;
  return timingSafeEqual(received, expected);
}
