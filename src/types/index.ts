// Modelos de dados do RepFit.

export type Unit = 'kg' | 'lb';
export type ThemeMode = 'light' | 'dark' | 'auto';
export type Sex = 'masculino' | 'feminino' | 'outro';

/** Uma série individual dentro de um exercício. */
export interface SetEntry {
  id: string;
  /** Peso em kg (sempre armazenado em kg, convertido para exibição conforme a unidade). */
  weight: number | null;
  reps: number | null;
}

/** Um exercício dentro de um treino. */
export interface WorkoutExercise {
  id: string;
  name: string;
  sets: SetEntry[];
  /** Escala invertida 1–6 (1 = mais difícil, 6 = mais fácil). */
  effort: number | null;
  notes: string;
  order: number;
}

/** Um treino completo. */
export interface Workout {
  id?: number;
  /** Data local no formato YYYY-MM-DD (sem bug de fuso). */
  date: string;
  /** Dia da semana (0 = domingo, 1 = segunda...). */
  weekday: number;
  name: string;
  type: string;
  exercises: WorkoutExercise[];
  notes: string;
  photoId: string | null;
  durationMin: number | null;
  /** Tempo total de descanso registrado ao preencher este treino (em segundos). */
  restSec: number | null;
  /** Onde o treino foi feito. Ausente em treinos antigos (antes da modalidade existir). */
  mode?: 'academia' | 'calistenia';
  totalVolume: number;
  avgEffort: number | null;
  createdAt: number;
  updatedAt: number;
}

/** Modalidade de um exercício do catálogo (para filtrar sugestões). */
export type ExerciseMode = 'academia' | 'calistenia' | 'ambos';

/** Item do catálogo de exercícios (sugestões/recentes/favoritos). */
export interface ExerciseCatalogItem {
  id?: number;
  name: string;
  muscleGroup: string;
  /** Onde o exercício costuma ser feito. Ausente = exercício criado pelo usuário (aparece nas duas modalidades). */
  mode?: ExerciseMode;
  favorite: boolean;
  lastWeight: number | null;
  lastReps: number | null;
  timesUsed: number;
}

/** Foto salva como Blob no IndexedDB (nunca base64 em localStorage). */
export interface Photo {
  id?: number;
  /** Id do treino dono; 'draft' enquanto o treino ainda não foi salvo. */
  workoutId: string;
  blob: Blob;
  width: number;
  height: number;
  createdAt: number;
}

/** Configurações do usuário. */
export interface Settings {
  username: string;
  unit: Unit;
  theme: ThemeMode;
  /** Timestamp do último backup exportado (para lembrar o usuário). */
  lastBackupAt?: number;
  /** Tela de boas-vindas já exibida. */
  welcomeSeen?: boolean;
  /** Tipos de medida (padrão + personalizados). Ausente = lista padrão. */
  measureTypes?: MeasureDef[];
  /** Perfil do usuário (preenchido no onboarding). */
  sex?: Sex;
  age?: number | null;
  /** Altura em centímetros. */
  heightCm?: number | null;
  /** Peso sempre em kg (exibido conforme a unidade do app). */
  weightKg?: number | null;
  /** Onboarding de perfil concluído (ou pulado). */
  profileDone?: boolean;
  /** Foto do perfil como dataURL comprimida (256px, JPEG) — barata de guardar. */
  avatarDataUrl?: string;
  /** Meta semanal opcional (ex.: 3 treinos/semana, 12.000 kg, 180 min). */
  weeklyGoal?: { type: 'frequency' | 'volume' | 'duration'; target: number };
}

/** Definição de um tipo de medida corporal (Peso, Braço, Cintura…). */
export interface MeasureDef {
  key: string;
  label: string;
  /** kg para peso (convertido pela unidade do app); cm para as demais. */
  unit: 'kg' | 'cm';
}

/** Uma medição corporal feita em uma data. `values` mapeia measureKey → valor. */
export interface BodyMeasurement {
  id?: number;
  /** Data local YYYY-MM-DD. */
  date: string;
  createdAt: number;
  values: Record<string, number | null>;
}

/** Estado do formulário de treino (valores brutos de input). */
export interface SetDraft {
  id: string;
  weight: string;
  reps: string;
}

export interface ExerciseDraft {
  id: string;
  name: string;
  sets: SetDraft[];
  effort: number | null;
  notes: string;
}

export interface WorkoutFormState {
  date: string;
  name: string;
  type: string;
  notes: string;
  durationMin: string;
  /** Modalidade escolhida: filtra as sugestões de exercícios. */
  mode: 'academia' | 'calistenia';
  /** Descanso entre séries em segundos (0 = sem resposta / não houve). */
  restSec: number;
  exercises: ExerciseDraft[];
}

/** Rascunho salvo automaticamente (sem foto — a foto fica no IndexedDB). */
export interface WorkoutDraft {
  form: WorkoutFormState;
  photoId: string | null;
  updatedAt: number;
}

/** Mapa id-local → id-na-nuvem, usado pela sincronização com o Supabase. */
export interface SyncMapEntry {
  /** Chave composta: `${entity}:${localId}` (ex.: 'workout:12'). */
  key: string;
  /** Id UUID da linha na nuvem. */
  cloudId: string;
  entity: 'workout' | 'exercise' | 'photo';
}
