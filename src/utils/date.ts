import { format } from 'date-fns';
import { enUS, ptBR } from 'date-fns/locale';
import { addDays, differenceInCalendarDays, startOfWeek } from 'date-fns';
import { isEn } from '../i18n';

/** Locale do date-fns no idioma ativo do app. */
function locale() {
  return isEn() ? enUS : ptBR;
}

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

/** YYYY-MM-DD da segunda-feira da semana atual (base das metas semanais). */
export function currentWeekStart(): string {
  return toDateString(startOfWeek(new Date(), { weekStartsOn: 1 }));
}

/** '2026-08-09' -> '09/08/2026' (pt) | '08/09/2026' (en) */
export function formatDate(s: string, pattern?: string): string {
  const p = pattern ?? (isEn() ? 'MM/dd/yyyy' : 'dd/MM/yyyy');
  return format(parseLocalDate(s), p, { locale: locale() });
}

/** '2026-08-09' -> '09 AGO' (pt) | 'AUG 09' (en) */
export function formatDayShort(s: string): string {
  const f = format(parseLocalDate(s), isEn() ? 'MMM dd' : 'dd MMM', { locale: locale() });
  return f.toUpperCase();
}

/** '2026-08-09' -> 'sábado' | 'Saturday' */
export function weekdayName(s: string): string {
  return format(parseLocalDate(s), 'EEEE', { locale: locale() });
}

/** '2026-08-09' -> 'AGOSTO 2026' | 'AUGUST 2026' */
export function formatMonthYear(s: string): string {
  return format(parseLocalDate(s), 'MMMM yyyy', { locale: locale() }).toUpperCase();
}

/** '2026-08-09' -> 'agosto de 2026' | 'August 2026' */
export function formatMonthYearCap(s: string): string {
  return format(parseLocalDate(s), 'MMMM yyyy', { locale: locale() });
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
