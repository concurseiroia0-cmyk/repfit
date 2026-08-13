import { db } from './db';
import type { ExerciseCatalogItem, ExerciseMode } from '../types';

// Catálogo inicial: apenas SUGESTÕES de exercícios comuns.
// Nunca contém dados falsos de treino — apenas nomes para o autocomplete.
// `mode` indica onde o exercício costuma ser feito: 'academia' (equipamentos),
// 'calistenia' (peso corporal) ou 'ambos' (comum nos dois).
const INITIAL_CATALOG: Array<{ name: string; muscleGroup: string; mode: ExerciseMode }> = [
  { name: 'Supino Reto', muscleGroup: 'Peito', mode: 'academia' },
  { name: 'Supino Inclinado', muscleGroup: 'Peito', mode: 'academia' },
  { name: 'Supino com Halteres', muscleGroup: 'Peito', mode: 'academia' },
  { name: 'Crucifixo', muscleGroup: 'Peito', mode: 'academia' },
  { name: 'Voador', muscleGroup: 'Peito', mode: 'academia' },
  { name: 'Flexão de Braço', muscleGroup: 'Peito', mode: 'calistenia' },
  { name: 'Puxada Frontal', muscleGroup: 'Costas', mode: 'academia' },
  { name: 'Remada Curvada', muscleGroup: 'Costas', mode: 'academia' },
  { name: 'Remada Baixa', muscleGroup: 'Costas', mode: 'academia' },
  { name: 'Barra Fixa', muscleGroup: 'Costas', mode: 'calistenia' },
  { name: 'Levantamento Terra', muscleGroup: 'Costas', mode: 'academia' },
  { name: 'Agachamento Livre', muscleGroup: 'Pernas', mode: 'ambos' },
  { name: 'Agachamento Smith', muscleGroup: 'Pernas', mode: 'academia' },
  { name: 'Leg Press', muscleGroup: 'Pernas', mode: 'academia' },
  { name: 'Cadeira Extensora', muscleGroup: 'Pernas', mode: 'academia' },
  { name: 'Mesa Flexora', muscleGroup: 'Pernas', mode: 'academia' },
  { name: 'Afundo', muscleGroup: 'Pernas', mode: 'ambos' },
  { name: 'Stiff', muscleGroup: 'Pernas', mode: 'academia' },
  { name: 'Panturrilha em Pé', muscleGroup: 'Panturrilha', mode: 'ambos' },
  { name: 'Panturrilha Sentado', muscleGroup: 'Panturrilha', mode: 'academia' },
  { name: 'Desenvolvimento Militar', muscleGroup: 'Ombros', mode: 'academia' },
  { name: 'Desenvolvimento com Halteres', muscleGroup: 'Ombros', mode: 'academia' },
  { name: 'Elevação Lateral', muscleGroup: 'Ombros', mode: 'academia' },
  { name: 'Elevação Frontal', muscleGroup: 'Ombros', mode: 'academia' },
  { name: 'Remada Alta', muscleGroup: 'Ombros', mode: 'academia' },
  { name: 'Rosca Direta', muscleGroup: 'Bíceps', mode: 'academia' },
  { name: 'Rosca Alternada', muscleGroup: 'Bíceps', mode: 'academia' },
  { name: 'Rosca Martelo', muscleGroup: 'Bíceps', mode: 'academia' },
  { name: 'Rosca Scott', muscleGroup: 'Bíceps', mode: 'academia' },
  { name: 'Tríceps Corda', muscleGroup: 'Tríceps', mode: 'academia' },
  { name: 'Tríceps Testa', muscleGroup: 'Tríceps', mode: 'academia' },
  { name: 'Tríceps Francês', muscleGroup: 'Tríceps', mode: 'academia' },
  { name: 'Mergulho', muscleGroup: 'Tríceps', mode: 'calistenia' },
  { name: 'Abdominal', muscleGroup: 'Core', mode: 'calistenia' },
  { name: 'Prancha', muscleGroup: 'Core', mode: 'calistenia' },
  { name: 'Abdominal Infra', muscleGroup: 'Core', mode: 'calistenia' },
  { name: 'Abdominal Oblíquo', muscleGroup: 'Core', mode: 'calistenia' },
  { name: 'Elevação de Pelve', muscleGroup: 'Glúteos', mode: 'calistenia' },
  { name: 'Cadeira Abdutora', muscleGroup: 'Glúteos', mode: 'academia' },
  { name: 'Esteira', muscleGroup: 'Cardio', mode: 'academia' },
  { name: 'Bicicleta Ergométrica', muscleGroup: 'Cardio', mode: 'academia' },
  { name: 'Elíptico', muscleGroup: 'Cardio', mode: 'academia' },
  { name: 'Pular Corda', muscleGroup: 'Cardio', mode: 'ambos' },
];

/**
 * Garante o catálogo inicial (apenas se vazio) e migra os itens que já
 * existiam antes do campo `mode`: itens do catálogo padrão ganham a
 * modalidade correta; exercícios criados pelo usuário ficam sem `mode`
 * (aparecem nas duas modalidades).
 */
export async function seedCatalogIfEmpty(): Promise<void> {
  const count = await db.exerciseCatalog.count();
  if (count === 0) {
    const items: ExerciseCatalogItem[] = INITIAL_CATALOG.map((c) => ({
      name: c.name,
      muscleGroup: c.muscleGroup,
      mode: c.mode,
      favorite: false,
      lastWeight: null,
      lastReps: null,
      timesUsed: 0,
    }));
    await db.exerciseCatalog.bulkAdd(items);
    return;
  }
  for (const c of INITIAL_CATALOG) {
    await db.exerciseCatalog
      .where('name')
      .equals(c.name)
      .modify((item) => {
        if (!item.mode) item.mode = c.mode;
      });
  }
}
