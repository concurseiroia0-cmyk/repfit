import { forwardRef } from 'react';
import type { ShareCardData, ShareFormat, ShareTemplateId } from './types';
import { WorkoutCompletedCard } from './templates/WorkoutCompletedCard';
import { NewRecordCard } from './templates/NewRecordCard';
import { EvolutionCard } from './templates/EvolutionCard';

/** Renderiza o template ativo. Templates são burros: só props → JSX. */
export function renderShareCard(data: ShareCardData, template: ShareTemplateId, format: ShareFormat) {
  switch (template) {
    case 'record':
      return <NewRecordCard data={data} format={format} />;
    case 'evolution':
      return <EvolutionCard data={data} format={format} />;
    default:
      return <WorkoutCompletedCard data={data} format={format} />;
  }
}

interface ShareCardCanvasProps {
  data: ShareCardData;
  template: ShareTemplateId;
  format: ShareFormat;
  /** Escala da PRÉVIA (o nó exportado fica SEMPRE em escala 1 — sem transform). */
  scale: number;
}

/**
 * Palco do card no tamanho real do formato (ex.: 1080×1350).
 * A prévia é o MESMO nó em escala 1 dentro de um wrapper escalado com
 * `transform: scale()` — assim preview === PNG (o transform nunca toca o nó
 * que é exportado). `forwardRef` expõe o nó real para o exportador.
 */
export const ShareCardCanvas = forwardRef<HTMLDivElement, ShareCardCanvasProps>(
  function ShareCardCanvas({ data, template, format, scale }, ref) {
    return (
      <div
        style={{
          width: format.width * scale,
          height: format.height * scale,
          overflow: 'hidden',
          borderRadius: 32 * scale,
        }}
      >
        <div
          ref={ref}
          style={{
            width: format.width,
            height: format.height,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {renderShareCard(data, template, format)}
        </div>
      </div>
    );
  }
);
