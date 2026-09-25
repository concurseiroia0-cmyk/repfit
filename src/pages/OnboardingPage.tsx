import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Check, Languages } from 'lucide-react';
import type { Sex } from '../types';
import { cn } from '../utils/misc';
import { saveSettings, useSettings } from '../services/settingsService';
import { saveMeasurement } from '../services/measurementService';
import { todayString } from '../utils/date';
import { unitToKg } from '../utils/calc';
import { changeLang, currentLang } from '../i18n';
import { AvatarPicker } from '../components/ui/AvatarPicker';
import { Mascote } from '../components/Mascote';
import { useTheme } from '../hooks/useTheme';

// ============================================================================
// Onboarding wizard do RepFit (inspirado no Liftoff, nas cores do app).
// Passos: 0 splash | 1 objetivo | 2 frequencia | 3 modalidade
//         | 4 peso/altura (regua) | 5 nome/sexo/avatar | 6 segurar p/ finalizar
// ============================================================================

type Goal = 'massa' | 'perder' | 'forca' | 'registrar';
type Mode = 'academia' | 'calistenia' | 'cardio';

const TOTAL_STEPS = 7;

const GOALS: { value: Goal; emoji: string; label: string; desc: string }[] = [
  { value: 'massa', emoji: '💪', label: 'Ganhar massa', desc: 'Hipertrofia e volume' },
  { value: 'perder', emoji: '🔥', label: 'Perder peso', desc: 'Queimar e definir' },
  { value: 'forca', emoji: '🏋️', label: 'Ganhar força', desc: 'Cargas cada vez maiores' },
  { value: 'registrar', emoji: '📊', label: 'Só registrar', desc: 'Anotar e acompanhar' },
];

const MODES: { value: Mode; emoji: string; label: string; desc: string }[] = [
  { value: 'academia', emoji: '🏋️', label: 'Academia', desc: 'Pesos e máquinas' },
  { value: 'calistenia', emoji: '🤸', label: 'Calistenia', desc: 'Peso do corpo' },
  { value: 'cardio', emoji: '🏃', label: 'Cardio', desc: 'Corrida, bike…' },
];

/** Régua horizontal estilo Liftoff: arraste/role e o valor central é escolhido. */
function RulerPicker({
  min,
  max,
  value,
  onChange,
  suffix,
}: {
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  suffix: string;
}) {
  const itemW = 44;
  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const items = useMemo(() => {
    const out: number[] = [];
    for (let v = min; v <= max; v++) out.push(v);
    return out;
  }, [min, max]);

  // Centraliza o valor atual na montagem.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollLeft = (value - min) * itemW - el.clientWidth / 2 + itemW / 2;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onScroll() {
    if (rafRef.current != null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      const el = trackRef.current;
      if (!el) return;
      const idx = Math.round((el.scrollLeft + el.clientWidth / 2 - itemW / 2) / itemW);
      const v = Math.min(max, Math.max(min, min + idx));
      if (v !== value) onChange(v);
    });
  }

  return (
    <div className="relative pt-14">
      <div className="pointer-events-none absolute inset-x-0 top-0 text-center">
        <span className="text-5xl font-black tabular-nums tracking-tight text-slate-900 dark:text-white">{value}</span>
        <span className="ml-1.5 text-lg font-bold text-slate-400">{suffix}</span>
      </div>
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="hide-scrollbar flex snap-x snap-mandatory items-end overflow-x-auto pb-2"
        role="slider"
        aria-label={suffix}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        tabIndex={0}
      >
        <span style={{ minWidth: '50%', flexShrink: 0 }} />
        {items.map((v) => {
          const isMajor = v % 10 === 0;
          const isMid = v % 5 === 0;
          const selected = v === value;
          return (
            <button
              key={v}
              type="button"
              tabIndex={-1}
              onClick={() => onChange(v)}
              className="flex snap-center shrink-0 flex-col items-center justify-end"
              style={{ width: itemW }}
            >
              {selected && (
                <span className="mb-1 text-xs font-extrabold text-amber-500 dark:text-amber-400">{v}</span>
              )}
              <span
                className={cn(
                  'rounded-full transition-all duration-150',
                  selected
                    ? 'h-9 w-1.5 bg-amber-400'
                    : isMajor
                      ? 'h-6 w-0.5 bg-slate-300 dark:bg-white/25'
                      : isMid
                        ? 'h-4 w-0.5 bg-slate-300/70 dark:bg-white/15'
                        : 'h-2.5 w-0.5 bg-slate-200 dark:bg-white/10'
                )}
              />
            </button>
          );
        })}
        <span style={{ minWidth: '50%', flexShrink: 0 }} />
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-white to-transparent dark:from-[#161616]" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-14 bg-gradient-to-r from-white to-transparent dark:from-[#161616]" />
    </div>
  );
}

/** Tela final: segure o mascote — o círculo cresce até preencher a tela. */
function HoldToFinish({ onComplete }: { onComplete: () => void }) {
  const { t } = useTranslation();
  const [holding, setHolding] = useState(false);
  const [filled, setFilled] = useState(false);
  const timerRef = useRef<number | null>(null);

  function startHold() {
    if (filled) return;
    setHolding(true);
    timerRef.current = window.setTimeout(() => {
      setFilled(true);
      window.setTimeout(onComplete, 900);
    }, 1100);
  }

  function cancelHold() {
    setHolding(false);
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  useEffect(() => cancelHold, []);

  return (
    <div className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden">
      <div
        aria-hidden
        className={cn(
          'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400',
          'transition-[width,height] ease-out',
          holding ? 'duration-[1100ms]' : 'duration-300'
        )}
        style={{
          width: holding || filled ? '260vmax' : 148,
          height: holding || filled ? '260vmax' : 148,
        }}
      />
      <div className={cn('relative z-10 flex flex-col items-center', filled && 'text-black')}>
        <button
          type="button"
          aria-label={t('Segure para finalizar')}
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerLeave={cancelHold}
          onPointerCancel={cancelHold}
          className={cn(
            'flex h-36 w-36 items-center justify-center rounded-full border-2 transition-transform duration-200 active:scale-105',
            filled ? 'border-black/30 bg-white/60' : 'border-amber-400/70 bg-amber-400/10'
          )}
        >
          <Mascote pose="thumbs" className="h-28 w-28" />
        </button>
        <p
          className={cn(
            'mt-6 max-w-xs text-center text-xl font-black leading-snug',
            filled ? 'text-black' : 'text-slate-900 dark:text-white'
          )}
        >
          {filled ? t('Tudo pronto! 🎉') : t('tudo pronto, agora só falta pressionar no tuff')}
        </p>
        {!filled && (
          <p className="mt-2 text-xs font-semibold text-slate-400 dark:text-slate-500">{t('(segure o círculo)')}</p>
        )}
      </div>
    </div>
  );
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const settings = useSettings();

  const [step, setStep] = useState(0);
  const [slideDir, setSlideDir] = useState<1 | -1>(1);
  const [goal, setGoal] = useState<Goal | null>(settings.onboardingGoal ?? null);
  const [freq, setFreq] = useState(3);
  const [mode, setMode] = useState<Mode>(settings.onboardingMode ?? 'academia');
  const [sex, setSex] = useState<Sex | ''>(settings.sex ?? '');
  const [weightKg, setWeightKg] = useState(settings.weightKg ?? 70);
  const [heightCm, setHeightCm] = useState(settings.heightCm ?? 175);
  const [name, setName] = useState(settings.username);
  const [avatar, setAvatar] = useState<string | null>(settings.avatarDataUrl ?? null);
  const [lang, setLang] = useState(currentLang());
  const [saving, setSaving] = useState(false);
  useTheme(settings.theme);

  function go(next: number) {
    setSlideDir(next >= step ? 1 : -1);
    setStep(next);
  }

  function pickLang(l: 'pt-BR' | 'en-US') {
    setLang(l);
    void changeLang(l);
  }

  async function persist() {
    setSaving(true);
    try {
      const weight = Math.round(unitToKg(weightKg, settings.unit) * 10) / 10;
      await saveSettings({
        onboardingGoal: goal ?? undefined,
        onboardingMode: mode,
        weeklyGoal: { type: 'frequency', target: freq },
        sex: sex || undefined,
        heightCm,
        weightKg: weight,
        username: name.trim(),
        avatarDataUrl: avatar ?? undefined,
        welcomeSeen: true,
        onboardingDone: true,
      });
      if (settings.weightKg == null) {
        await saveMeasurement(todayString(), { weight });
      }
    } finally {
      setSaving(false);
    }
  }

  async function finish() {
    await persist();
    navigate('/novo', { replace: true });
  }

  async function finishWithSample() {
    await persist();
    navigate('/', { replace: true });
  }

  const cta =
    'mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 text-base font-black text-black shadow-[0_6px_24px_rgba(251,191,36,0.4)] transition-all hover:bg-amber-300 active:scale-[0.98]';

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-[#161616]">
      {step > 0 && (
        <div className="flex items-center gap-3 px-4 pt-4">
          <button
            type="button"
            onClick={() => go(step - 1)}
            aria-label={t('Voltar')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-amber-400 transition-all duration-300"
              style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
            />
          </div>
          <span className="shrink-0 text-[11px] font-bold text-slate-400">
            {step + 1}/{TOTAL_STEPS}
          </span>
          <div className="flex shrink-0 gap-1">
            {(['pt-BR', 'en-US'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => pickLang(l)}
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors',
                  lang === l ? 'bg-amber-400 text-black' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                )}
              >
                {l === 'pt-BR' ? 'PT' : 'EN'}
              </button>
            ))}
          </div>
        </div>
      )}

      <main className="flex flex-1 flex-col justify-center px-5 pb-10 pt-6">
        <div
          key={`step-${step}`}
          className={cn(
            'mx-auto w-full max-w-md',
            slideDir === 1 ? 'animate-[slideIn_.3s_ease-out]' : 'animate-[slideInBack_.3s_ease-out]'
          )}
        >
          {step === 0 && (
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex items-center gap-2">
                <Languages className="h-4 w-4 text-slate-400" />
                {(['pt-BR', 'en-US'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    aria-pressed={lang === l}
                    onClick={() => pickLang(l)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-bold transition-all',
                      lang === l
                        ? 'border-transparent bg-amber-400 text-black'
                        : 'border-slate-300 text-slate-500 hover:border-amber-400 dark:border-white/20 dark:text-slate-400'
                    )}
                  >
                    {l === 'pt-BR' ? '🇧🇷 Português' : '🇺🇸 English'}
                  </button>
                ))}
              </div>
              <div className="repfit-logo-pop">
                <Mascote className="h-40 w-40" />
              </div>
              <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                Rep<span className="text-amber-500 dark:text-amber-400">Fit</span>
              </h1>
              <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">{t('seus dados, só seus')}</p>
              <button type="button" onClick={() => go(1)} className={cta}>
                {t('Começar agora')} <ArrowRight className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => void finishWithSample()}
                className="mt-3 text-xs font-semibold text-slate-400 underline underline-offset-2 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {t('Explorar com dados de exemplo')}
              </button>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-center text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {t('O que te trouxe aqui?')}
              </h2>
              <p className="mt-1 text-center text-sm text-slate-400 dark:text-slate-500">
                {t('Vamos personalizar o app pra você')}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {GOALS.map((g) => {
                  const active = goal === g.value;
                  return (
                    <button
                      key={g.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setGoal(g.value);
                        window.setTimeout(() => go(2), 220);
                      }}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-3xl border-2 px-3 py-6 transition-all duration-150 active:scale-[0.97]',
                        active
                          ? 'border-amber-400 bg-amber-400/10 shadow-[0_6px_24px_rgba(251,191,36,0.25)]'
                          : 'border-slate-200 hover:border-amber-300 dark:border-white/15 dark:hover:border-amber-400/50'
                      )}
                    >
                      <span className="text-4xl">{g.emoji}</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">{t(g.label)}</span>
                      <span className="text-[11px] font-semibold text-slate-400">{t(g.desc)}</span>
                      {active && <Check className="h-4 w-4 text-amber-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="text-center">
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {t('Quantas vezes você treina por semana?')}
              </h2>
              <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">{t('Criamos sua meta automaticamente')}</p>
              <div className="mt-8 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setFreq((f) => Math.max(1, f - 1))}
                  aria-label="-"
                  className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-slate-200 text-2xl font-black text-slate-500 transition-all active:scale-95 dark:border-white/15 dark:text-slate-300"
                >
                  −
                </button>
                <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full border-4 border-amber-400 bg-amber-400/10">
                  <span className="text-5xl font-black tabular-nums text-slate-900 dark:text-white">{freq}</span>
                  <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{t('dias')}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFreq((f) => Math.min(7, f + 1))}
                  aria-label="+"
                  className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-slate-200 text-2xl font-black text-slate-500 transition-all active:scale-95 dark:border-white/15 dark:text-slate-300"
                >
                  +
                </button>
              </div>
              <button type="button" onClick={() => go(3)} className={cta}>
                {t('Continuar')} <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-center text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {t('Onde você treina?')}
              </h2>
              <p className="mt-1 text-center text-sm text-slate-400 dark:text-slate-500">
                {t('Deixamos as sugestões certas prontas pra você')}
              </p>
              <div className="mt-6 space-y-3">
                {MODES.map((m) => {
                  const active = mode === m.value;
                  return (
                    <button
                      key={m.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setMode(m.value);
                        window.setTimeout(() => go(4), 220);
                      }}
                      className={cn(
                        'flex w-full items-center gap-4 rounded-3xl border-2 px-5 py-4 text-left transition-all duration-150 active:scale-[0.98]',
                        active
                          ? 'border-amber-400 bg-amber-400/10'
                          : 'border-slate-200 hover:border-amber-300 dark:border-white/15 dark:hover:border-amber-400/50'
                      )}
                    >
                      <span className="text-3xl">{m.emoji}</span>
                      <span className="flex-1">
                        <span className="block text-base font-black text-slate-900 dark:text-white">{t(m.label)}</span>
                        <span className="block text-xs font-semibold text-slate-400">{t(m.desc)}</span>
                      </span>
                      {active && <Check className="h-5 w-5 text-amber-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-center text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {t('Qual seu peso atual?')}
              </h2>
              <div className="mt-2">
                <RulerPicker
                  min={settings.unit === 'lb' ? 70 : 35}
                  max={settings.unit === 'lb' ? 440 : 200}
                  value={Math.round(settings.unit === 'lb' ? weightKg * 2.2046226218 : weightKg)}
                  onChange={(v) => setWeightKg(settings.unit === 'lb' ? v / 2.2046226218 : v)}
                  suffix={settings.unit}
                />
              </div>

              <h2 className="mt-6 text-center text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {t('E sua altura?')}
              </h2>
              <div className="mt-2">
                <RulerPicker min={120} max={220} value={heightCm} onChange={setHeightCm} suffix="cm" />
              </div>

              <button type="button" onClick={() => go(5)} className={cta}>
                {t('Continuar')} <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          )}

          {step === 5 && (
            <div>
              <div className="flex items-end gap-3">
                <Mascote pose="wave" className="h-24 w-24 shrink-0" />
                <h2 className="pb-2 text-2xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">
                  {t('olá meu nome é tuff')} — {t('e você?')}
                </h2>
              </div>

              <div className="mt-6">
                <p className="mb-2 text-center text-sm font-bold text-slate-700 dark:text-slate-300">{t('Qual seu nome?')}</p>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={40}
                  placeholder={t('Como quer ser chamado?')}
                  className="h-14 w-full rounded-2xl border-2 border-transparent bg-amber-400/90 px-4 text-center text-lg font-black text-black placeholder:text-black/50 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="mt-6">
                <p className="mb-2 text-center text-sm font-bold text-slate-700 dark:text-slate-300">{t('Sexo')}</p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: 'masculino' as Sex, label: t('Masculino') },
                    { value: 'feminino' as Sex, label: t('Feminino') },
                    { value: 'outro' as Sex, label: t('Outro') },
                  ]).map((o) => {
                    const active = sex === o.value;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setSex(active ? '' : o.value)}
                        className={cn(
                          'rounded-2xl border-2 py-3 text-sm font-bold transition-all active:scale-[0.97]',
                          active
                            ? 'border-amber-400 bg-amber-400/10 text-amber-600 dark:text-amber-400'
                            : 'border-slate-200 text-slate-500 hover:border-amber-300 dark:border-white/15 dark:text-slate-300'
                        )}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <AvatarPicker value={avatar} onChange={setAvatar} size={72} />
              </div>

              <button type="button" onClick={() => go(6)} className={cta}>
                {t('Continuar')} <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          )}

          {step === 6 && <HoldToFinish onComplete={() => void finish()} />}

          {step > 0 && step < 6 && (
            <button
              type="button"
              onClick={() => go(6)}
              className="mx-auto mt-8 block text-xs font-semibold text-slate-400 underline underline-offset-2 hover:text-slate-600 dark:hover:text-slate-300"
            >
              {t('Pular')}
            </button>
          )}
        </div>
      </main>

      {step === 0 && (
        <p className="pb-5 text-center text-[11px] text-slate-400 dark:text-slate-500">
          {t('Grátis, com anúncios. Assine o Premium para removê-los.')}
        </p>
      )}

      {saving && (
        <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center pb-6">
          <span className="rounded-full bg-slate-900/90 px-4 py-2 text-xs font-bold text-white shadow-lg dark:bg-white/90 dark:text-black">
            {t('Salvando…')}
          </span>
        </div>
      )}
    </div>
  );
}
