import { useState } from 'react';
import { Check, Link2, QrCode as QrIcon, Share2, Smartphone, TriangleAlert } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { QrCode } from './QrCode';
import { useToast } from './ui/Toast';

/** Endereço atual do app (sem hash/query) para compartilhar. */
export function getAppUrl(): string {
  try {
    const url = new URL(window.location.href);
    url.hash = '';
    url.search = '';
    return url.toString();
  } catch {
    return window.location.href;
  }
}

function isLocalAddress(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '::1';
  } catch {
    return false;
  }
}

/**
 * Modal "Instalar no celular": mostra o QR code do app, com botão de
 * compartilhar (Web Share API) e copiar link (fallback).
 */
export function ShareAppModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { push } = useToast();
  const [copied, setCopied] = useState(false);
  const url = getAppUrl();
  const local = isLocalAddress(url);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      push('Link copiado!', 'success');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      push('Não foi possível copiar o link automaticamente.', 'error');
    }
  }

  async function handleShare() {
    const nav = navigator as Navigator & { share?: (data: { title: string; text: string; url: string }) => Promise<void> };
    if (typeof nav.share === 'function') {
      try {
        await nav.share({ title: 'RepFit', text: 'Registre e acompanhe seus treinos — 100% offline e privado.', url });
        return;
      } catch {
        // usuário cancelou ou não suportado: cai no fallback de copiar
      }
    }
    await copy();
  }

  return (
    <Modal open={open} onClose={onClose} title="Instalar no celular" size="sm">
      <div className="space-y-4 text-sm">
        <p className="text-slate-600 dark:text-slate-300">
          Abra a câmera do celular e aponte para o <b>QR code</b> para abrir o RepFit, ou compartilhe o link com
          alguém.
        </p>

        <div className="flex justify-center rounded-3xl border border-slate-200 bg-white p-4 dark:border-white/15">
          <QrCode value={url} size={190} />
        </div>

        <div className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-500 dark:text-slate-400">
          <Smartphone className="h-4 w-4 shrink-0" />
          <span className="break-all">{url}</span>
        </div>

        {local && (
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-300/60 bg-amber-50 p-3.5 text-xs leading-relaxed text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              <b>Atenção:</b> este endereço é <b>local</b> (funciona só neste computador). Para abrir no celular,
              publique o app em um endereço acessível pela internet ou acesse pelo IP da sua rede Wi-Fi.
            </span>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={() => void handleShare()} full className="sm:flex-1">
            <Share2 className="h-4 w-4" /> Compartilhar link
          </Button>
          <Button variant="secondary" onClick={() => void copy()} full className="sm:flex-1">
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Link2 className="h-4 w-4" />}
            {copied ? 'Copiado!' : 'Copiar link'}
          </Button>
        </div>

        <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          <QrIcon className="mt-0.5 h-4 w-4 shrink-0" />
          Depois de abrir no celular, use “Adicionar à Tela de Início” (iOS) ou instalar (Android) para ter o app
          instalado. Os dados ficam salvos apenas em cada dispositivo.
        </p>
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-3.5 text-xs leading-relaxed text-sky-800 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-300">
          <p className="font-bold">Quer ver seus treinos no celular? Conecte sua conta</p>
          <p className="mt-1">
            O app instalado começa vazio. Para trazer o histórico do navegador: no aparelho onde sua conta já
            está logada, abra <b>Configurações → Conectar aplicativo</b>, pegue o código de 6 dígitos e digite-o
            no celular em <b>“Já tenho uma conta”</b> — seus treinos e medidas sincronizam pela nuvem
            automaticamente.
          </p>
        </div>
      </div>
    </Modal>
  );
}
