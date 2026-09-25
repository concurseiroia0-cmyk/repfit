import { useState } from 'react';
import { cn } from '../utils/misc';
import { Logo } from './Logo';

/**
 * Mascote do RepFit ("Tuff").
 *
 * SLOT PRONTO: quando as imagens do mascote chegarem, basta salvá-las em:
 *   public/mascote/tuff.png        (normal)
 *   public/mascote/tuff-wave.png   (acenando — usado no passo do nome)
 *   public/mascote/tuff-thumbs.png (joinha — usado na tela final)
 *
 * Enquanto o arquivo não existir (onError), o componente mostra o logo
 * do RepFit — a tela nunca fica com imagem quebrada.
 */
export type MascotePose = 'normal' | 'wave' | 'thumbs';

const POSE_FILES: Record<MascotePose, string> = {
  normal: 'mascote/tuff.png',
  wave: 'mascote/tuff-wave.png',
  thumbs: 'mascote/tuff-thumbs.png',
};

export function Mascote({
  pose = 'normal',
  className,
}: {
  pose?: MascotePose;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  // Troca de pose troca de arquivo: reseta o estado de erro.
  const [poseShown, setPoseShown] = useState<MascotePose>(pose);
  if (pose !== poseShown) {
    setPoseShown(pose);
    setFailed(false);
  }

  if (failed) {
    return <Logo className={cn('rounded-3xl', className)} />;
  }

  return (
    <img
      src={`${import.meta.env.BASE_URL}${POSE_FILES[pose]}`}
      alt="Mascote do RepFit"
      onError={() => setFailed(true)}
      className={cn('object-contain', className)}
      draggable={false}
    />
  );
}
