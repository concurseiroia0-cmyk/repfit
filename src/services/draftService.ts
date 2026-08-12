import { db } from '../db/db';
import type { WorkoutDraft, WorkoutFormState } from '../types';

const DRAFT_KEY = 'diario.rascunho.v1';
const DRAFT_PHOTO_WORKOUT_ID = 'draft';

/**
 * Salva o rascunho em localStorage (apenas texto — NUNCA fotos).
 * A foto do rascunho fica como Blob no IndexedDB com workoutId 'draft'.
 */
export function saveDraft(form: WorkoutFormState, photoId: string | null): void {
  try {
    const draft: WorkoutDraft = { form, photoId, updatedAt: Date.now() };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // localStorage cheio ou indisponível — ignora silenciosamente.
  }
}

export function loadDraft(): WorkoutDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WorkoutDraft;
    if (parsed && parsed.form && typeof parsed.form.date === 'string') return parsed;
    return null;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignora
  }
}

export function draftPhotoWorkoutId(): string {
  return DRAFT_PHOTO_WORKOUT_ID;
}

/** Remove fotos órfãs de rascunhos abandonados. */
export async function clearDraftPhotos(): Promise<void> {
  await db.photos.where('workoutId').equals(DRAFT_PHOTO_WORKOUT_ID).delete();
}
