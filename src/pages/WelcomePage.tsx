import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, CheckCircle2, QrCode, ShieldCheck, WifiOff, Zap } from 'lucide-react';
import { saveSettings } from '../services/settingsService';
import { createSampleData } from '../services/sampleData';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { InstallAppButton } from '../components/PwaInstall';
import { ShareAppModal } from '../components/ShareApp';
import { usePwaInstall } from '../hooks/usePwaInstall';

const FEATURES = [
  { icon: <Zap className="h-4 w-4" />, text: 'Registre treinos, séries, cargas e esforço' },
  { icon: <BarChart3 className="h-4 w-4" />, text: 'Evolução com gráficos, recordes e calendário' },
  { icon: <CheckCircle2 className="h-4 w-4" />, text: 'Medidas corporais com histórico (peso, braço…)' },
  { icon: <WifiOff className="h-4 w-4" />, text: 'Funciona 100% offline, com fotos no aparelho' },
];

export function WelcomePage() {
  const navigate = useNavigate();
  const { push } = useToast();
  const pwa = usePwaInstall();
  const [creating, setCreating] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  async function start() {
    await saveSettings({ welcomeSeen: true });
    navigate('/');
  }

  async function startWithSample() {
    setCreating(true);
    try {
      const n = await createSampleData();
      await saveSettings({ welcomeSeen: true });
      push(`${n} treinos de exemplo criados.`, 'success');
      navigate('/');
    } catch {
      push('Erro ao criar dados de exemplo.', 'error');
      setCreating(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md text-center">
        <img
          src={`${import.meta.env.BASE_URL}icon-192.png`}
          alt="Logo do RepFit"
          className="mx-auto h-20 w-20 rounded-3xl shadow-[0_0_40px_rgba(251,191,36,0.4)]"
        />
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Bem-vindo ao <span className="text-amber-500 dark:text-amber-400">RepFit</span> ⚡
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Seu diário de treino e medidas — 100% local, privado e sem precisar de internet.
        </p>

        <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left">
          {FEATURES.map((f, i) => (
            <li
              key={i}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 dark:border-white/10 dark:bg-[#161616] dark:text-slate-200"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400">
                {f.icon}
              </span>
              {f.text}
            </li>
          ))}
        </ul>

        <div className="mx-auto mt-6 flex max-w-sm flex-col gap-2">
          <Button size="lg" onClick={() => void start()}>
            Começar agora
          </Button>
          <Button variant="secondary" size="lg" onClick={() => void startWithSample()} disabled={creating}>
            {creating ? 'Criando…' : 'Explorar com dados de exemplo'}
          </Button>
        </div>

        <div className="mx-auto mt-4 flex max-w-sm flex-col gap-2 sm:flex-row sm:justify-center">
          {pwa.canInstall && <InstallAppButton size="sm" label="Instalar app" />}
          <Button variant="ghost" size="sm" onClick={() => setShareOpen(true)}>
            <QrCode className="h-4 w-4" /> Instalar no celular / QR code
          </Button>
        </div>

        <p className="mx-auto mt-6 flex max-w-sm items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
          <ShieldCheck className="h-4 w-4" />
          Seus dados ficam salvos apenas neste dispositivo. Nada é enviado para a internet.
        </p>
      </div>

      <ShareAppModal open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}
