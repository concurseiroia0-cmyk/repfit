// ============================================================================
// Planos do RepFit (tela /planos e botões de assinatura).
// ----------------------------------------------------------------------------
// Os preços exibidos aqui são os preços de tabela. A cobrança acontece na
// plataforma de pagamento (Kirvano/GGCheckout) — o acesso é liberado pelo
// WEBHOOK, nunca manualmente.
//
// URL de checkout por plano (variáveis de ambiente do Vite):
//   VITE_CHECKOUT_URL_MENSAL=<url de checkout do plano mensal>
//   VITE_CHECKOUT_URL_TRIMESTRAL=<url...>
//   VITE_CHECKOUT_URL_ANUAL=<url...>
//   VITE_CHECKOUT_URL=<fallback único para todos os planos>
// Sem URL configurada, o botão "Assinar" explica que o checkout será conectado
// (a lógica de liberação por webhook já está pronta e validada).
// ============================================================================

export interface Plan {
  id: string;
  name: string;
  tagline: string;
  price: string;
  period: string;
  /** Preço mensal equivalente (para planos com desconto por período). */
  monthlyEquivalent?: string;
  features: string[];
  popular?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: 'mensal',
    name: 'RepFit Mensal',
    tagline: 'Perfeito para começar',
    price: 'R$ 49,90',
    period: '/mês',
    features: [
      'Treinos ilimitados',
      'Sincronização na nuvem (backup seguro)',
      'Histórico e recordes pessoais',
      'Medidas corporais e evolução',
      'Gráficos de progressão',
    ],
  },
  {
    id: 'trimestral',
    name: 'RepFit Trimestral',
    tagline: 'Economize 13%',
    price: 'R$ 129,90',
    period: '/3 meses',
    monthlyEquivalent: 'R$ 43,30/mês',
    features: [
      'Tudo do plano mensal',
      'Equivale a 3 meses por menos',
      'Renovação automática a cada 3 meses',
      'Cancele quando quiser',
    ],
  },
  {
    id: 'anual',
    name: 'RepFit Pro',
    tagline: 'Melhor custo-benefício',
    price: 'R$ 399,90',
    period: '/ano',
    monthlyEquivalent: 'R$ 33,32/mês',
    popular: true,
    features: [
      'Tudo dos outros planos',
      'Economize 33% no ano',
      'Prioridade em novos recursos',
      'Suporte prioritário',
    ],
  },
];

/**
 * URL de checkout do plano (env) ou undefined se ainda não configurada.
 * Prioriza a URL específica do plano; sem ela, usa o fallback único.
 */
export function checkoutUrlFor(planId: string): string | undefined {
  const key = `VITE_CHECKOUT_URL_${planId.toUpperCase()}`;
  const specific = (import.meta.env[key] as string | undefined)?.trim();
  if (specific) return specific;
  const fallback = (import.meta.env.VITE_CHECKOUT_URL as string | undefined)?.trim();
  return fallback || undefined;
}
