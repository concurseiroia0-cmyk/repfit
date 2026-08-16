/**
 * Mapa muscular do RepFit — traduz exercícios em grupos musculares para o
 * template de card anatômico (MuscleMapTemplate).
 *
 * Estratégia de mapeamento (em ordem de prioridade):
 *   1. Tabela EXERCISE_MUSCLES: exercício conhecido (nome normalizado) →
 *      lista exata de músculos (ex.: supino → peito + tríceps + ombro);
 *   2. KEYWORD_MUSCLES: palavras-chave no nome (ex.: "corrida" → pernas) —
 *      cobre exercícios criados pelo usuário;
 *   3. fallback pelo muscleGroup do catálogo (Peito, Costas, Pernas…).
 *
 * A função `exerciseToMuscles` é pura (sem banco) — o selectWorkoutShareData
 * consulta o catálogo e chama aqui com name + muscleGroup.
 */

/** Cada músculo desenhável no SVG anatômico (vista frontal e/ou traseira). */
export type MuscleId =
  | 'peito'
  | 'ombros'
  | 'biceps'
  | 'triceps'
  | 'trapezio'
  | 'lats'
  | 'lombar'
  | 'abs'
  | 'obliquos'
  | 'quadriceps'
  | 'posterior'
  | 'gluteos'
  | 'panturrilha'
  | 'tibialis'
  | 'antebraco';

/** Rótulo em português de cada músculo (usado na legenda do card). */
export const MUSCLE_LABELS: Record<MuscleId, string> = {
  peito: 'Peito',
  ombros: 'Ombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  trapezio: 'Trapézio',
  lats: 'Costas',
  lombar: 'Lombar',
  abs: 'Abdômen',
  obliquos: 'Oblíquos',
  quadriceps: 'Quadríceps',
  posterior: 'Posterior',
  gluteos: 'Glúteos',
  panturrilha: 'Panturrilha',
  tibialis: 'Canela',
  antebraco: 'Antebraço',
};

/** Músculos que aparecem na vista FRONTAL do SVG. */
export const FRONT_MUSCLES: MuscleId[] = [
  'peito',
  'ombros',
  'biceps',
  'antebraco',
  'trapezio',
  'abs',
  'obliquos',
  'quadriceps',
  'tibialis',
];

/** Músculos que aparecem na vista TRASEIRA do SVG. */
export const BACK_MUSCLES: MuscleId[] = [
  'trapezio',
  'ombros',
  'triceps',
  'antebraco',
  'lats',
  'lombar',
  'gluteos',
  'posterior',
  'panturrilha',
];

/** Ordem canônica da legenda (principais grupos primeiro). */
export const LEGEND_ORDER: MuscleId[] = [
  'peito',
  'ombros',
  'biceps',
  'triceps',
  'trapezio',
  'lats',
  'lombar',
  'abs',
  'obliquos',
  'quadriceps',
  'posterior',
  'gluteos',
  'panturrilha',
  'tibialis',
  'antebraco',
];

/** Remove acentos e normaliza para lookup (ex.: "Puxada Frontal" → "puxada frontal"). */
function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------------------------------------------------------------------------
// 1) Tabela de exercícios conhecidos → músculos
// ---------------------------------------------------------------------------

const EXERCISE_MUSCLES: Record<string, MuscleId[]> = {
  // Peito
  'supino reto': ['peito', 'triceps', 'ombros'],
  'supino inclinado': ['peito', 'ombros', 'triceps'],
  'supino com halteres': ['peito', 'triceps', 'ombros'],
  'supino declinado': ['peito', 'triceps'],
  'crucifixo': ['peito', 'ombros'],
  'crucifixo inclinado': ['peito', 'ombros'],
  'voador': ['peito', 'ombros'],
  'flexao de braco': ['peito', 'triceps', 'ombros', 'abs'],
  'flexao': ['peito', 'triceps', 'ombros', 'abs'],
  // Costas
  'puxada frontal': ['lats', 'biceps', 'trapezio'],
  'puxada alta': ['lats', 'biceps'],
  'puxada': ['lats', 'biceps'],
  'remada curvada': ['lats', 'biceps', 'lombar'],
  'remada baixa': ['lats', 'biceps'],
  'remada': ['lats', 'biceps', 'lombar'],
  'barra fixa': ['lats', 'biceps', 'abs'],
  'barra': ['lats', 'biceps'],
  'levantamento terra': ['lombar', 'gluteos', 'posterior', 'trapezio', 'quadriceps'],
  'terra': ['lombar', 'gluteos', 'posterior'],
  'remada unilateral': ['lats', 'biceps', 'lombar'],
  // Pernas
  'agachamento livre': ['quadriceps', 'gluteos', 'posterior'],
  'agachamento smith': ['quadriceps', 'gluteos'],
  'agachamento': ['quadriceps', 'gluteos', 'posterior'],
  'leg press': ['quadriceps', 'gluteos', 'posterior'],
  'cadeira extensora': ['quadriceps'],
  'extensora': ['quadriceps'],
  'mesa flexora': ['posterior'],
  'flexora': ['posterior'],
  'afundo': ['quadriceps', 'gluteos'],
  'stiff': ['posterior', 'gluteos', 'lombar'],
  'panturrilha em pe': ['panturrilha'],
  'panturrilha sentado': ['panturrilha'],
  'panturrilha': ['panturrilha'],
  'elevacao de pelve': ['gluteos', 'posterior'],
  'cadeira abdutora': ['gluteos', 'quadriceps'],
  'abdutora': ['gluteos', 'quadriceps'],
  'adutora': ['quadriceps', 'gluteos'],
  // Ombros
  'desenvolvimento militar': ['ombros', 'triceps', 'trapezio'],
  'desenvolvimento com halteres': ['ombros', 'triceps'],
  'desenvolvimento': ['ombros', 'triceps'],
  'elevacao lateral': ['ombros', 'trapezio'],
  'elevacao frontal': ['ombros', 'peito'],
  'remada alta': ['ombros', 'trapezio'],
  'encolhimento': ['trapezio', 'ombros'],
  // Braços
  'rosca direta': ['biceps'],
  'rosca alternada': ['biceps'],
  'rosca martelo': ['biceps'],
  'rosca scott': ['biceps'],
  'rosca': ['biceps'],
  'rosca punho': ['antebraco'],
  'rosca punho invertida': ['antebraco'],
  'rosca inversa': ['antebraco', 'biceps'],
  'wrist curl': ['antebraco'],
  'pronacao': ['antebraco'],
  'supinacao': ['antebraco'],
  'triceps corda': ['triceps'],
  'triceps testa': ['triceps'],
  'triceps frances': ['triceps'],
  'triceps': ['triceps'],
  'mergulho': ['triceps', 'peito', 'ombros'],
  // Core
  'abdominal': ['abs'],
  'abdominal infra': ['abs'],
  'abdominal obliquo': ['obliquos', 'abs'],
  'prancha': ['abs', 'lombar', 'ombros'],
  'elevacao de pernas': ['abs', 'quadriceps'],
  'sit up': ['abs'],
  'crunch': ['abs'],
  // Cardio
  'esteira': ['quadriceps', 'panturrilha', 'gluteos'],
  'corrida': ['quadriceps', 'posterior', 'gluteos', 'panturrilha'],
  'bicicleta ergometrica': ['quadriceps', 'panturrilha', 'gluteos'],
  'bicicleta': ['quadriceps', 'panturrilha', 'gluteos'],
  'eliptico': ['quadriceps', 'gluteos', 'posterior'],
  'pular corda': ['panturrilha', 'quadriceps', 'ombros'],
  'caminhada': ['quadriceps', 'gluteos', 'panturrilha'],
  'bike': ['quadriceps', 'panturrilha'],
  'spinning': ['quadriceps', 'gluteos', 'posterior'],
  'escada': ['quadriceps', 'gluteos', 'panturrilha'],
};

// ---------------------------------------------------------------------------
// 2) Palavras-chave para exercícios criados pelo usuário
// ---------------------------------------------------------------------------

const KEYWORD_MUSCLES: { key: string; muscles: MuscleId[] }[] = [
  { key: 'supino', muscles: ['peito', 'triceps', 'ombros'] },
  { key: 'crucifixo', muscles: ['peito', 'ombros'] },
  { key: 'voador', muscles: ['peito'] },
  { key: 'flexao', muscles: ['peito', 'triceps', 'ombros'] },
  { key: 'push up', muscles: ['peito', 'triceps', 'ombros'] },
  { key: 'peito', muscles: ['peito'] },
  { key: 'puxada', muscles: ['lats', 'biceps'] },
  { key: 'remada', muscles: ['lats', 'biceps', 'lombar'] },
  { key: 'barra', muscles: ['lats', 'biceps'] },
  { key: 'chin up', muscles: ['lats', 'biceps'] },
  { key: 'pull up', muscles: ['lats', 'biceps'] },
  { key: 'costas', muscles: ['lats', 'trapezio', 'biceps'] },
  { key: 'terra', muscles: ['lombar', 'gluteos', 'posterior'] },
  { key: 'agachamento', muscles: ['quadriceps', 'gluteos', 'posterior'] },
  { key: 'squat', muscles: ['quadriceps', 'gluteos', 'posterior'] },
  { key: 'leg press', muscles: ['quadriceps', 'gluteos'] },
  { key: 'extensora', muscles: ['quadriceps'] },
  { key: 'flexora', muscles: ['posterior'] },
  { key: 'afundo', muscles: ['quadriceps', 'gluteos'] },
  { key: 'lunge', muscles: ['quadriceps', 'gluteos'] },
  { key: 'stiff', muscles: ['posterior', 'gluteos', 'lombar'] },
  { key: 'panturrilha', muscles: ['panturrilha'] },
  { key: 'calf', muscles: ['panturrilha'] },
  { key: 'abdutora', muscles: ['gluteos', 'quadriceps'] },
  { key: 'adutora', muscles: ['quadriceps', 'gluteos'] },
  { key: 'desenvolvimento', muscles: ['ombros', 'triceps'] },
  { key: 'ombro', muscles: ['ombros', 'triceps'] },
  { key: 'elevacao lateral', muscles: ['ombros', 'trapezio'] },
  { key: 'elevacao frontal', muscles: ['ombros'] },
  { key: 'lateral raise', muscles: ['ombros', 'trapezio'] },
  { key: 'shoulder press', muscles: ['ombros', 'triceps'] },
  { key: 'rosca punho', muscles: ['antebraco'] },
  { key: 'punho', muscles: ['antebraco'] },
  { key: 'wrist', muscles: ['antebraco'] },
  { key: 'antebraco', muscles: ['antebraco'] },
  { key: 'forearm', muscles: ['antebraco'] },
  { key: 'rosca', muscles: ['biceps'] },
  { key: 'curl', muscles: ['biceps'] },
  { key: 'biceps', muscles: ['biceps'] },
  { key: 'triceps', muscles: ['triceps'] },
  { key: 'mergulho', muscles: ['triceps', 'peito', 'ombros'] },
  { key: 'dips', muscles: ['triceps', 'peito', 'ombros'] },
  { key: 'abdominal', muscles: ['abs'] },
  { key: 'abdominais', muscles: ['abs'] },
  { key: 'prancha', muscles: ['abs', 'lombar'] },
  { key: 'plank', muscles: ['abs', 'lombar'] },
  { key: 'core', muscles: ['abs', 'obliquos'] },
  { key: 'obliquo', muscles: ['obliquos', 'abs'] },
  { key: 'pelvis', muscles: ['gluteos', 'posterior'] },
  { key: 'gluteo', muscles: ['gluteos'] },
  { key: 'gluteos', muscles: ['gluteos'] },
  { key: 'corrida', muscles: ['quadriceps', 'posterior', 'gluteos', 'panturrilha'] },
  { key: 'correr', muscles: ['quadriceps', 'posterior', 'gluteos', 'panturrilha'] },
  { key: 'bicicleta', muscles: ['quadriceps', 'panturrilha', 'gluteos'] },
  { key: 'bike', muscles: ['quadriceps', 'panturrilha'] },
  { key: 'spinning', muscles: ['quadriceps', 'gluteos', 'posterior'] },
  { key: 'esteira', muscles: ['quadriceps', 'panturrilha', 'gluteos'] },
  { key: 'eliptico', muscles: ['quadriceps', 'gluteos', 'posterior'] },
  { key: 'corda', muscles: ['panturrilha', 'quadriceps', 'ombros'] },
  { key: 'caminhada', muscles: ['quadriceps', 'gluteos', 'panturrilha'] },
  { key: 'escada', muscles: ['quadriceps', 'gluteos', 'panturrilha'] },
  { key: 'cardio', muscles: ['quadriceps', 'panturrilha', 'gluteos'] },
];

// ---------------------------------------------------------------------------
// 3) Fallback pelo muscleGroup do catálogo
// ---------------------------------------------------------------------------

const GROUP_MUSCLES: Record<string, MuscleId[]> = {
  peito: ['peito'],
  costas: ['lats', 'trapezio', 'biceps'],
  pernas: ['quadriceps', 'posterior', 'gluteos'],
  panturrilha: ['panturrilha'],
  ombros: ['ombros'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  core: ['abs', 'obliquos'],
  gluteos: ['gluteos'],
  antebraco: ['antebraco'],
  cardio: ['quadriceps', 'panturrilha', 'gluteos'],
};

/**
 * Traduz um exercício em grupos musculares. Pura e determinística:
 * tabela exata → palavras-chave → muscleGroup do catálogo.
 */
export function exerciseToMuscles(name: string, muscleGroup?: string | null): MuscleId[] {
  const n = normalize(name);
  if (!n) return [];

  const exact = EXERCISE_MUSCLES[n];
  if (exact) return exact;

  for (const { key, muscles } of KEYWORD_MUSCLES) {
    if (n.includes(key)) return muscles;
  }

  if (muscleGroup) {
    const g = normalize(muscleGroup);
    const group = GROUP_MUSCLES[g];
    if (group) return group;
  }

  return [];
}

/**
 * Une os músculos de vários exercícios, mantendo a ordem da legenda e sem
 * duplicatas. Retorna [] quando nada foi identificado (figura toda cinza).
 */
export function collectMuscles(
  exercises: { name: string; muscleGroup?: string | null }[]
): MuscleId[] {
  const seen = new Set<MuscleId>();
  const out: MuscleId[] = [];
  for (const ex of exercises) {
    for (const m of exerciseToMuscles(ex.name, ex.muscleGroup)) {
      if (!seen.has(m)) {
        seen.add(m);
        out.push(m);
      }
    }
  }
  // Ordena pela ordem canônica da legenda (peito antes de panturrilha…).
  return LEGEND_ORDER.filter((m) => seen.has(m));
}
