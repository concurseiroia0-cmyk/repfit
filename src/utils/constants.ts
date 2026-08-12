export const WORKOUT_TYPES = [
  'Peito + Tríceps',
  'Costas + Bíceps',
  'Pernas',
  'Ombros',
  'Full Body',
  'Cardio',
  'Outro',
] as const;

export const DEFAULT_MUSCLE_GROUPS = [
  'Peito',
  'Costas',
  'Pernas',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Core',
  'Glúteos',
  'Panturrilha',
  'Cardio',
  'Outros',
] as const;

export interface TypeColor {
  dot: string;
  badge: string;
}

export const TYPE_COLORS: Record<string, TypeColor> = {
  'Peito + Tríceps': {
    dot: 'bg-rose-500',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  },
  'Costas + Bíceps': {
    dot: 'bg-sky-500',
    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  },
  Pernas: {
    dot: 'bg-violet-500',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  },
  Ombros: {
    dot: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  },
  'Full Body': {
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  },
  Cardio: {
    dot: 'bg-orange-500',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
  },
  Outro: {
    dot: 'bg-slate-400',
    badge: 'bg-slate-200 text-slate-600 dark:bg-slate-600/30 dark:text-slate-300',
  },
};

export function typeColor(type: string): TypeColor {
  return TYPE_COLORS[type] ?? TYPE_COLORS['Outro'];
}

/** Medidas corporais padrão (o usuário pode adicionar outras). */
export const DEFAULT_MEASURES = [
  { key: 'weight', label: 'Peso', unit: 'kg' as const },
  { key: 'arm', label: 'Braço', unit: 'cm' as const },
  { key: 'waist', label: 'Cintura', unit: 'cm' as const },
  { key: 'chest', label: 'Peito', unit: 'cm' as const },
  { key: 'thigh', label: 'Coxa', unit: 'cm' as const },
  { key: 'calf', label: 'Panturrilha', unit: 'cm' as const },
];

/** Cores para os gráficos de medidas (cicla pelas mais legíveis). */
export const MEASURE_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#6366f1'];

/** Cor de uma medida específica (estável por chave). */
export function measureColor(key: string): string {
  let h = 0;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return MEASURE_COLORS[h % MEASURE_COLORS.length];
}

export interface EffortLevel {
  value: number;
  label: string;
  desc: string;
  color: string;
  textClass: string;
}

/** Escala INVERTIDA: 1 = mais difícil, 6 = mais fácil. */
export const EFFORT_LEVELS: EffortLevel[] = [
  { value: 1, label: 'Exausto', desc: 'esforço extremo', color: '#ef4444', textClass: 'text-white' },
  { value: 2, label: 'Muito difícil', desc: 'extremamente pesado', color: '#f97316', textClass: 'text-white' },
  { value: 3, label: 'Difícil', desc: 'exigiu bastante esforço', color: '#f59e0b', textClass: 'text-white' },
  { value: 4, label: 'Moderado', desc: 'cansativo, mas controlável', color: '#a3e635', textClass: 'text-slate-900' },
  { value: 5, label: 'Fácil', desc: 'poderia fazer mais algumas repetições', color: '#4ade80', textClass: 'text-slate-900' },
  { value: 6, label: 'Muito fácil', desc: 'pouco esforço', color: '#10b981', textClass: 'text-white' },
];

export function effortLevel(value: number | null): EffortLevel | null {
  if (value == null) return null;
  return EFFORT_LEVELS.find((l) => l.value === value) ?? null;
}
