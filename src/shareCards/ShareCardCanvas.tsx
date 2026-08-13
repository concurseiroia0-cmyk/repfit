import { forwardRef } from 'react';
import type {
  ShareCardData,
  ShareCustomization,
  ShareFormat,
  SharePhoto,
  ShareTemplateId,
  ShareTemplateProps,
} from './types';
import { GlassWorkoutTemplate } from './templates/GlassWorkoutTemplate';
import { PerformanceTemplate } from './templates/PerformanceTemplate';
import { MinimalTemplate } from './templates/MinimalTemplate';
import { PosterMinimalVerticalTemplate } from './templates/PosterMinimalVerticalTemplate';

/** Renderiza o template ativo. Templates são burros: só props → JSX. */
export function renderShareCard(props: ShareTemplateProps) {
  switch (props.template) {
    case 'performance':
      return <PerformanceTemplate {...props} />;
    case 'minimal':
      return <MinimalTemplate {...props} />;
    case 'posterMinimal':
      return <PosterMinimalVerticalTemplate {...props} />;
    default:
      return <GlassWorkoutTemplate {...props} />;
  }
}

interface ShareCardCanvasProps {
  data: ShareCardData;
  template: ShareTemplateId;
  format: ShareFormat;
  /** Escala da PRÉVIA (o nó exportado fica SEMPRE em escala 1 — sem transform). */
  scale: number;
  photo: SharePhoto | null;
  custom: ShareCustomization;
  overlay: number;
  logoUrl: string | null;
}

/**
 * Palco do card no tamanho real do formato (ex.: 1080×1350).
 * A prévia é o MESMO nó em escala 1 dentro de um wrapper escalado com
 * `transform: scale()` — assim preview === PNG. O transform fica em um
 * WRAPPER INTERMEDIÁRIO e nunca no nó exportado: o `html-to-image` dimensiona
 * o canvas por `clientWidth` (que ignora transforms), então um transform no
 * nó exportado produziria um PNG gigante e preto com o card encolhido no
 * canto. `forwardRef` expõe o nó real (escala 1) para o exportador.
 */
export const ShareCardCanvas = forwardRef<HTMLDivElement, ShareCardCanvasProps>(function ShareCardCanvas(
  { data, template, format, scale, photo, custom, overlay, logoUrl },
  ref
) {
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
        style={{
          width: format.width,
          height: format.height,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <div ref={ref} style={{ width: format.width, height: format.height }}>
          {renderShareCard({ data, template, format, photo, custom, overlay, logoUrl })}
        </div>
      </div>
    </div>
  );
});
