// ============================================================================
// PaywallPage — no MODELO GRATUITO não existe mais bloqueio por assinatura.
// A rota /paywall foi removida; se alguém cair aqui (link antigo), volta
// direto para o app. A assinatura agora serve apenas para REMOVER ANÚNCIOS
// (ver /planos e useIsPremium).
// ============================================================================

import { Navigate } from 'react-router-dom';

export function PaywallPage() {
  return <Navigate to="/" replace />;
}
