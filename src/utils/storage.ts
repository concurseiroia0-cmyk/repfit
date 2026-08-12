export interface StorageUsage {
  usage: number | null;
  quota: number | null;
  supported: boolean;
}

/** Estima o espaço usado pelo navegador (quando a API está disponível). */
export async function getStorageUsage(): Promise<StorageUsage> {
  try {
    const nav = navigator as Navigator & { storage?: { estimate?: () => Promise<{ usage?: number; quota?: number }> } };
    if (nav.storage?.estimate) {
      const est = await nav.storage.estimate();
      return {
        usage: est.usage ?? null,
        quota: est.quota ?? null,
        supported: true,
      };
    }
  } catch {
    // API indisponível — segue para o fallback.
  }
  return { usage: null, quota: null, supported: false };
}

/** Converte Blob em data URL (usado na exportação). */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Falha ao ler arquivo'));
    reader.readAsDataURL(blob);
  });
}

/** Converte data URL (base64) de volta em Blob (usado na importação). */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

export type PersistStatus = 'persisted' | 'denied' | 'unsupported';

/**
 * Pede ao navegador para NÃO limpar os dados deste app automaticamente
 * (Storage Persistence API). Reduz o risco de perder IndexedDB sob pressão de espaço.
 */
export async function ensurePersistentStorage(): Promise<PersistStatus> {
  try {
    const nav = navigator as Navigator & {
      storage?: { persist?: () => Promise<boolean>; persisted?: () => Promise<boolean> };
    };
    if (!nav.storage?.persist || !nav.storage?.persisted) return 'unsupported';
    const already = await nav.storage.persisted();
    if (!already) {
      await nav.storage.persist();
    }
    const now = await nav.storage.persisted();
    return now ? 'persisted' : 'denied';
  } catch {
    return 'unsupported';
  }
}

/** Consulta se o armazenamento já é persistente. */
export async function getPersistStatus(): Promise<PersistStatus> {
  try {
    const nav = navigator as Navigator & { storage?: { persisted?: () => Promise<boolean> } };
    if (!nav.storage?.persisted) return 'unsupported';
    return (await nav.storage.persisted()) ? 'persisted' : 'denied';
  } catch {
    return 'unsupported';
  }
}
