import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  CheckCircle2,
  Database,
  Download,
  HardDrive,
  Info,
  Mars,
  Monitor,
  Moon,
  Plus,
  Ruler,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Sun,
  Trash2,
  Upload,
  User,
  UserRound,
  Venus,
} from 'lucide-react';
import type { Sex } from '../types';
import { db } from '../db/db';
import { DEFAULT_MUSCLE_GROUPS } from '../utils/constants';
import { formatBytes, parseNum, unitToKg } from '../utils/calc';
import { ACTIVE_PILL, cn, uid } from '../utils/misc';
import { StepperInput } from '../components/ui/StepperInput';
import { ensurePersistentStorage, getPersistStatus, getStorageUsage, type PersistStatus, type StorageUsage } from '../utils/storage';
import { isIOS, usePwaInstall } from '../hooks/usePwaInstall';
import { InstallAppButton } from '../components/PwaInstall';
import { ShareAppModal } from '../components/ShareApp';
import { useSettings, saveSettings } from '../services/settingsService';
import { clearAllData, exportAllData, importAllData, type ImportResult } from '../services/exportService';
import { createSampleData } from '../services/sampleData';
import { seedCatalogIfEmpty } from '../db/seed';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { ConfirmDialog, Modal } from '../components/ui/Modal';
import { Field, Input, Select } from '../components/ui/Field';
import { AvatarPicker } from '../components/ui/AvatarPicker';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { EmptyState } from '../components/ui/Feedback';

export function SettingsPage() {
  const settings = useSettings();
  const { push } = useToast();
  const catalog = useLiveQuery(() => db.exerciseCatalog.orderBy('name').toArray(), []) ?? [];

  const [username, setUsername] = useState(settings.username);
  const [avatar, setAvatar] = useState<string | null>(settings.avatarDataUrl ?? null);
  const [profileSex, setProfileSex] = useState<Sex | ''>(settings.sex ?? '');
  const [profileAge, setProfileAge] = useState(settings.age != null ? String(settings.age) : '');
  const [profileHeight, setProfileHeight] = useState(settings.heightCm != null ? String(settings.heightCm) : '');
  const [profileWeight, setProfileWeight] = useState(kgToInput(settings.weightKg, settings.unit));
  const [catQuery, setCatQuery] = useState('');
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState<string>(DEFAULT_MUSCLE_GROUPS[0]);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportResult | null>(null);
  const [importText, setImportText] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deletingAll, setDeletingAll] = useState(false);
  const [sampleOpen, setSampleOpen] = useState(false);
  const [creatingSample, setCreatingSample] = useState(false);
  const [storage, setStorage] = useState<StorageUsage | null>(null);
  const [persist, setPersist] = useState<PersistStatus | null>(null);
  const [persistBusy, setPersistBusy] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const pwa = usePwaInstall();

  useEffect(() => {
    setUsername(settings.username);
  }, [settings.username]);

  useEffect(() => {
    setAvatar(settings.avatarDataUrl ?? null);
  }, [settings.avatarDataUrl]);

  useEffect(() => {
    setProfileSex(settings.sex ?? '');
    setProfileAge(settings.age != null ? String(settings.age) : '');
    setProfileHeight(settings.heightCm != null ? String(settings.heightCm) : '');
    setProfileWeight(kgToInput(settings.weightKg, settings.unit));
  }, [settings.sex, settings.age, settings.heightCm, settings.weightKg, settings.unit]);

  useEffect(() => {
    void getStorageUsage().then(setStorage);
    void getPersistStatus().then(setPersist);
  }, []);

  const daysSinceBackup = settings.lastBackupAt ? Math.floor((Date.now() - settings.lastBackupAt) / 86_400_000) : null;

  async function protectStorage() {
    setPersistBusy(true);
    const status = await ensurePersistentStorage();
    setPersist(status);
    setPersistBusy(false);
    if (status === 'persisted') push('Proteção de dados ativada! O navegador não vai mais limpar seus dados.', 'success');
    else if (status === 'denied') push('O navegador negou a permissão. Tente novamente em Configurações.', 'error');
    else push('Este navegador não oferece essa proteção.', 'info');
  }

  async function saveUsername() {
    await saveSettings({ username: username.trim() });
    push('Nome salvo.');
  }

  async function saveAvatar(dataUrl: string | null) {
    setAvatar(dataUrl);
    await saveSettings({ avatarDataUrl: dataUrl ?? undefined });
    push(dataUrl ? 'Foto de perfil salva.' : 'Foto de perfil removida.');
  }

  async function saveProfile() {
    const w = parseNum(profileWeight);
    await saveSettings({
      sex: profileSex || undefined,
      age: profileAge.trim() ? parseNum(profileAge) : null,
      heightCm: profileHeight.trim() ? parseNum(profileHeight) : null,
      weightKg: w != null && w > 0 ? Math.round(unitToKg(w, settings.unit) * 10) / 10 : null,
    });
    push('Perfil atualizado!', 'success');
  }

  function addCatalogItem() {
    const name = newName.trim();
    if (!name) return;
    void db.exerciseCatalog
      .add({ name, muscleGroup: newGroup, favorite: false, lastWeight: null, lastReps: null, timesUsed: 0 })
      .then(() => {
        setNewName('');
        push('Exercício adicionado ao catálogo.');
      })
      .catch(() => push('Esse exercício já existe no catálogo.', 'error'));
  }

  async function toggleFavorite(id: number, favorite: boolean) {
    await db.exerciseCatalog.update(id, { favorite: !favorite });
  }

  async function removeCatalogItem(id: number) {
    await db.exerciseCatalog.delete(id);
    setDeleteItemId(null);
    push('Exercício removido do catálogo.');
  }

  function handleExport() {
    void exportAllData()
      .then(() => push('Backup exportado!', 'success'))
      .catch(() => push('Erro ao exportar.', 'error'));
  }

  function handleFile(file: File | undefined | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result);
        const parsed = JSON.parse(text) as { app?: string; workouts?: unknown[]; photos?: unknown[]; exerciseCatalog?: unknown[]; measurements?: unknown[] };
        if (parsed.app !== 'repfit' && parsed.app !== 'diario-de-treino') throw new Error('app');
        setImportPreview({
          workouts: parsed.workouts?.length ?? 0,
          photos: parsed.photos?.length ?? 0,
          catalog: parsed.exerciseCatalog?.length ?? 0,
          measurements: parsed.measurements?.length ?? 0,
        });
        setImportText(text);
        setImportOpen(true);
      } catch {
        push('Arquivo inválido: não parece ser um backup do RepFit.', 'error');
      }
    };
    reader.onerror = () => push('Não foi possível ler o arquivo.', 'error');
    reader.readAsText(file);
  }

  async function confirmImport() {
    if (!importText) return;
    setImporting(true);
    try {
      // Segurança: baixa um backup automático antes de substituir qualquer dado.
      await exportAllData();
      push('Backup automático baixado antes da importação.', 'success');
      const res = await importAllData(importText);
      push(`Importação concluída: ${res.workouts} treinos, ${res.photos} fotos.`, 'success');
      setImportOpen(false);
      setImportText(null);
    } catch (e) {
      push(e instanceof Error ? e.message : 'Erro ao importar (a importação foi cancelada).', 'error');
    } finally {
      setImporting(false);
    }
  }

  async function confirmDeleteAll() {
    setDeletingAll(true);
    try {
      // Segurança: baixa um backup automático antes de apagar qualquer coisa.
      await exportAllData();
      push('Backup automático baixado antes da exclusão.', 'success');
      await clearAllData();
      await seedCatalogIfEmpty(); // volta o catálogo de sugestões padrão
      push('Todos os dados foram excluídos.', 'info');
      setDeleteAllOpen(false);
      setDeleteText('');
    } catch {
      push('A exclusão foi cancelada (falha ao criar o backup de segurança).', 'error');
    } finally {
      setDeletingAll(false);
    }
  }

  async function confirmSample() {
    setCreatingSample(true);
    try {
      const n = await createSampleData();
      push(`${n} treinos de exemplo criados.`, 'success');
    } catch {
      push('Erro ao criar dados de exemplo.', 'error');
    } finally {
      setCreatingSample(false);
      setSampleOpen(false);
    }
  }

  const filteredCatalog = catalog.filter((c) => c.name.toLowerCase().includes(catQuery.trim().toLowerCase()));

  const SEX_OPTIONS: { value: Sex; label: string; icon: React.ReactNode }[] = [
    { value: 'masculino', label: 'Masculino', icon: <Mars className="h-4 w-4" /> },
    { value: 'feminino', label: 'Feminino', icon: <Venus className="h-4 w-4" /> },
    { value: 'outro', label: 'Outro', icon: <UserRound className="h-4 w-4" /> },
  ];

  const hasProfile = Boolean(settings.sex || settings.age != null || settings.heightCm != null || settings.weightKg != null);

  return (
    <div>
      <h1 className="mb-4 text-xl font-extrabold text-slate-900 dark:text-white">Configurações</h1>

      <div className="space-y-4">
        {/* Perfil */}
        <Card>
          <CardHeader title="Perfil" subtitle="Usado na saudação da tela inicial e nos cards" />
          <div className="px-5 pb-5">
            <AvatarPicker value={avatar} onChange={(v) => void saveAvatar(v)} size={84} />
          </div>
          <div className="flex flex-col gap-2 px-5 pb-5 sm:flex-row">
            <Field label="Seu nome" className="flex-1">
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Como quer ser chamado?"
                  className="pl-10"
                  onBlur={() => void saveUsername()}
                />
              </div>
            </Field>
            <div className="flex items-end">
              <Button onClick={() => void saveUsername()}>Salvar</Button>
            </div>
          </div>

          <div className="border-t border-slate-100 px-5 pb-5 pt-4 dark:border-white/10">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              <Ruler className="h-3.5 w-3.5" /> Dados do corpo
              {hasProfile && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-400/15 dark:text-amber-400">preenchido</span>}
            </p>
            <div className="space-y-4">
              <div>
                <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Sexo</span>
                <div className="grid grid-cols-3 gap-2">
                  {SEX_OPTIONS.map((o) => {
                    const active = profileSex === o.value;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setProfileSex(active ? '' : o.value)}
                        className={cn(
                          'flex items-center justify-center gap-1.5 rounded-full border px-2 py-2 text-xs font-semibold transition-all duration-150',
                          active && ACTIVE_PILL,
                          active && 'border-transparent',
                          !active &&
                            'border-slate-300 text-slate-600 hover:border-amber-400 hover:text-amber-600 dark:border-white/20 dark:text-slate-300 dark:hover:border-amber-400 dark:hover:text-amber-400'
                        )}
                      >
                        <span className={cn(active && 'text-black dark:text-black')}>{o.icon}</span>
                        <span className={cn(active && 'text-black dark:text-black')}>{o.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Idade" hint="Opcional">
                  <StepperInput
                    value={profileAge}
                    onChange={setProfileAge}
                    step={1}
                    min={10}
                    max={110}
                    suffix="anos"
                    inputMode="numeric"
                    ariaLabel="Idade"
                  />
                </Field>
                <Field label="Altura" hint="Opcional">
                  <StepperInput
                    value={profileHeight}
                    onChange={setProfileHeight}
                    step={1}
                    min={100}
                    max={250}
                    suffix="cm"
                    inputMode="numeric"
                    ariaLabel="Altura"
                  />
                </Field>
                <Field label="Peso" hint={settings.unit === 'lb' ? 'Em libras (lb)' : 'Em quilogramas (kg)'}>
                  <StepperInput
                    value={profileWeight}
                    onChange={setProfileWeight}
                    step={settings.unit === 'lb' ? 2.5 : 1}
                    min={30}
                    max={400}
                    suffix={settings.unit}
                    inputMode="decimal"
                    ariaLabel="Peso"
                  />
                </Field>
              </div>
              <Button onClick={() => void saveProfile()}>Salvar perfil</Button>
            </div>
          </div>
        </Card>

        {/* Aparência + unidade */}
        <Card>
          <CardHeader title="Aparência e unidades" />
          <div className="space-y-4 px-5 pb-5">
            <Field label="Tema">
              <SegmentedControl
                options={[
                  { value: 'auto', label: 'Automático', icon: <Monitor className="h-4 w-4" /> },
                  { value: 'light', label: 'Claro', icon: <Sun className="h-4 w-4" /> },
                  { value: 'dark', label: 'Escuro', icon: <Moon className="h-4 w-4" /> },
                ]}
                value={settings.theme}
                onChange={(v) => void saveSettings({ theme: v })}
                ariaLabel="Tema do app"
              />
            </Field>
            <Field label="Unidade de peso">
              <SegmentedControl
                options={[
                  { value: 'kg', label: 'Quilogramas (kg)' },
                  { value: 'lb', label: 'Libras (lb)' },
                ]}
                value={settings.unit}
                onChange={(v) => void saveSettings({ unit: v })}
                ariaLabel="Unidade de peso"
              />
            </Field>
          </div>
        </Card>

        {/* Instalar o app */}
        <Card>
          <CardHeader
            title="Instalar o app (PWA)"
            subtitle="Use o RepFit como um aplicativo, direto da tela inicial — funciona offline"
          />
          <div className="px-5 pb-5">
            {pwa.installed ? (
              <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 dark:bg-amber-400/10 dark:text-amber-300">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                App instalado — você está usando a versão de aplicativo.
              </div>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row">
                <InstallAppButton label="Baixar / instalar o app" size="lg" full />
                <Button variant="secondary" size="lg" onClick={() => setShareOpen(true)} className="sm:w-auto">
                  <Smartphone className="h-5 w-5" /> QR code / compartilhar
                </Button>
              </div>
            )}
            <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {isIOS()
                ? 'No iPhone/iPad: toque em Compartilhar → “Adicionar à Tela de Início”.'
                : 'No computador o app instala como um programa; no celular vira um ícone na tela inicial. Escaneie o QR code para abrir no celular. Tudo continua 100% offline e privado.'}
            </p>
          </div>
        </Card>

        {/* Catálogo */}
        <Card>
          <CardHeader
            title="Catálogo de exercícios"
            subtitle="Usado no autocomplete e nos atalhos rápidos"
            action={
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {catalog.length}
              </span>
            }
          />
          <div className="px-5 pb-5">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row">
              <Select value={newGroup} onChange={(e) => setNewGroup(e.target.value)} aria-label="Grupo muscular" className="sm:w-44">
                {DEFAULT_MUSCLE_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </Select>
              <Input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCatalogItem()}
                placeholder="Novo exercício…"
                aria-label="Nome do novo exercício"
                className="flex-1"
              />
              <Button onClick={addCatalogItem} disabled={!newName.trim()}>
                <Plus className="h-4 w-4" /> Adicionar
              </Button>
            </div>

            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                value={catQuery}
                onChange={(e) => setCatQuery(e.target.value)}
                placeholder="Buscar no catálogo…"
                className="pl-10"
                aria-label="Buscar no catálogo"
              />
            </div>

            {filteredCatalog.length === 0 ? (
              <EmptyState icon={<Search className="h-6 w-6" />} title="Nada encontrado" className="py-6" />
            ) : (
              <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-white/15">
                {filteredCatalog.map((c) => (
                  <li key={c.id} className="flex items-center gap-2 px-3.5 py-2.5">
                    <button
                      type="button"
                      onClick={() => c.id != null && void toggleFavorite(c.id, c.favorite)}
                      aria-label={c.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                      className="shrink-0 rounded-lg p-1 text-slate-300 hover:text-amber-400 dark:text-slate-600"
                    >
                      <Star className={cn('h-4 w-4', c.favorite && 'fill-amber-400 text-amber-400')} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{c.name}</p>
                      <p className="text-xs text-slate-400">
                        {c.muscleGroup}
                        {c.timesUsed > 0 && <> · {c.timesUsed}× usado</>}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteItemId(c.id ?? null)}
                      aria-label={`Remover ${c.name} do catálogo`}
                      className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        {/* Dados e backup */}
        <Card>
          <CardHeader title="Dados e backup" subtitle="Tudo fica salvo apenas neste navegador" />
          <div className="space-y-3 px-5 pb-5">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button variant="secondary" onClick={handleExport}>
                <Download className="h-4 w-4" /> Exportar backup (JSON)
              </Button>
              <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4" /> Importar backup
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>

            {storage && (
              <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3.5 text-sm dark:bg-slate-800/60">
                <HardDrive className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <p className="font-semibold text-slate-700 dark:text-slate-200">
                    {storage.supported
                      ? `${formatBytes(storage.usage ?? 0)} em uso${storage.quota != null ? ` de ${formatBytes(storage.quota)}` : ''}`
                      : 'Estimativa de espaço indisponível neste navegador.'}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Seus dados ficam salvos apenas neste dispositivo/navegador. Faça backups regularmente.
                  </p>
                </div>
              </div>
            )}

            {daysSinceBackup != null && daysSinceBackup >= 7 && (
              <div className="flex flex-col gap-2 rounded-xl border border-amber-300/60 bg-amber-50 p-3.5 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300 sm:flex-row sm:items-center sm:justify-between">
                <p>
                  ⚠️ Seu último backup foi há <b>{daysSinceBackup} dias</b>. Se algo acontecer com este
                  navegador, você pode perder os dados.
                </p>
                <Button variant="primary" size="sm" onClick={handleExport} className="shrink-0">
                  <Download className="h-4 w-4" /> Fazer backup agora
                </Button>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => setSampleOpen(true)}>
                <Sparkles className="h-4 w-4" /> Criar dados de exemplo
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                onClick={() => setDeleteAllOpen(true)}
              >
                <Trash2 className="h-4 w-4" /> Excluir todos os meus dados
              </Button>
            </div>

            {/* Proteção contra exclusão automática do navegador */}
            <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3.5 text-sm dark:bg-slate-800/60">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-700 dark:text-slate-200">Proteção contra limpeza automática</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {persist === 'persisted' && 'Ativa ✓ — o navegador não deve mais limpar seus dados automaticamente.'}
                  {persist === 'denied' && 'Inativa — o navegador pode limpar os dados se o dispositivo ficar sem espaço.'}
                  {persist === 'unsupported' && 'Este navegador não oferece a proteção de armazenamento persistente.'}
                  {persist === null && 'Verificando…'}
                </p>
                {persist !== 'persisted' && persist !== 'unsupported' && (
                  <button
                    onClick={() => void protectStorage()}
                    disabled={persistBusy}
                    className="mt-1.5 rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-black transition-colors hover:bg-amber-300 disabled:opacity-60"
                  >
                    {persistBusy ? 'Ativando…' : 'Ativar proteção dos dados'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Sobre */}
        <Card>
          <CardHeader title="Sobre" />
          <div className="flex items-start gap-3 px-5 pb-5 text-sm text-slate-600 dark:text-slate-300">
            <Database className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <p>
              <b>RepFit</b> é um app 100% local: sem contas, sem internet e sem envio de dados. As fotos
              são armazenadas como blobs no seu dispositivo. Para não perder nada, use a exportação de backup.
            </p>
          </div>
        </Card>
      </div>

      {/* Confirmação: remover item do catálogo */}
      <ConfirmDialog
        open={deleteItemId != null}
        onClose={() => setDeleteItemId(null)}
        onConfirm={() => deleteItemId != null && void removeCatalogItem(deleteItemId)}
        title="Remover do catálogo?"
        message="O exercício será removido das sugestões, mas os treinos já salvos não são afetados."
        confirmLabel="Remover"
        danger
      />

      {/* Prévia da importação */}
      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Importar backup"
        footer={
          <>
            <Button variant="secondary" onClick={() => setImportOpen(false)} disabled={importing}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={() => void confirmImport()} disabled={importing}>
              {importing ? 'Importando…' : 'Substituir tudo'}
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300">
            <b>Atenção:</b> a importação <b>substitui todos os dados atuais</b> do app. Exporte um backup antes, se
            quiser preservar o que existe agora.
          </div>
          {importPreview && (
            <ul className="space-y-1 rounded-xl bg-slate-50 p-3.5 font-medium text-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
              <li>📋 {importPreview.workouts} treinos</li>
              <li>🖼️ {importPreview.photos} fotos</li>
              <li>📚 {importPreview.catalog} exercícios no catálogo</li>
              <li>📏 {importPreview.measurements} medições corporais</li>
            </ul>
          )}
        </div>
      </Modal>

      {/* Excluir tudo */}
      <Modal
        open={deleteAllOpen}
        onClose={() => setDeleteAllOpen(false)}
        title="Excluir todos os dados"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteAllOpen(false)} disabled={deletingAll}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              disabled={deleteText !== 'EXCLUIR' || deletingAll}
              onClick={() => void confirmDeleteAll()}
            >
              {deletingAll ? 'Excluindo…' : 'Excluir tudo'}
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          <p className="text-slate-600 dark:text-slate-300">
            Todos os treinos, fotos, catálogo e configurações serão apagados para sempre. Essa ação não pode ser
            desfeita.
          </p>
          <Field label='Digite EXCLUIR para confirmar'>
            <Input value={deleteText} onChange={(e) => setDeleteText(e.target.value)} placeholder="EXCLUIR" />
          </Field>
        </div>
      </Modal>

      {/* Dados de exemplo */}
      <ConfirmDialog
        open={sampleOpen}
        onClose={() => setSampleOpen(false)}
        onConfirm={() => void confirmSample()}
        title="Criar dados de exemplo?"
        message="Serão adicionados treinos fictícios nas últimas semanas para você explorar o app."
        confirmLabel="Criar"
        loading={creatingSample}
      />

      {/* Instalar no celular (QR code / compartilhar) */}
      <ShareAppModal open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}

/** Converte peso em kg para exibição na unidade escolhida (ex.: 70 -> "70" ou "154.3"). */
function kgToInput(kg: number | null | undefined, unit: 'kg' | 'lb'): string {
  if (kg == null) return '';
  const v = unit === 'lb' ? kg * 2.2046226218 : kg;
  return v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}
