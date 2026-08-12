import { db } from './db';
import type { ExerciseCatalogItem } from '../types';

// Catálogo inicial: apenas SUGESTÕES de exercícios comuns.
// Nunca contém dados falsos de treino — apenas nomes para o autocomplete.
const INITIAL_CATALOG: Array<{ name: string; muscleGroup: string }> = [
  { name: 'Supino Reto', muscleGroup: 'Peito' },
  { name: 'Supino Inclinado', muscleGroup: 'Peito' },
  { name: 'Supino com Halteres', muscleGroup: 'Peito' },
  { name: 'Crucifixo', muscleGroup: 'Peito' },
  { name: 'Voador', muscleGroup: 'Peito' },
  { name: 'Flexão de Braço', muscleGroup: 'Peito' },
  { name: 'Puxada Frontal', muscleGroup: 'Costas' },
  { name: 'Remada Curvada', muscleGroup: 'Costas' },
  { name: 'Remada Baixa', muscleGroup: 'Costas' },
  { name: 'Barra Fixa', muscleGroup: 'Costas' },
  { name: 'Levantamento Terra', muscleGroup: 'Costas' },
  { name: 'Agachamento Livre', muscleGroup: 'Pernas' },
  { name: 'Agachamento Smith', muscleGroup: 'Pernas' },
  { name: 'Leg Press', muscleGroup: 'Pernas' },
  { name: 'Cadeira Extensora', muscleGroup: 'Pernas' },
  { name: 'Mesa Flexora', muscleGroup: 'Pernas' },
  { name: 'Afundo', muscleGroup: 'Pernas' },
  { name: 'Stiff', muscleGroup: 'Pernas' },
  { name: 'Panturrilha em Pé', muscleGroup: 'Panturrilha' },
  { name: 'Panturrilha Sentado', muscleGroup: 'Panturrilha' },
  { name: 'Desenvolvimento Militar', muscleGroup: 'Ombros' },
  { name: 'Desenvolvimento com Halteres', muscleGroup: 'Ombros' },
  { name: 'Elevação Lateral', muscleGroup: 'Ombros' },
  { name: 'Elevação Frontal', muscleGroup: 'Ombros' },
  { name: 'Remada Alta', muscleGroup: 'Ombros' },
  { name: 'Rosca Direta', muscleGroup: 'Bíceps' },
  { name: 'Rosca Alternada', muscleGroup: 'Bíceps' },
  { name: 'Rosca Martelo', muscleGroup: 'Bíceps' },
  { name: 'Rosca Scott', muscleGroup: 'Bíceps' },
  { name: 'Tríceps Corda', muscleGroup: 'Tríceps' },
  { name: 'Tríceps Testa', muscleGroup: 'Tríceps' },
  { name: 'Tríceps Francês', muscleGroup: 'Tríceps' },
  { name: 'Mergulho', muscleGroup: 'Tríceps' },
  { name: 'Abdominal', muscleGroup: 'Core' },
  { name: 'Prancha', muscleGroup: 'Core' },
  { name: 'Abdominal Infra', muscleGroup: 'Core' },
  { name: 'Abdominal Oblíquo', muscleGroup: 'Core' },
  { name: 'Elevação de Pelve', muscleGroup: 'Glúteos' },
  { name: 'Cadeira Abdutora', muscleGroup: 'Glúteos' },
  { name: 'Esteira', muscleGroup: 'Cardio' },
  { name: 'Bicicleta Ergométrica', muscleGroup: 'Cardio' },
  { name: 'Elíptico', muscleGroup: 'Cardio' },
  { name: 'Pular Corda', muscleGroup: 'Cardio' },
];

/** Insere o catálogo inicial apenas se a store estiver vazia. */
export async function seedCatalogIfEmpty(): Promise<void> {
  const count = await db.exerciseCatalog.count();
  if (count > 0) return;
  const items: ExerciseCatalogItem[] = INITIAL_CATALOG.map((c) => ({
    name: c.name,
    muscleGroup: c.muscleGroup,
    favorite: false,
    lastWeight: null,
    lastReps: null,
    timesUsed: 0,
  }));
  await db.exerciseCatalog.bulkAdd(items);
}
