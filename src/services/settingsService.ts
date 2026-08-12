import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { Settings } from '../types';

export const DEFAULT_SETTINGS: Settings = {
  username: '',
  unit: 'kg',
  theme: 'auto',
};

export async function getSettings(): Promise<Settings> {
  const row = await db.settings.get('main');
  if (!row?.value) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...(row.value as Partial<Settings>) };
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const next = { ...current, ...patch };
  await db.settings.put({ key: 'main', value: next });
  return next;
}

/** Hook reativo: a UI atualiza sozinha quando as configurações mudam. */
export function useSettings(): Settings {
  const settings = useLiveQuery(() => getSettings(), [], DEFAULT_SETTINGS);
  return settings ?? DEFAULT_SETTINGS;
}
