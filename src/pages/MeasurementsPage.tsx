import { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  MoveRight,
  Pencil,
  Plus,
  Ruler,
  Trash2,
} from 'lucide-react';
import { formatNumber, kgToUnit, parseNum, unitToKg } from '../utils/calc';
import { formatDate, todayString, weekdayName } from '../utils/date';
import { measureColor } from '../utils/constants';
import { useSettings } from '../services/settingsService';
import {
  addCustomMeasure,
  deleteMeasurement,
  displayMeasureValue,
  getMeasureTypes,
  measureDateLabel,
  saveMeasurement,
  useMeasurements,
} from '../services/measurementService';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { Field, Input } from '../components/ui/Field';
import { ConfirmDialog } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/Feedback';
import { LineChart, type ChartPoint } from '../components/charts/Charts';

export function MeasurementsPage() {
  const settings = useSettings();
  const entries = useMeasurements();
  const { push } = useToast();
  const measures = getMeasureTypes(settings);

  const [formDate, setFormDate] = useState(todayString());
  const [values, setValues] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<{ id: number; date: string } | null>(null);
  const [customLabel, setCustomLabel] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  /** Por medida: pontos do gráfico + último e penúltimo valor (cronológico). */
  const data = useMemo(() => {
    const chrono = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    const out = new Map<string, { points: ChartPoint[]; latest: number | null; prev: number | null }>();
    for (const m of measures) {
      const pts: ChartPoint[] = [];
      for (const e of chrono) {
        const v = e.values[m.key];
        if (v != null && Number.isFinite(v)) pts.push({ label: measureDateLabel(e.date), value: v });
      }
      out.set(m.key, {
        points: pts,
        latest: pts.length > 0 ? pts[pts.length - 1].value : null,
        prev: pts.length > 1 ? pts[pts.length - 2].value : null,
      });
    }
    return out;
  }, [entries, measures]);

  function resetForm() {
    setValues({});
    setFormDate(todayString());
    setEditing(null);
  }

  async function handleSave() {
    if (!formDate) {
      push('Escolha uma data.', 'error');
      return;
    }
    setSaving(true);
    try {
      const parsed: Record<string, number | null> = {};
      for (const m of measures) {
        const n = parseNum(values[m.key] ?? '');
        if (n == null) {
          parsed[m.key] = null;
          continue;
        }
        parsed[m.key] = m.unit === 'kg' ? Math.round(unitToKg(n, settings.unit) * 10) / 10 : Math.round(n * 10) / 10;
      }
      const hasAny = Object.values(parsed).some((v) => v != null);
      if (!hasAny) {
        push('Preencha pelo menos uma medida.', 'error');
        return;
      }
      if (editing) await deleteMeasurement(editing.id);
      await saveMeasurement(formDate, parsed);
      push(editing ? 'Medição atualizada.' : 'Medição salva!', 'success');
      resetForm();
    } catch {
      push('Erro ao salvar a medição.', 'error');
    } finally {
      setSaving(false);
    }
  }

  function startEdit(e: (typeof entries)[number]) {
    if (e.id == null) return;
    setEditing({ id: e.id, date: e.date });
    setFormDate(e.date);
    const pref: Record<string, string> = {};
    for (const m of measures) {
      const v = e.values[m.key];
      pref[m.key] = v != null ? formatNumber(m.unit === 'kg' ? kgToUnit(v, settings.unit) : v) : '';
    }
    setValues(pref);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete() {
    if (deleteId == null) return;
    await deleteMeasurement(deleteId);
    setDeleteId(null);
    push('Medição excluída.', 'info');
  }

  async function handleAddCustom() {
    const label = customLabel.trim();
    if (!label) return;
    await addCustomMeasure(settings, label);
    push(`Medida "${label}" adicionada.`, 'success');
    setCustomLabel('');
  }

  const inputUnit = (unit: 'kg' | 'cm') => (unit === 'kg' ? settings.unit : 'cm');

  return (
    <div>
      <h1 className="mb-1 text-xl font-extrabold text-slate-900 dark:text-white">Medidas corporais</h1>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        Registre peso e medidas ao longo do tempo — tudo fica salvo neste dispositivo.
      </p>

      {/* Formulário */}
      <Card>
        <CardHeader title={editing ? 'Editar medição' : 'Nova medição'} subtitle={editing ? `Editando ${formatDate(editing.date)}` : 'Anote seus números de hoje'} />
        <div className="space-y-4 px-5 pb-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Field label="Data" className="sm:w-48">
              <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} aria-label="Data da medição" />
            </Field>
            <p className="pb-2.5 text-xs font-medium text-slate-400">
              {formDate ? `${weekdayName(formDate)} · ${formatDate(formDate)}` : ''}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {measures.map((m) => {
              const u = inputUnit(m.unit);
              return (
                <Field key={m.key} label={`${m.label} (${u})`}>
                  <div className="relative">
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={values[m.key] ?? ''}
                      onChange={(e) => setValues((v) => ({ ...v, [m.key]: e.target.value }))}
                      placeholder="—"
                      aria-label={`${m.label} em ${u}`}
                      className="pr-9 text-right font-semibold"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {u}
                    </span>
                  </div>
                </Field>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Field label="Nova medida personalizada (ex.: Bíceps, Pescoço…)" className="flex-1">
              <Input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void handleAddCustom()}
                placeholder="Nome da medida…"
                aria-label="Nome da nova medida"
              />
            </Field>
            <Button variant="secondary" onClick={() => void handleAddCustom()} disabled={!customLabel.trim()}>
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-white/10">
            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving ? 'Salvando…' : editing ? 'Salvar alterações' : 'Salvar medição'}
            </Button>
            {editing && (
              <Button variant="ghost" onClick={resetForm}>
                Cancelar
              </Button>
            )}
          </div>
        </div>
      </Card>

      {entries.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={<Ruler className="h-7 w-7" />}
            title="Nenhuma medição registrada"
            description="Registre seu peso e medidas acima. Com o tempo, você vê aqui a evolução em gráficos e o resumo (ex.: 78 → 76 → 75 kg)."
          />
        </div>
      ) : (
        <>
          {/* Resumo por medida */}
          <h2 className="mb-3 mt-6 text-base font-bold text-slate-900 dark:text-white">Evolução</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {measures
              .filter((m) => (data.get(m.key)?.latest ?? null) != null)
              .map((m) => {
                const d = data.get(m.key)!;
                const u = m.unit === 'kg' ? settings.unit : 'cm';
                const latest = d.latest != null ? displayMeasureValue(m, d.latest, settings.unit) : null;
                const delta = d.latest != null && d.prev != null ? d.latest - d.prev : null;
                const last5 = d.points.slice(-5).map((p) => p.value);
                return (
                  <Card key={m.key} className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{m.label}</p>
                      {delta != null && delta !== 0 ? (
                        <span
                          className={`flex items-center gap-0.5 text-xs font-bold ${
                            delta > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {delta > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                          {formatNumber(Math.abs(delta))} {u}
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 text-xs font-bold text-slate-400">
                          <Minus className="h-4 w-4" /> {u}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
                      {latest ? `${formatNumber(latest.value)} ${latest.unit}` : '—'}
                    </p>
                    {last5.length > 0 && (
                      <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {last5.map((v, i) => (
                          <span key={i} className="flex items-center gap-1.5">
                            {i > 0 && <MoveRight className="h-3 w-3 text-amber-400" />}
                            <span className="rounded-lg bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                              {formatNumber(v)} {u}
                            </span>
                          </span>
                        ))}
                      </p>
                    )}
                  </Card>
                );
              })}
          </div>

          {/* Gráficos */}
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {measures
              .filter((m) => (data.get(m.key)?.points.length ?? 0) >= 2)
              .map((m) => {
                const d = data.get(m.key)!;
                const u = m.unit === 'kg' ? settings.unit : 'cm';
                return (
                  <Card key={m.key} className="p-5">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{m.label}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {d.points.length} registros · último: {formatNumber(d.points[d.points.length - 1].value)} {u}
                    </p>
                    <LineChart data={d.points} unit={u} color={measureColor(m.key)} className="mt-3" />
                  </Card>
                );
              })}
          </div>

          {/* Histórico */}
          <h2 className="mb-3 mt-6 text-base font-bold text-slate-900 dark:text-white">Histórico</h2>
          <div className="space-y-2">
            {entries.map((e) => {
              const filled = measures.filter((m) => e.values[m.key] != null);
              return (
                <div
                  key={e.id}
                  className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#161616] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {formatDate(e.date)}
                      <span className="ml-2 text-xs font-medium text-slate-400">{weekdayName(e.date)}</span>
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {filled.length === 0 && <span className="text-xs text-slate-400">sem medidas preenchidas</span>}
                      {filled.map((m) => {
                        const v = e.values[m.key];
                        const disp = v != null ? displayMeasureValue(m, v, settings.unit) : null;
                        return (
                          <span
                            key={m.key}
                            className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {m.label} {disp ? `${formatNumber(disp.value)} ${disp.unit}` : '—'}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(e)}
                      aria-label={`Editar medição de ${formatDate(e.date)}`}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-amber-500 dark:hover:bg-slate-800"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(e.id ?? null)}
                      aria-label={`Excluir medição de ${formatDate(e.date)}`}
                      className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <ConfirmDialog
        open={deleteId != null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => void handleDelete()}
        title="Excluir medição?"
        message="Esta medição será removida do histórico e dos gráficos."
        confirmLabel="Excluir"
        danger
      />
    </div>
  );
}
