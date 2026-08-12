/**
 * Formatação dos cards — regra: nulos/undefined NUNCA viram "NaN"/"undefined".
 * Todos os valores exibidos são strings seguras.
 */

/** Número inteiro em pt-BR (ex.: 1234 -> "1.234"). */
export function fmtInt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return Math.round(n).toLocaleString('pt-BR');
}

/** Número com até 1 casa decimal, sem zeros à direita (ex.: 60,5 / 60). */
export function fmtNum(n: number | null | undefined, maxDecimals = 1): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return n.toLocaleString('pt-BR', { maximumFractionDigits: maxDecimals });
}

/** Número que pode ser grande (>6 dígitos): usa notação compacta pt-BR. */
export function fmtBig(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${fmtNum(n / 1_000_000, 1)} mi`;
  return fmtNum(n);
}

/** Número de dígitos significativos (para reduzir a fonte quando necessário). */
export function digitCount(n: number | null | undefined): number {
  if (n == null || !Number.isFinite(n)) return 0;
  return Math.round(Math.abs(n)).toString().replace(/[^\d]/g, '').length;
}

/** String segura: nunca "undefined"/"null". */
export function safe(s: string | null | undefined): string {
  if (s == null) return '';
  const t = String(s);
  return t === 'undefined' || t === 'null' ? '' : t;
}

/** '12 AGO 2026' (maiúsculas), a partir de YYYY-MM-DD. */
export function dateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const mm = MONTHS[(m || 1) - 1] ?? '';
  return `${String(d ?? 0).padStart(2, '0')} ${mm} ${y ?? ''}`.trim();
}

/** '12 AGO' curto (para os pontos da evolução). */
export function dateLabelShort(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const mm = MONTHS[(m || 1) - 1] ?? '';
  return `${String(d ?? 0).padStart(2, '0')} ${mm} ${y ?? ''}`.slice(0, 6);
}

/** Slug amigável para o nome do arquivo (sem acentos, sem espaços). */
export function slugify(s: string): string {
  return safe(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'treino';
}

/** Nome do arquivo PNG (ex.: treino-peito-12-08-2026.png). */
export function shareFileName(workoutName: string, dateStr: string): string {
  const d = dateStr.split('-').reverse().join('-');
  return `treino-${slugify(workoutName)}-${d}.png`;
}

/** Inicial do usuário para o monograma (ou 'R' como fallback). */
export function monogram(name: string): string {
  const n = safe(name).trim();
  if (!n) return 'R';
  return n[0].toUpperCase();
}
