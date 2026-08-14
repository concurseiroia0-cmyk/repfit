// ============================================================================
// Estado da última sincronização, persistido em localStorage para a UI
// (configurações) exibir o status mesmo depois de recarregar a página.
// ============================================================================

import { syncAll, type SyncResult } from './sync';

const RESULT_KEY = 'repfit:lastSync';
const AT_KEY = 'repfit:lastSyncAt';

function readJSON(key: string): SyncResult | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SyncResult;
    return parsed && typeof parsed.status === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

export function getLastSync(): SyncResult | null {
  return readJSON(RESULT_KEY);
}

/** Executa syncAll() e guarda o resultado + timestamp para a UI. */
export async function runSync(): Promise<SyncResult> {
  const result = await syncAll();
  try {
    localStorage.setItem(RESULT_KEY, JSON.stringify(result));
    localStorage.setItem(AT_KEY, String(Date.now()));
  } catch {
    // localStorage indisponível — apenas não persiste o status.
  }
  return result;
}

/** Timestamp da última sincronização bem-sucedida (para "há X min"). */
export function getLastSyncAt(): number | null {
  try {
    const raw = localStorage.getItem(AT_KEY);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}
