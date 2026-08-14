import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AtSign, Mars, Ruler, Scale, UserRound, UserRoundCog, Venus } from 'lucide-react';
import type { Sex } from '../types';
import { parseNum, unitToKg } from '../utils/calc';
import { todayString } from '../utils/date';
import { ACTIVE_PILL, cn } from '../utils/misc';
import { saveSettings, useSettings } from '../services/settingsService';
import { saveMeasurement } from '../services/measurementService';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Field, Input } from '../components/ui/Field';
import { StepperInput } from '../components/ui/StepperInput';
import { AvatarPicker } from '../components/ui/AvatarPicker';
import { Logo } from '../components/Logo';

const SEX_OPTIONS: { value: Sex; label: string; icon: React.ReactNode }[] = [
  { value: 'masculino', label: 'Masculino', icon: <Mars className="h-5 w-5" /> },
  { value: 'feminino', label: 'Feminino', icon: <Venus className="h-5 w-5" /> },
  { value: 'outro', label: 'Outro', icon: <UserRound className="h-5 w-5" /> },
];

function kgToInput(kg: number | null | undefined, unit: 'kg' | 'lb'): string {
  if (kg == null) return '';
  const v = unit === 'lb' ? kg * 2.2046226218 : kg;
  return v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}

/**
 * Onboarding exibido logo após a boas-vindas: o usuário conta
 * sexo, idade, altura e peso. Mantém o design do projeto (sem fotos):
 * fundo escuro, cards arredondados, pílulas douradas e números grandes.
 */
export function ProfileSetupPage() {
  const navigate = useNavigate();
  const { push } = useToast();
  const settings = useSettings();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(settings.username);
  const [avatar, setAvatar] = useState<string | null>(settings.avatarDataUrl ?? null);
  const [sex, setSex] = useState<Sex | ''>(settings.sex ?? '');
  const [age, setAge] = useState(settings.age != null ? String(settings.age) : '');
  const [height, setHeight] = useState(settings.heightCm != null ? String(settings.heightCm) : '');
  const [weight, setWeight] = useState(kgToInput(settings.weightKg, settings.unit));

  // O useSettings() resolve depois do primeiro render (valor padrão vazio) —
  // sincroniza o formulário com o que está salvo assim que carrega.
  useEffect(() => {
    setName(settings.username);
    setAvatar(settings.avatarDataUrl ?? null);
    setSex(settings.sex ?? '');
    setAge(settings.age != null ? String(settings.age) : '');
    setHeight(settings.heightCm != null ? String(settings.heightCm) : '');
    setWeight(kgToInput(settings.weightKg, settings.unit));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.username, settings.avatarDataUrl, settings.sex, settings.age, settings.heightCm, settings.weightKg, settings.unit]);

  async function finish(skip: boolean) {
    setSaving(true);
    try {
      const weightNum = parseNum(weight);
      const weightKg = weightNum != null && weightNum > 0 ? Math.round(unitToKg(weightNum, settings.unit) * 10) / 10 : null;
      await saveSettings({
        // Nome e foto valem sempre (mesmo pulando as medidas).
        username: name.trim(),
        avatarDataUrl: avatar ?? undefined,
        sex: skip ? undefined : sex || undefined,
        age: skip || !age.trim() ? undefined : parseNum(age),
        heightCm: skip || !height.trim() ? undefined : parseNum(height),
        weightKg,
        profileDone: true,
      });
      if (!skip && weightKg != null) {
        // O peso inicial também entra no histórico de medidas (hoje).
        await saveMeasurement(todayString(), { weight: weightKg });
      }
      if (!skip) push('Perfil salvo! Bora treinar. 💪', 'success');
      navigate('/');
    } catch {
      push('Erro ao salvar o perfil.', 'error');
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center">
          <Logo className="mx-auto h-16 w-16 rounded-3xl shadow-[0_0_40px_rgba(251,191,36,0.4)]" />
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Conte sobre <span className="text-amber-500 dark:text-amber-400">você</span>
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Isso ajuda a acompanhar sua evolução. Tudo fica salvo apenas neste dispositivo.
          </p>
        </div>

        <Card className="mt-6 p-5">
          <div className="space-y-5">
            {/* Foto de perfil */}
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <UserRound className="h-4 w-4 text-amber-500 dark:text-amber-400" /> Foto de perfil
              </p>
              <AvatarPicker value={avatar} onChange={setAvatar} size={88} />
            </div>

            {/* Nome/apelido */}
            <Field label="Nome / apelido">
              <div className="relative">
                <AtSign className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Como quer ser chamado?"
                  maxLength={40}
                  className="pl-10"
                />
              </div>
            </Field>

            {/* Sexo */}
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <UserRoundCog className="h-4 w-4 text-amber-500 dark:text-amber-400" /> Sexo
              </p>
              <div className="grid grid-cols-3 gap-2">
                {SEX_OPTIONS.map((o) => {
                  const active = sex === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSex(active ? '' : o.value)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3.5 text-xs font-semibold transition-all duration-150',
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

            {/* Idade */}
            <Field label="Idade" hint="Opcional">
              <StepperInput
                value={age}
                onChange={setAge}
                step={1}
                min={10}
                max={110}
                suffix="anos"
                inputMode="numeric"
                ariaLabel="Idade"
              />
            </Field>

            {/* Altura */}
            <Field label="Altura" hint="Opcional">
              <StepperInput
                value={height}
                onChange={setHeight}
                step={1}
                min={100}
                max={250}
                suffix="cm"
                inputMode="numeric"
                ariaLabel="Altura"
              />
            </Field>

            {/* Peso */}
            <Field label="Peso" hint={settings.unit === 'lb' ? 'Em libras (lb)' : 'Em quilogramas (kg)'}>
              <StepperInput
                value={weight}
                onChange={setWeight}
                step={settings.unit === 'lb' ? 2.5 : 1}
                min={30}
                max={400}
                suffix={settings.unit}
                inputMode="decimal"
                ariaLabel="Peso"
              />
            </Field>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <Button size="lg" full onClick={() => void finish(false)} disabled={saving}>
              <Scale className="h-4 w-4" /> Salvar e continuar
            </Button>
            <Button variant="ghost" size="lg" full onClick={() => void finish(true)} disabled={saving}>
              <Ruler className="h-4 w-4" /> Preencher depois
            </Button>
          </div>
        </Card>

        <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
          Você pode editar estas informações depois em Configurações → Perfil.
        </p>
      </div>
    </div>
  );
}
