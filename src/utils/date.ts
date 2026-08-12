import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { addDays, differenceInCalendarDays } from 'date-fns';

/** Converte Date em string YYYY-MM-DD usando a hora LOCAL (evita bug de fuso). */
export function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Converte YYYY-MM-DD em Date local (sem interpretar como UTC). */
export function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1);
}

export function todayString(): string {
  return toDateString(new Date());
}

/** '2026-08-09' -> '09/08/2026' */
export function formatDate(s: string, pattern = 'dd/MM/yyyy'): string {
  return format(parseLocalDate(s), pattern, { locale: ptBR });
}

/** '2026-08-09' -> '09 AGO' */
export function formatDayShort(s: string): string {
  return format(parseLocalDate(s), 'dd MMM', { locale: ptBR }).toUpperCase();
}

/** '2026-08-09' -> 'sábado' */
export function weekdayName(s: string): string {
  return format(parseLocalDate(s), 'EEEE', { locale: ptBR });
}

/** '2026-08-09' -> 'AGOSTO 2026' */
export function formatMonthYear(s: string): string {
  return format(parseLocalDate(s), 'MMMM yyyy', { locale: ptBR }).toUpperCase();
}

/** '2026-08-09' -> 'agosto de 2026' */
export function formatMonthYearCap(s: string): string {
  return format(parseLocalDate(s), 'MMMM yyyy', { locale: ptBR });
}

/** Sequência atual de dias com treino (conta a partir de hoje ou ontem). */
export function currentStreak(dates: string[]): number {
  const set = new Set(dates);
  let streak = 0;
  let d = new Date();
  if (!set.has(toDateString(d))) d = addDays(d, -1);
  while (set.has(toDateString(d))) {
    streak++;
    d = addDays(d, -1);
  }
  return streak;
}

/** Maior sequência de dias consecutivos com treino em qualquer período. */
export function longestStreak(dates: string[]): number {
  const set = new Set(dates);
  const sorted = [...set].sort();
  let best = 0;
  let cur = 0;
  let prev: string | null = null;
  for (const s of sorted) {
    if (prev && differenceInCalendarDays(parseLocalDate(s), parseLocalDate(prev)) === 1) {
      cur++;
    } else {
      cur = 1;
    }
    if (cur > best) best = cur;
    prev = s;
  }
  return best;
}

/** Maior sequência de dias com treino dentro de um mês específico (YYYY-MM). */
export function longestStreakInMonth(dates: string[], monthPrefix: string): number {
  return longestStreak(dates.filter((d) => d.startsWith(monthPrefix)));
}
