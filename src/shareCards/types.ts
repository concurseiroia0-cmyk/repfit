import type { Unit } from '../types';
import type { MuscleId } from './muscleMap';

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

/** Os estilos visuais (cada um é um componente real, não um PNG). */
export type ShareTemplateId = 'glass' | 'performance' | 'minimal' | 'posterMinimal' | 'muscleMap';

export const SHARE_TEMPLATES: { id: ShareTemplateId; label: string; hint: string }[] = [
  { id: 'glass', label: 'Glass', hint: 'Painel de vidro flutuante sobre a foto.' },
  { id: 'performance', label: 'Performance', hint: 'Métricas grandes e gráfico de volume.' },
  { id: 'minimal', label: 'Minimal', hint: 'Editorial, limpo, título gigante.' },
  { id: 'posterMinimal', label: 'Pôster minimal', hint: 'Pôster vertical: dados centralizados e assinatura do treino.' },
  { id: 'muscleMap', label: 'Mapa muscular', hint: 'Mapa anatômico com os músculos trabalhados em destaque.' },
];

/** Exercício pronto para renderizar no card. */
export interface ShareExercise {
  name: string;
  sets: number;
  reps: number;
  /** Maior carga do exercício em kg (null se não houver peso). */
  weightKg: number | null;
  /** Soma de carga×reps do exercício (só se houver peso válido). */
  volumeKg: number | null;
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
  /** Onde o treino foi feito (ausente em treinos antigos). */
  mode: 'academia' | 'calistenia' | 'cardio' | null;
  dateLabel: string;
  /** Foto salva junto com o treino (IndexedDB) — vira o fundo do card. */
  photoId: number | null;
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
  /** Esforço médio (1–6) do treino, se registrado. */
  averageEffort: number | null;
  /** Exercícios principais (até 5) + contador dos omitidos. */
  exercises: ShareExercise[];
  moreExercises: number;
  /** Recorde deste treino (null se não houver). */
  record: ShareRecord | null;
  evolution: ShareEvolution | null;
  /** true se o treino tem pelo menos um peso válido. */
  hasLoad: boolean;
  /** Grupos musculares trabalhados neste treino (para o template anatômico). */
  muscles: MuscleId[];
}

/** Foto do usuário já processada (dataURL local, em memória). */
export interface SharePhoto {
  /** dataURL JPEG (máx. ~1920px) — nunca enviada para servidor. */
  url: string;
  /** Zoom: 1 = cobertura total; >1 = aproximado. */
  scale: number;
  /** Deslocamento horizontal em % do card (-50..50). */
  panX: number;
  /** Deslocamento vertical em % do card (-50..50). */
  panY: number;
}

/** Personalização do card (o que aparece/oculta). */
export interface ShareCustomization {
  showAvatar: boolean;
  showVolume: boolean;
  showEffort: boolean;
  showRecord: boolean;
  showExercises: boolean;
}

export const DEFAULT_CUSTOMIZATION: ShareCustomization = {
  showAvatar: true,
  showVolume: true,
  showEffort: true,
  showRecord: true,
  showExercises: true,
};

/** Props idênticas para todos os templates (componentes burros: só renderizam). */
export interface ShareTemplateProps {
  template: ShareTemplateId;
  data: ShareCardData;
  format: ShareFormat;
  photo: SharePhoto | null;
  custom: ShareCustomization;
  /** Escurecimento global sobre a foto (0..0.9). */
  overlay: number;
  /** Logo da marca como dataURL (null → monograma/barbell). */
  logoUrl: string | null;
}
