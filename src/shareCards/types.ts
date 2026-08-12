import type { Unit } from '../types';

/** Formatos suportados (o palco renderiza no tamanho real). */
export type ShareFormatId = 'feed' | 'square' | 'story';

export interface ShareFormat {
  id: ShareFormatId;
  label: string;
  short: string;
  width: number;
  height: number;
}

export const SHARE_FORMATS: ShareFormat[] = [
  { id: 'feed', label: 'Feed (4:5)', short: 'Feed', width: 1080, height: 1350 },
  { id: 'square', label: 'Quadrado (1:1)', short: 'Quadrado', width: 1080, height: 1080 },
  { id: 'story', label: 'Story (9:16)', short: 'Story', width: 1080, height: 1920 },
];

export function getFormat(id: ShareFormatId): ShareFormat {
  return SHARE_FORMATS.find((f) => f.id === id) ?? SHARE_FORMATS[0];
}

export type ShareTemplateId = 'completed' | 'record' | 'evolution';

/** Exercício pronto para renderizar no card. */
export interface ShareExercise {
  name: string;
  sets: number;
  reps: number;
  /** Maior carga do exercício em kg (null se não houver peso). */
  weightKg: number | null;
}

/** Recorde conquistado no treino (com o valor anterior para o delta). */
export interface ShareRecord {
  key: string;
  label: string;
  sublabel?: string;
  value: number;
  unit: 'kg' | 'reps' | 'dias' | '';
  prevValue: number | null;
  delta: number | null;
  date: string;
}

/** Ponto do histórico de evolução de um exercício. */
export interface ShareEvolutionPoint {
  dateLabel: string;
  weightKg: number | null;
  reps: number;
}

export interface ShareEvolution {
  exercise: string;
  points: ShareEvolutionPoint[];
  /** Variação da carga entre o 1º e o último ponto (%). */
  deltaPercent: number | null;
  /** Variação de reps entre o 1º e o último ponto. */
  deltaReps: number | null;
}

/** Dados prontos para os templates (calculados uma única vez). */
export interface ShareCardData {
  workoutName: string;
  workoutType: string;
  dateLabel: string;
  username: string;
  /** Avatar (futuro). O app não tem avatar hoje → sempre null (monograma). */
  avatarUrl: string | null;
  unit: Unit;
  totals: {
    exercises: number;
    sets: number;
    reps: number;
    volumeKg: number | null;
    durationMin: number | null;
  };
  /** Exercícios principais (até 5) + contador dos omitidos. */
  exercises: ShareExercise[];
  moreExercises: number;
  /** Recorde deste treino (null se não houver). */
  record: ShareRecord | null;
  evolution: ShareEvolution | null;
  /** true se o treino tem pelo menos um peso válido. */
  hasLoad: boolean;
}
