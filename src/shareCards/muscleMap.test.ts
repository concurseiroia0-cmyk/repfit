/**
 * Testes do MAPEAMENTO EXERCÍCIO → MÚSCULOS (muscleMap.ts).
 *
 * Valida a tabela de grupos musculares usada pelo template de mapa anatômico:
 * exercícios conhecidos, palavras-chave para exercícios do usuário e o
 * fallback pelo muscleGroup do catálogo.
 */
import { describe, expect, it } from 'vitest';
import { collectMuscles, exerciseToMuscles } from './muscleMap';

describe('exerciseToMuscles (tabela de grupos musculares)', () => {
  it('supino reto → peito + tríceps + ombros', () => {
    expect(exerciseToMuscles('Supino Reto')).toEqual(['peito', 'triceps', 'ombros']);
  });

  it('agachamento livre → quadríceps + glúteos + posterior', () => {
    expect(exerciseToMuscles('Agachamento Livre')).toEqual(['quadriceps', 'gluteos', 'posterior']);
  });

  it('remada curvada → costas + bíceps + lombar', () => {
    expect(exerciseToMuscles('Remada Curvada')).toEqual(['lats', 'biceps', 'lombar']);
  });

  it('normaliza acentos e caixa (Café → sem acento)', () => {
    // "Elevação Lateral" → "elevacao lateral"
    expect(exerciseToMuscles('Elevação Lateral')).toEqual(['ombros', 'trapezio']);
  });

  it('exercício criado pelo usuário: palavra-chave no nome', () => {
    // "Corrida de rua" não está na tabela, mas contém "corrida"
    expect(exerciseToMuscles('Corrida de rua')).toEqual(['quadriceps', 'posterior', 'gluteos', 'panturrilha']);
  });

  it('fallback pelo muscleGroup do catálogo quando nada bate', () => {
    expect(exerciseToMuscles('Meu Exercício', 'Pernas')).toEqual(['quadriceps', 'posterior', 'gluteos']);
    expect(exerciseToMuscles('Qualquer Coisa', 'Core')).toEqual(['abs', 'obliquos']);
  });

  it('nome vazio / sem correspondência → []', () => {
    expect(exerciseToMuscles('')).toEqual([]);
    expect(exerciseToMuscles('Exercício Muito Exótico 123', null)).toEqual([]);
  });
});

describe('collectMuscles (união de exercícios do treino)', () => {
  it('une músculos de vários exercícios sem duplicar', () => {
    const muscles = collectMuscles([
      { name: 'Supino Reto' },
      { name: 'Tríceps Corda' },
      { name: 'Rosca Direta' },
    ]);
    expect(muscles).toEqual(['peito', 'ombros', 'biceps', 'triceps']);
  });

  it('usa o muscleGroup do catálogo quando o nome não é conhecido', () => {
    const muscles = collectMuscles([{ name: 'Meu Exercício X', muscleGroup: 'Peito' }]);
    expect(muscles).toEqual(['peito']);
  });

  it('treino vazio → [] (figura toda cinza)', () => {
    expect(collectMuscles([])).toEqual([]);
  });
});
