// ============================================================================
// Google Identity Services (One Tap) — login rápido no desktop.
// ----------------------------------------------------------------------------
// Aprimoramento OPCIONAL: só ativa quando VITE_GOOGLE_CLIENT_ID está definido
// e o script do Google carrega. Se qualquer coisa falhar (script bloqueado,
// origem não autorizada no Google Cloud, mobile — onde o Google desativa o One
// Tap), a função retorna false e o botão "Entrar com Google" continua
// funcionando normalmente (fallback OAuth).
//
// Segurança: o client_id é PÚBLICO por design (identifica o app no Google). O
// ID token recebido no callback é validado pelo Supabase via signInWithIdToken
// — nenhum segredo passa pelo frontend.
// ============================================================================

/** Google Identity Services global (tipado de forma leve). */
interface GISWindow extends Window {
  google?: {
    accounts?: {
      id: {
        initialize: (config: Record<string, unknown>) => void;
        prompt: (callback?: (notification: unknown) => void) => void;
      };
    };
  };
}

let loadPromise: Promise<boolean> | null = null;

/** Carrega o script do GIS uma única vez. */
export function loadGoogleIdentity(): Promise<boolean> {
  if (loadPromise) return loadPromise;
  loadPromise = new Promise<boolean>((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    const w = window as GISWindow;
    if (w.google?.accounts?.id) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(Boolean((window as GISWindow).google?.accounts?.id));
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
  return loadPromise;
}

/**
 * Exibe o One Tap (seletor de contas rápido) para um client_id do Google.
 * `onCredential` recebe o ID token; `onDismissed` quando o usuário fecha.
 * Retorna true se o prompt foi exibido.
 */
export function renderOneTap(
  clientId: string,
  onCredential: (credential: string) => void,
  onDismissed: () => void
): boolean {
  if (typeof window === 'undefined') return false;
  const g = (window as GISWindow).google?.accounts;
  if (!g?.id) return false;

  g.id.initialize({
    client_id: clientId,
    // 'select_account' → mostra a lista de contas salvas para escolher com
    // um toque, em vez de cair direto na tela de e-mail/senha.
    prompt: 'select_account',
    auto_select: false,
    cancel_on_tap_outside: true,
    callback: (response: { credential?: string }) => {
      if (response.credential) onCredential(response.credential);
      else onDismissed();
    },
  });
  g.id.prompt(() => undefined);
  return true;
}
