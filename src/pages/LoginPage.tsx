import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Cloud, Loader2, ShieldCheck, WifiOff } from 'lucide-react';
import { useSupabaseAuth } from '../services/supabase/useSupabaseAuth';
import { signInWithGoogleIdToken } from '../services/supabase/client';
import { loadGoogleIdentity, renderOneTap } from '../services/supabase/oneTap';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/Logo';

// Client ID do Google para o One Tap (opcional — público por design).
// Se não estiver definido, o botão "Entrar com Google" funciona normalmente.
const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? '';

/**
 * Detecta navegador EMBUTIDO (webview do WhatsApp/Instagram/Facebook etc.).
 * Nesses ambientes o Google costuma bloquear/limitar o login OAuth — a
 * orientação é abrir o link no Chrome/Safari, onde o seletor de contas
 * aparece com 1 toque.
 */
function detectInAppBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || '';
  const social = /FBAN|FBAV|Instagram|Line|KakaoTalk|MicroMessenger|DingTalk|Snapchat/i.test(ua);
  const androidWebview = /(; wv\b|wv=)/i.test(ua);
  const iosWebview =
    typeof (window as unknown as { webkit?: unknown }).webkit !== 'undefined' &&
    !/Safari/i.test(ua);
  return social || androidWebview || iosWebview;
}

function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const { user, loading, configured, signIn, signOut } = useSupabaseAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inAppBrowser] = useState(detectInAppBrowser);
  const oneTapAttempted = useRef(false);

  // Login concluído (One Tap/redirect) → vai para o app. A sessão fica SALVA
  // no dispositivo (localStorage + auto-refresh): na próxima visita não pede de novo.
  useEffect(() => {
    if (user && !loading) navigate('/', { replace: true });
  }, [user, loading, navigate]);

  // One Tap (desktop): com contas Google salvas, mostra o seletor rápido.
  // Silencioso se indisponível (mobile/bloqueado/sem client ID) — o botão cobre.
  useEffect(() => {
    if (user || loading || !configured || !GOOGLE_CLIENT_ID || oneTapAttempted.current) return;
    oneTapAttempted.current = true;
    let active = true;

    void (async () => {
      const ok = await loadGoogleIdentity();
      if (!ok || !active) return;
      renderOneTap(
        GOOGLE_CLIENT_ID,
        async (credential) => {
          if (!active) return;
          setBusy(true);
          setError(null);
          const { error: err } = await signInWithGoogleIdToken(credential);
          if (active) {
            setBusy(false);
            if (err) setError(err.message);
          }
        },
        () => {
          // Usuário fechou o One Tap — nada a fazer (o botão continua lá).
        }
      );
    })();

    return () => {
      active = false;
    };
  }, [user, loading, configured]);

  async function handleSignIn() {
    setBusy(true);
    setError(null);
    const { error: err } = await signIn();
    setBusy(false);
    if (err) setError(err.message);
  }

  async function handleSignOut() {
    setBusy(true);
    const { error: err } = await signOut();
    setBusy(false);
    if (err) setError(err.message);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar para o app
          </button>

          <div className="repfit-logo-pop mx-auto h-20 w-20">
            <Logo className="h-full w-full rounded-3xl shadow-[0_0_40px_rgba(251,191,36,0.4)]" />
          </div>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Entre no <span className="text-amber-500 dark:text-amber-400">RepFit</span>
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Faça login com o Google para <b>sincronizar seus treinos na nuvem</b> e acessá-los de
            qualquer dispositivo.
          </p>

          {inAppBrowser && (
            <div className="mb-4 mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4 text-left text-sm text-sky-800 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-300">
              <p className="font-bold">Você está em um navegador embutido</p>
              <p className="mt-1 text-xs leading-relaxed">
                Apps como WhatsApp e Instagram podem bloquear o login do Google. Toque nos{' '}
                <b>⋮</b> (ou <b>compartilhar</b>) e escolha <b>Abrir no Chrome</b> — aí o Google
                mostra o seletor de contas e você entra com 1 toque.
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2">
            {!configured ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300">
                <p className="font-bold">Supabase ainda não configurado</p>
                <p className="mt-1 text-xs leading-relaxed">
                  Copie <code>.env.example</code> para <code>.env</code> e preencha{' '}
                  <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> (Settings →
                  API → anon public) e rode <code>npm run dev</code> de novo.
                </p>
              </div>
            ) : loading ? (
              <Button size="lg" disabled>
                <Loader2 className="h-5 w-5 animate-spin" /> Verificando sessão…
              </Button>
            ) : user ? (
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#161616]">
                <div className="flex items-center gap-3">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt=""
                      className="h-11 w-11 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-lg font-bold text-amber-700 dark:bg-amber-400/15 dark:text-amber-400">
                      {(user.fullName ?? user.email ?? '?').slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0 text-left">
                    <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                      {user.fullName ?? 'Usuário'}
                    </p>
                    <p className="truncate text-xs text-slate-400">{user.email}</p>
                  </div>
                  <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-emerald-500" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Logado. Seus treinos locais são enviados para a nuvem automaticamente quando houver
                  internet.
                </p>
                <Button variant="secondary" size="sm" onClick={() => void handleSignOut()} disabled={busy}>
                  Sair da conta
                </Button>
              </div>
            ) : (
              <>
                <Button size="lg" onClick={() => void handleSignIn()} disabled={busy}>
                  {busy ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" /> Abrindo Google…
                    </>
                  ) : (
                    <>
                      <GoogleG className="h-5 w-5" /> Entrar com Google
                    </>
                  )}
                </Button>
                {error && <p className="text-xs font-medium text-rose-500">{error}</p>}
                <p className="text-xs text-slate-400">
                  Sem conta? O Google cria o seu perfil automaticamente no primeiro acesso.
                </p>
                <p className="text-xs leading-relaxed text-slate-400 dark:text-slate-500">
                  No celular, o Google só mostra o seletor de contas quando há uma conta Google
                  salva no navegador. Se pedir e-mail/senha, é o próprio Google exigindo — entre
                  com uma conta que já está salva no celular e o próximo acesso volta a ser 1 toque.
                </p>
              </>
            )}
          </div>

          <p className="mx-auto mt-6 max-w-sm text-xs leading-relaxed text-slate-400 dark:text-slate-500">
            Você entra uma única vez com o Google — o login fica <b>salvo neste dispositivo</b> e não
            será pedido de novo nas próximas visitas.
          </p>

          <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left">
            <li className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 dark:border-white/10 dark:bg-[#161616] dark:text-slate-200">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400">
                <Cloud className="h-4 w-4" />
              </span>
              Treinos, medidas e fotos sincronizados na nuvem
            </li>
            <li className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 dark:border-white/10 dark:bg-[#161616] dark:text-slate-200">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400">
                <WifiOff className="h-4 w-4" />
              </span>
              Continua funcionando 100% offline
            </li>
            <li className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 dark:border-white/10 dark:bg-[#161616] dark:text-slate-200">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400">
                <ShieldCheck className="h-4 w-4" />
              </span>
              Cada usuário só vê os próprios dados (RLS no banco)
            </li>
          </ul>


        </div>
      </div>
    </div>
  );
}
