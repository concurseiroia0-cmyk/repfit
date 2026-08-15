/**
 * Regressão: o ExerciseCard (fluxo de registro) NÃO mostra mais o "volume
 * total" (kg × reps somado) no cabeçalho — isso confundia os usuários, que
 * achavam que o app multiplicava as séries. Cada série mantém peso × reps
 * separados (visual/separador, não multiplicação).
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ExerciseCard } from './ExerciseCard';
import type { ExerciseCatalogItem, ExerciseDraft } from '../../types';

const CATALOG: ExerciseCatalogItem[] = [
  { id: 1, name: 'Supino Reto', muscleGroup: 'Peito', mode: 'ambos', favorite: false, lastWeight: 60, lastReps: 8, timesUsed: 1 },
];

const EXERCISE: ExerciseDraft = {
  id: 'x1',
  name: 'Supino Reto',
  effort: 4,
  notes: '',
  sets: [
    { id: 's1', weight: '50', reps: '5' },
    { id: 's2', weight: '52,5', reps: '3' },
  ],
};

function render(ex: ExerciseDraft = EXERCISE, mode: 'academia' | 'calistenia' | 'cardio' = 'academia'): string {
  return renderToStaticMarkup(
    <ExerciseCard
      exercise={ex}
      index={0}
      total={1}
      unit="kg"
      previous={null}
      catalog={CATALOG}
      mode={mode}
      onChange={() => undefined}
      onRemove={() => undefined}
      onMove={() => undefined}
    />
  );
}

describe('ExerciseCard (sem volume total multiplicado)', () => {
  it('não exibe o volume somado (5×5 + 52,5×3 = 25 + 157,5 = 182,5 kg)', () => {
    const html = render();
    expect(html).not.toContain('182,5');
    expect(html).not.toContain('182.5');
  });

  it('exibe cada série separada: peso × reps, com o × como separador', () => {
    const html = render();
    // Série 1 → 50 kg × 5 reps
    expect(html).toContain('50');
    expect(html).toContain('5');
    expect(html).toContain('52,5');
    expect(html).toContain('3');
    // O separador "×" entre os campos existe
    expect(html).toContain('×');
  });

  it('série com valores iguais também não gera total multiplicado (10 × 10 = 100)', () => {
    const ex: ExerciseDraft = {
      ...EXERCISE,
      sets: [{ id: 's1', weight: '10', reps: '10' }],
    };
    const html = render(ex);
    // O total multiplicado "100" nunca aparece como TEXTO (só existem os
    // valores "10" de cada campo). Nota: "text-slate-100" é classe CSS e
    // contém a substring 100 — por isso verificamos o texto renderizado.
    expect(html).not.toContain('>100<');
    expect(html).toContain('10');
    expect(html).toContain('×');
  });
});

describe('ExerciseCard (modo cardio)', () => {
  const CARDIO: ExerciseDraft = {
    id: 'c1',
    name: 'Bicicleta',
    effort: 3,
    notes: '',
    sets: [],
    timeMin: '30',
    distanceKm: '12,5',
  };

  it('mostra tempo e distância em vez de séries peso × reps', () => {
    const html = render(CARDIO, 'cardio');
    expect(html).toContain('30');
    expect(html).toContain('12,5');
    expect(html).toContain('min');
    expect(html).toContain('km');
    expect(html).not.toContain('Séries');
    expect(html).not.toContain('reps');
  });

  it('não mostra a seção de séries no modo cardio (sem peso × reps)', () => {
    const html = render(CARDIO, 'cardio');
    expect(html).not.toContain('1ª');
    expect(html).not.toContain('×');
  });

  it('modo academia continua com séries mesmo com campos de cardio presentes', () => {
    const html = render({ ...CARDIO, sets: [{ id: 's1', weight: '40', reps: '8' }] }, 'academia');
    expect(html).toContain('Séries');
    expect(html).toContain('1ª');
    expect(html).toContain('40');
    expect(html).toContain('8');
  });
});
