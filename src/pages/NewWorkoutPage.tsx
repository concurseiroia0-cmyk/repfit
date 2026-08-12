import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { Unit, Workout, WorkoutExercise } from '../types';
import { WorkoutForm, emptyWorkoutFormState } from '../components/workout/WorkoutForm';
import { SkeletonCard } from '../components/ui/Feedback';
import { useToast } from '../components/ui/Toast';
import { displayToKg, formatNumber, parseNum } from '../utils/calc';
import { formatDayShort, parseLocalDate, todayString } from '../utils/date';
import { clearDraft, clearDraftPhotos, draftPhotoWorkoutId, loadDraft, saveDraft } from '../services/draftService';
import { relinkPhoto } from '../services/photoService';
import { useSettings } from '../services/settingsService';
import { getWorkout, saveWorkout, workoutFromTemplate } from '../services/workoutService';
import type { RecordEntry } from '../services/recordsService';

function kgToInput(kg: number, unit: Unit): string {
  const v = unit === 'lb' ? kg * 2.2046226218 : kg;
  return v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}

function recordMessage(r: RecordEntry): string {
  const suffix = r.unit === 'kg' ? ' kg' : r.unit === 'reps' ? ' reps' : r.unit === 'dias' ? ' dias' : '';
  const sub = r.sublabel ? `${r.sublabel}: ` : '';
  return `🎉 Novo recorde! ${sub}${r.label} — ${formatNumber(r.value)}${suffix}`;
}

export function NewWorkoutPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { push } = useToast();
  const settings = useSettings();
  const catalog = useLiveQuery(() => db.exerciseCatalog.orderBy('name').toArray(), []) ?? [];

  const isEdit = Boolean(id);
  const repetirId = searchParams.get('repetir');
  const dataParam = searchParams.get('data');

  const [form, setForm] = useState(() => emptyWorkoutFormState(dataParam || todayString()));
  const [photoId, setPhotoId] = useState<string | null>(null);
  const [previous, setPrevious] = useState<WorkoutExercise[] | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(isEdit || Boolean(repetirId));
  const [saving, setSaving] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [repeatSourceDate, setRepeatSourceDate] = useState<string | null>(null);
  const restoredRef = useRef(false);

  const photoTarget = isEdit ? String(id) : draftPhotoWorkoutId();

  // Carrega treino (editar ou repetir) ou restaura o rascunho.
  useEffect(() => {
    let alive = true;
    (async () => {
      if (repetirId) {
        const src = await getWorkout(Number(repetirId));
        if (!alive) return;
        if (src) {
          const tpl = workoutFromTemplate(src, todayString());
          setForm({
            date: tpl.date,
            name: tpl.name,
            type: tpl.type,
            notes: tpl.notes,
            durationMin: tpl.durationMin != null ? String(tpl.durationMin) : '',
            restSec: tpl.restSec ?? 0,
            exercises: tpl.exercises.map((e) => ({
              id: e.id,
              name: e.name,
              effort: e.effort,
              notes: e.notes,
              sets: e.sets.map((s) => ({
                id: s.id,
                weight: s.weight != null ? kgToInput(s.weight, settings.unit) : '',
                reps: s.reps != null ? String(s.reps) : '',
              })),
            })),
          });
          setPrevious(src.exercises);
          setRepeatSourceDate(src.date);
        } else {
          push('Treino de origem não encontrado.', 'error');
        }
      } else if (isEdit && id) {
        const w = await getWorkout(Number(id));
        if (!alive) return;
        if (w) {
          setForm({
            date: w.date,
            name: w.name,
            type: w.type,
            notes: w.notes,
            durationMin: w.durationMin != null ? String(w.durationMin) : '',
            restSec: w.restSec ?? 0,
            exercises: w.exercises.map((e) => ({
              id: e.id,
              name: e.name,
              effort: e.effort,
              notes: e.notes,
              sets: e.sets.map((s) => ({
                id: s.id,
                weight: s.weight != null ? kgToInput(s.weight, settings.unit) : '',
                reps: s.reps != null ? String(s.reps) : '',
              })),
            })),
          });
          setPhotoId(w.photoId ? String(w.photoId) : null);
        } else {
          push('Treino não encontrado.', 'error');
          navigate('/historico', { replace: true });
        }
      } else {
        const draft = loadDraft();
        if (draft && draft.form) {
          setForm(draft.form);
          setPhotoId(draft.photoId);
          setDraftRestored(true);
          restoredRef.current = true;
        } else {
          await clearDraftPhotos();
        }
      }
      if (alive) {
        setReady(true);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Rascunho automático (apenas treinos novos).
  const hasContent =
    form.name.trim() !== '' ||
    form.notes.trim() !== '' ||
    form.restSec > 0 ||
    form.exercises.some((e) => e.name.trim() !== '' || e.sets.some((s) => s.weight.trim() !== '' || s.reps.trim() !== '')) ||
    Boolean(photoId);

  useEffect(() => {
    if (!ready || isEdit || loading) return;
    if (restoredRef.current) {
      restoredRef.current = false;
      return;
    }
    if (!hasContent) return;
    const t = window.setTimeout(() => saveDraft(form, photoId), 500);
    return () => window.clearTimeout(t);
  }, [form, photoId, ready, isEdit, loading, hasContent]);

  function discardDraft() {
    clearDraft();
    void clearDraftPhotos();
    setForm(emptyWorkoutFormState());
    setPhotoId(null);
    setDraftRestored(false);
    push('Rascunho descartado.');
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      push('Dê um nome ao treino.', 'error');
      return;
    }
    const exercises = form.exercises
      .map((e, i) => ({
        id: e.id,
        name: e.name.trim(),
        order: i,
        effort: e.effort,
        notes: e.notes.trim(),
        sets: e.sets
          .filter((s) => s.weight.trim() !== '' || s.reps.trim() !== '')
          .map((s) => ({ id: s.id, weight: displayToKg(s.weight, settings.unit), reps: parseNum(s.reps) })),
      }))
      .filter((e) => e.name.length > 0);
    if (exercises.length === 0) {
      push('Adicione ao menos um exercício.', 'error');
      return;
    }

    setSaving(true);
    try {
      const workout: Workout = {
        id: isEdit ? Number(id) : undefined,
        date: form.date,
        weekday: parseLocalDate(form.date).getDay(),
        name: form.name.trim(),
        type: form.type,
        notes: form.notes.trim(),
        exercises,
        photoId: null,
        durationMin: parseNum(form.durationMin),
        restSec: form.restSec > 0 ? form.restSec : null,
        totalVolume: 0,
        avgEffort: null,
        createdAt: 0,
        updatedAt: Date.now(),
      };
      const { workout: saved, newRecords } = await saveWorkout(workout);
      await relinkPhoto(photoId, String(saved.id));
      if (!isEdit) {
        clearDraft();
        await clearDraftPhotos();
      }
      if (newRecords.length > 0) {
        newRecords.slice(0, 3).forEach((r) => push(recordMessage(r), 'success'));
      } else {
        push(isEdit ? 'Treino atualizado!' : 'Treino salvo!', 'success');
      }
      // Não abre o compartilhamento automaticamente — quem quiser compartilha
      // pelo botão "Compartilhar treino" na tela de detalhe.
      navigate(`/treino/${saved.id}`);
    } catch {
      push('Erro ao salvar o treino. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
          {isEdit ? 'Editar treino' : repetirId ? 'Repetir treino' : 'Novo treino'}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {repetirId
            ? 'Valores do treino anterior já preenchidos — ajuste o que mudou.'
            : 'Rápido de preencher. Seu rascunho é salvo automaticamente.'}
        </p>
      </div>
      <WorkoutForm
        form={form}
        onChange={setForm}
        photoId={photoId}
        photoWorkoutId={photoTarget}
        onPhotoChange={setPhotoId}
        unit={settings.unit}
        catalog={catalog}
        previous={previous}
        submitLabel={isEdit ? 'Salvar alterações' : 'Salvar treino'}
        saving={saving}
        onSubmit={handleSubmit}
        draftBanner={
          draftRestored && !isEdit && !repetirId
            ? 'Um rascunho seu foi restaurado automaticamente.'
            : repetirId
              ? `Treino de ${formatDayShort(repeatSourceDate ?? todayString())} como base.`
              : null
        }
        onDiscardDraft={draftRestored && !isEdit && !repetirId ? discardDraft : undefined}
      />
    </div>
  );
}


