import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { getSupabase } from '../services/supabase/client';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/Logo';

/**
 * Página de retorno do Google OAuth (/auth/callback).
 *
 * Cobre os dois fluxos suportados pelo supabase-js:
 *  - Implícito (padrão): o Google volta com `#access_token=...` no fragmento —
 *    `detectSessionInUrl` processa sozinho ao inicializar o cliente; aqui só
 *    aguardamos a sessão existir.
 *  - PKCE (`?code=...`): trocamos o código pela sessão com exchangeCodeForSession.
 *
 * Depois de autenticado, limpa a URL (remove tokens do histórico) e navega para
 * o app. Nunca redireciona de volta para esta página → sem loop.
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<'processing' | 'error'>('processing');
  const done = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      const sb = getSupabase();
      if (!sb) {
        if (!cancelled) setState('error');
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const oauthError = params.get('error');
      const hasFragmentToken = /(access_token|id_token|code)=/.test(window.location.hash);

      if (oauthError) {
        // Usuário cancelou/recusou no Google (ex.: access_denied) — volta pro login.
        if (!cancelled) navigate('/login', { replace: true });
        return;
      }

      if (code) {
        // Fluxo PKCE: troca o código pelo access token/sessão.
        const { error } = await sb.auth.exchangeCodeForSession(code);
        if (error) {
          if (!cancelled) setState('error');
          return;
        }
      }

      // Visita direta à página (sem callback em andamento): não há o que
      // processar — segue para o app (o gate redireciona ao /login se preciso).
      if (!code && !hasFragmentToken) {
        if (!cancelled && !done.current) {
          done.current = true;
          navigate('/', { replace: true });
        }
        return;
      }

      // Fluxo implícito: o fragmento (#access_token) já foi processado pelo
      // cliente ao inicializar; aguarda a sessão ficar disponível.
      for (let i = 0; i < 20; i++) {
        const { data } = await sb.auth.getSession();
        if (data.session) break;
        await new Promise((r) => setTimeout(r, 150));
      }

      // Limpa a URL (remove qualquer token/código do histórico) antes de seguir.
      window.history.replaceState({}, '', window.location.pathname);

      if (!cancelled && !done.current) {
        done.current = true;
        navigate('/', { replace: true });
      }
    }

    void finish();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (state === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="repfit-logo-pop mx-auto h-16 w-16">
            <Logo className="h-full w-full rounded-2xl" />
          </div>
          <h1 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">
            Não foi possível completar o login
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            A autenticação do Google falhou ou expirou. Tente entrar de novo — se o problema
            persistir, recarregue a página.
          </p>
          <Button className="mt-5" onClick={() => navigate('/login', { replace: true })}>
            Voltar para o login
          </Button>
          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-amber-500">
            <AlertTriangle className="h-3.5 w-3.5" /> Verificação do Google não concluída
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="repfit-logo-pop mx-auto h-16 w-16">
          <Logo className="h-full w-full rounded-2xl" />
        </div>
        <h1 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">
          Entrando no RepFit…
        </h1>
        <p className="mt-2 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Confirmando sua conta com o Google
        </p>
      </div>
    </div>
  );
}
