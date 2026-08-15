/**
 * Regressão do bug "número invisível no Chrome Android" + remoção do volume
 * total multiplicado no fluxo de registro.
 *
 *  - StepperInput: o valor é TEXTO PURO (div), nunca <input> — não existe campo
 *    de texto para o navegador esconder. Verificamos que o valor aparece como
 *    texto renderizado e que NÃO existe <input> dentro do componente.
 *  - ExerciseCard: não exibe mais o volume total (kg × reps somado) no
 *    cabeçalho do exercício — cada série continua com peso × reps separados.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { StepperInput } from './StepperInput';

describe('StepperInput (número sempre visível)', () => {
  it('renderiza o valor como texto puro, sem <input>', () => {
    const html = renderToStaticMarkup(
      <StepperInput value="52,5" onChange={() => undefined} suffix="kg" ariaLabel="Carga da série 1" />
    );
    expect(html).toContain('52,5');
    expect(html).not.toMatch(/<input/i);
  });

  it('mantém os botões −/+ e o sufixo', () => {
    const html = renderToStaticMarkup(
      <StepperInput value="8" onChange={() => undefined} suffix="reps" ariaLabel="Repetições da série 1" />
    );
    expect(html).toContain('Diminuir');
    expect(html).toContain('Aumentar');
    expect(html).toContain('reps');
    expect(html).toContain('8');
  });

  it('mostra "0" quando o valor está vazio (campo nunca fica em branco)', () => {
    const html = renderToStaticMarkup(
      <StepperInput value="" onChange={() => undefined} ariaLabel="Carga" />
    );
    expect(html).toContain('>0<');
  });
});
