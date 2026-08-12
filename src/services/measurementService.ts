import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { BodyMeasurement, MeasureDef, Settings } from '../types';
import { DEFAULT_MEASURES } from '../utils/constants';
import { parseLocalDate, todayString } from '../utils/date';
import { uid } from '../utils/misc';
import { saveSettings } from './settingsService';

/** Medidas ordenadas da mais recente para a mais antiga (reativo). */
export function measurementsLive(): Promise<BodyMeasurement[]> {
  return db.measurements.orderBy('date').reverse().toArray();
}

export function useMeasurements(): BodyMeasurement[] {
  return useLiveQuery(() => measurementsLive(), [], []) ?? [];
}

/** Lista de tipos de medida: padrão + personalizados salvos nas configurações. */
export function getMeasureTypes(settings: Settings): MeasureDef[] {
  if (Array.isArray(settings.measureTypes) && settings.measureTypes.length > 0) {
    return settings.measureTypes;
  }
  return DEFAULT_MEASURES;
}

/**
 * Salva (ou atualiza) uma medição na data informada.
 * Se já existir uma medição na mesma data, os valores são substituídos.
 */
export async function saveMeasurement(date: string, values: Record<string, number | null>): Promise<void> {
  const existing = await db.measurements.where('date').equals(date).first();
  if (existing) {
    await db.measurements.update(existing.id as number, { values, createdAt: Date.now() });
  } else {
    await db.measurements.add({
      date,
      createdAt: Date.now(),
      values,
    });
  }
}

export async function deleteMeasurement(id: number): Promise<void> {
  await db.measurements.delete(id);
}

/** Adiciona um tipo de medida personalizado (persistido nas configurações). */
export async function addCustomMeasure(settings: Settings, label: string): Promise<MeasureDef[]> {
  const def: MeasureDef = { key: `custom-${uid().slice(0, 6)}`, label, unit: 'cm' };
  const next = [...getMeasureTypes(settings), def];
  await saveSettings({ measureTypes: next });
  return next;
}

/** Converte o valor armazenado para exibição (peso segue a unidade do app; cm fica igual). */
export function displayMeasureValue(def: MeasureDef, value: number, unit: Settings['unit']): { value: number; unit: string } {
  if (def.unit === 'kg') {
    return unit === 'lb' ? { value: Math.round(value * 2.20462 * 10) / 10, unit: 'lb' } : { value, unit: 'kg' };
  }
  return { value, unit: 'cm' };
}

/** Formata uma data YYYY-MM-DD como "09 AGO". */
export function measureDateLabel(date: string): string {
  return format(parseLocalDate(date), 'dd MMM', { locale: ptBR }).toUpperCase();
}

export { todayString };
