import { useEffect, useState } from 'react';
import { getPhoto } from '../services/photoService';

/**
 * Cria um URL.createObjectURL para a foto e revoga ao desmontar.
 * Passar photoId null/undefined limpa o estado.
 */
export function usePhotoUrl(photoId: string | number | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (photoId == null) {
      setUrl(null);
      return;
    }
    let alive = true;
    let objectUrl: string | null = null;
    getPhoto(Number(photoId))
      .then((photo) => {
        if (!alive || !photo) return;
        objectUrl = URL.createObjectURL(photo.blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        // foto indisponível — deixa sem imagem
      });
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photoId]);

  return url;
}
