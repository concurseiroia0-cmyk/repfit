import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BarChart3, CheckCircle2, QrCode, ShieldCheck, WifiOff, Zap, Languages } from 'lucide-react';
import { saveSettings } from '../services/settingsService';
import { createSampleData } from '../services/sampleData';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { InstallAppButton } from '../components/PwaInstall';
import { ShareAppModal } from '../components/ShareApp';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { Logo } from '../components/Logo';
import { changeLang, currentLang } from '../i18n';
import { cn } from '../utils/misc';

const FEATURES_KEYS = [
  'Registre treinos, séries, cargas e esforço',
  'Evolução com gráficos, recordes e calendário',
  'Medidas corporais com histórico (peso, braço…)',
  'Funciona 100% offline, com fotos no aparelho',
];

export function WelcomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { push } = useToast();
  const pwa = usePwaInstall();
  const [creating, setCreating] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [lang, setLang] = useState(currentLang());

  function pickLang(l: 'pt-BR' | 'en-US') {
    setLang(l);
    void changeLang(l);
  }

  async function start() {
    await saveSettings({ welcomeSeen: true });
    navigate('/');
  }

  async function startWithSample() {
    setCreating(true);
    try {
      const n = await createSampleData();
      await saveSettings({ welcomeSeen: true });
      push(t('{{n}} treinos de exemplo criados.', { n }), 'success');
      navigate('/');
    } catch {
      push(t('Erro ao criar dados de exemplo.'), 'error');
      setCreating(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center">
        {/* Seletor de idioma (primeiro contato — estrangeiro escolhe logo) */}
        <div className="mb-4 flex items-center justify-center gap-2">
          <Languages className="h-4 w-4 text-slate-400" />
          {(['pt-BR', 'en-US'] as const).map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={lang === l}
              onClick={() => pickLang(l)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-bold transition-all duration-150',
                lang === l
                  ? 'border-transparent bg-amber-400 text-black'
                  : 'border-slate-300 text-slate-500 hover:border-amber-400 hover:text-amber-600 dark:border-white/20 dark:text-slate-400'
              )}
            >
              {l === 'pt-BR' ? '🇧🇷 Português' : '🇺🇸 English'}
            </button>
          ))}
        </div>

        <div className="repfit-logo-pop mx-auto h-20 w-20">
          <Logo className="h-full w-full rounded-3xl shadow-[0_0_40px_rgba(251,191,36,0.4)]" />
        </div>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {t('Bem-vindo ao')} <span className="text-amber-500 dark:text-amber-400">RepFit</span> ⚡
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {t('Seu diário de treino e medidas — 100% local, privado e sem precisar de internet.')}
        </p>

        <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left">
          {FEATURES_KEYS.map((key, i) => (
            <li
              key={i}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 dark:border-white/10 dark:bg-[#161616] dark:text-slate-200"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400">
                {i === 0 && <Zap className="h-4 w-4" />}
                {i === 1 && <BarChart3 className="h-4 w-4" />}
                {i === 2 && <CheckCircle2 className="h-4 w-4" />}
                {i === 3 && <WifiOff className="h-4 w-4" />}
              </span>
              {t(key)}
            </li>
          ))}
        </ul>

        <div className="mx-auto mt-6 flex max-w-sm flex-col gap-2">
          <Button size="lg" onClick={() => void start()}>
            {t('Começar agora')}
          </Button>
          <Button variant="secondary" size="lg" onClick={() => void startWithSample()} disabled={creating}>
            {creating ? t('Criando…') : t('Explorar com dados de exemplo')}
          </Button>
        </div>

        <div className="mx-auto mt-4 flex max-w-sm flex-col gap-2 sm:flex-row sm:justify-center">
          {pwa.canInstall && <InstallAppButton size="sm" label={t('Instalar app')} />}
          <Button variant="ghost" size="sm" onClick={() => setShareOpen(true)}>
            <QrCode className="h-4 w-4" /> {t('Instalar no celular / QR code')}
          </Button>
        </div>

        <p className="mx-auto mt-6 flex max-w-sm items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
          <ShieldCheck className="h-4 w-4" />
          {t('Seus dados ficam salvos apenas neste dispositivo. Nada é enviado para a internet.')}
        </p>
        </div>
      </div>

      <ShareAppModal open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}
