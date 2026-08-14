// ============================================================================
// Lógica de assinatura do RepFit.
// ----------------------------------------------------------------------------
// REGRA CENTRAL: NUNCA salvar "dias restantes" fixos. O acesso é calculado
// dinamicamente comparando o status da assinatura com current_period_end
// (fim do período já pago) contra a data atual.
//
//   * current_period_end NULL            → vitalício (nunca expira) — usado
//     para o acesso total do dono sem pagamento.
//   * cancel_at_period_end = true        → cancelada, mas válida até o fim do
//     período já pago (não perde o acesso na hora).
//   * status = 'expired'                 → sem acesso, sempre.
//   * status desconhecido                → sem acesso (nega por padrão).
//
// Estas funções são PURAS (sem I/O) — fáceis de testar e reutilizáveis tanto
// no cliente (exibir status) quanto em edge functions/worker futuros.
// ============================================================================

export type SubscriptionStatus =
  | 'active'
  | 'trial'
  | 'past_due'
  | 'canceled'
  | 'expired'
  | 'pending'
  | 'lifetime';

/** Apenas os campos que a lógica de acesso consome (compatível com a Row do Supabase). */
export interface SubscriptionLike {
  status: string | null;
  current_period_end: string | null;
  cancel_at_period_end?: boolean | null;
  current_period_start?: string | null;
  plan_name?: string | null;
}

export interface SubscriptionAccessInfo {
  /** O usuário pode usar a plataforma agora? */
  hasAccess: boolean;
  /** Status EFETIVO (leva em conta cancel_at_period_end e expiração). */
  status: SubscriptionStatus;
  /** Dias até o fim do período. null = vitalício. 0 = já expirou. */
  daysRemaining: number | null;
  /** Fim do período pago (Date). null = vitalício. */
  endDate: Date | null;
  /** Será renovada automaticamente? (false para cancelada/vitalícia/expirada) */
  autoRenews: boolean;
  /** Linhas prontas para exibir na UI (pt-BR). */
  lines: string[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

function normalizeStatus(status: string | null | undefined): SubscriptionStatus {
  switch (status) {
    case 'active':
    case 'trial':
    case 'past_due':
    case 'canceled':
    case 'expired':
    case 'pending':
    case 'lifetime':
      return status;
    default:
      // Status desconhecido → nega por padrão (safe default).
      return 'expired';
  }
}

function toMs(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

/**
 * Dias restantes até o fim do período, calculados DINAMICAMENTE.
 * Ex.: end = 2026-09-15 e hoje = 2026-08-14 → 32.
 * Retorna null quando não há fim (vitalício) e 0 quando já passou.
 */
export function getDaysRemaining(
  currentPeriodEnd: string | null | undefined,
  now: Date = new Date()
): number | null {
  const end = toMs(currentPeriodEnd);
  if (end == null) return null;
  return Math.max(0, Math.ceil((end - now.getTime()) / DAY_MS));
}

/**
 * Status EFETIVO para exibição:
 *  - 'lifetime' nunca expira;
 *  - cancel_at_period_end transforma active/past_due/trial/pending em
 *    'canceled' (válido até o fim do período já pago);
 *  - qualquer período já encerrado vira 'expired'.
 */
export function getEffectiveStatus(
  sub: SubscriptionLike | null | undefined,
  now: Date = new Date()
): SubscriptionStatus {
  if (!sub) return 'expired';
  const raw = normalizeStatus(sub.status);

  if (raw === 'lifetime') return 'lifetime';

  const canceledByFlag =
    sub.cancel_at_period_end &&
    (raw === 'active' || raw === 'past_due' || raw === 'trial' || raw === 'pending');
  const effective = canceledByFlag ? 'canceled' : raw;

  if (effective !== 'expired') {
    const end = toMs(sub.current_period_end);
    if (end != null && end <= now.getTime()) {
      return 'expired';
    }
  }
  return effective;
}

/**
 * O usuário TEM acesso agora?
 *
 * Fonte de verdade: status + current_period_end (NUNCA um número fixo de dias
 * e NUNCA um campo manual 'is_premium').
 *
 *  - lifetime                                   → acesso total;
 *  - active / trial / past_due                  → acesso enquanto o período
 *    (current_period_end) não tiver passado; sem current_period_end e ativo,
 *    concede (dados legados/planos sem fim);
 *  - canceled                                   → acesso SOMENTE enquanto o
 *    período já pago valer (regra crítica: cancelou hoje, continua com acesso
 *    até current_period_end);
 *  - pending                                    → acesso somente se existir
 *    outro período válido (ex.: renovação em processamento com período atual
 *    ainda ativo);
 *  - expired / desconhecido                     → sem acesso.
 */
export function hasSubscriptionAccess(
  sub: SubscriptionLike | null | undefined,
  now: Date = new Date()
): boolean {
  const status = getEffectiveStatus(sub, now);
  if (status === 'lifetime') return true;
  if (status === 'expired') return false;

  if (status === 'canceled' || status === 'pending') {
    const end = toMs(sub?.current_period_end);
    return end != null && end > now.getTime();
  }

  // active | trial | past_due
  const end = toMs(sub?.current_period_end);
  return end == null || end > now.getTime();
}

/** E-mail do dono (lista de permissão) → acesso total, sem precisar pagar. */
export function isOwnerEmail(
  email: string | null | undefined,
  ownerEmails: readonly string[] = []
): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return ownerEmails.some((o) => o.trim().toLowerCase() === normalized);
}

/** Ponto único de entrada do app: dono OU assinatura válida. */
export function hasPlatformAccess(
  args: {
    subscription?: SubscriptionLike | null;
    email?: string | null;
    ownerEmails?: readonly string[];
    now?: Date;
  }
): boolean {
  const { subscription, email, ownerEmails, now } = args;
  if (isOwnerEmail(email, ownerEmails)) return true;
  return hasSubscriptionAccess(subscription, now);
}

const fmtDate = (d: Date): string =>
  d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });

/**
 * Informações completas de acesso para a UI, com as mensagens prontas:
 *  "Plano ativo · Próxima renovação: 15/09/2026 · Faltam 32 dias para a renovação."
 *  "Assinatura cancelada · Acesso disponível até 15/09/2026 · Faltam 32 dias..."
 */
export function getSubscriptionAccessInfo(
  sub: SubscriptionLike | null | undefined,
  now: Date = new Date()
): SubscriptionAccessInfo {
  const status = getEffectiveStatus(sub, now);
  const endDate = toMs(sub?.current_period_end);
  const days = endDate == null ? null : getDaysRemaining(sub?.current_period_end, now);
  const end = endDate == null ? null : new Date(endDate);

  const autoRenews =
    status === 'active' && !sub?.cancel_at_period_end && end != null;

  let lines: string[];
  switch (status) {
    case 'lifetime':
      lines = ['Acesso vitalício', 'Você tem acesso total à plataforma.'];
      break;
    case 'active':
      lines = autoRenews
        ? [
            'Plano ativo',
            `Próxima renovação: ${end ? fmtDate(end) : '—'}`,
            days != null ? `Faltam ${days} ${days === 1 ? 'dia' : 'dias'} para a renovação.` : '',
          ]
        : [
            'Plano ativo',
            `Renovação em ${end ? fmtDate(end) : '—'}`,
            days != null ? `Faltam ${days} ${days === 1 ? 'dia' : 'dias'}.` : '',
          ];
      break;
    case 'canceled':
      lines =
        end != null && days != null && days > 0
          ? [
              'Assinatura cancelada',
              `Acesso disponível até ${fmtDate(end)}`,
              `Faltam ${days} ${days === 1 ? 'dia' : 'dias'} para o encerramento do acesso.`,
            ]
          : ['Assinatura expirada', 'Renove para continuar treinando.'];
      break;
    case 'trial':
      lines =
        end != null
          ? [
              'Período de teste',
              `Termina em ${fmtDate(end)}`,
              days != null ? `Faltam ${days} ${days === 1 ? 'dia' : 'dias'}.` : '',
            ]
          : ['Período de teste', 'Experimente a plataforma gratuitamente.'];
      break;
    case 'pending':
      lines = ['Pagamento pendente', 'Aguardando confirmação do pagamento.'];
      break;
    case 'past_due':
      lines =
        end != null && days != null && days > 0
          ? [
              'Pagamento atrasado',
              `Acesso mantido até ${fmtDate(end)}`,
              `Faltam ${days} ${days === 1 ? 'dia' : 'dias'}.` ,
            ]
          : ['Assinatura expirada', 'Regularize o pagamento para continuar.'];
      break;
    default:
      lines = ['Assinatura expirada', 'Renove para continuar treinando.'];
  }

  return {
    hasAccess: hasSubscriptionAccess(sub, now),
    status,
    daysRemaining: days,
    endDate: end,
    autoRenews,
    lines: lines.filter((l) => l !== ''),
  };
}
