import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, Check, CreditCard, Sparkles, Zap, Ban } from 'lucide-react';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { PLANS, checkoutUrlFor, type Plan } from '../services/plans';
import { useSupabaseAuth } from '../services/supabase/useSupabaseAuth';
import { useSubscription } from '../services/supabase/useSubscription';
import { useIsPremium } from '../services/supabase/useIsPremium';
import { getSubscriptionAccessInfo, isOwnerEmail } from '../utils/subscription';
import { OWNER_EMAILS } from '../services/supabase/config';
import { useToast } from '../components/ui/Toast';
import { useLang } from '../i18n/useLang';
import { cn } from '../utils/misc';

export function PlansPage() {
  const navigate = useNavigate();
  const { t } = useLang();
  const auth = useSupabaseAuth();
  const { subscription, loading } = useSubscription(auth.user?.id ?? null);
  const { isPremium } = useIsPremium();
  const { push } = useToast();

  const [pendingPlan, setPendingPlan] = useState<Plan | null>(null);
  const [opening, setOpening] = useState<string | null>(null);

  const email = auth.user?.email ?? null;
  const isOwner = isOwnerEmail(email, OWNER_EMAILS);
  const info = subscription ? getSubscriptionAccessInfo(subscription) : null;
  const hasActivePlan = Boolean(info?.hasAccess && !isOwner);

  async function handleSubscribe(plan: Plan) {
    const url = checkoutUrlFor(plan.id);
    if (!url) {
      setPendingPlan(plan);
      return;
    }
    setOpening(plan.id);
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
      push(t('Abrimos o checkout em uma nova aba.'), 'info');
    } finally {
      setOpening(null);
    }
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto w-full max-w-4xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {t('Voltar')}
        </button>

        <div className="text-center">
          <div className="repfit-logo-pop mx-auto h-16 w-16">
            <Logo className="h-full w-full rounded-3xl shadow-[0_0_40px_rgba(251,191,36,0.4)]" />
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t('RepFit')} <span className="text-amber-500 dark:text-amber-400">{t('Premium')}</span>
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-slate-700 dark:text-slate-200">
            {t('Treine sem anúncios')}
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
            {t('App 100% liberado para todos. Quem assina remove os anúncios e apoia o projeto.')}
          </p>
        </div>

        {/* Status atual da conta */}
        <div className="mt-6">
          {!auth.user ? (
            <Card>
              <div className="flex flex-col items-center gap-3 px-5 py-4 text-center sm:flex-row sm:text-left">
                <CreditCard className="h-5 w-5 shrink-0 text-amber-500" />
                <p className="flex-1 text-sm text-slate-600 dark:text-slate-300">
                  {t('Entre com o Google para assinar e sincronizar seus treinos na nuvem.')}
                </p>
                <Button size="sm" onClick={() => navigate('/login')}>
                  {t('Entrar com Google')}
                </Button>
              </div>
            </Card>
          ) : loading ? (
            <Card>
              <p className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">{t('Verificando…')}</p>
            </Card>
          ) : isOwner ? (
            <Card>
              <div className="flex items-center gap-3 px-5 py-4">
                <BadgeCheck className="h-6 w-6 shrink-0 text-emerald-500" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{t('Acesso vitalício do dono')}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('Você tem acesso total à plataforma sem assinatura.')}
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="flex items-center gap-3 px-5 py-4">
                {isPremium ? (
                  <BadgeCheck className="h-6 w-6 shrink-0 text-emerald-500" />
                ) : (
                  <Ban className="h-6 w-6 shrink-0 text-slate-400" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {isPremium
                      ? t('Premium ativo — sem anúncios')
                      : t('Você está usando o RepFit de graça, com anúncios.')}
                  </p>
                  <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {isPremium
                      ? (info?.lines.slice(1).join(' · ') || t('Obrigado por apoiar o RepFit!'))
                      : t('Assine o Premium e nunca mais veja uma vinheta entre os treinos.')}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Cards de planos */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'relative flex flex-col rounded-3xl border bg-white p-6 dark:bg-[#161616]',
                plan.popular
                  ? 'border-amber-400 shadow-[0_8px_40px_rgba(251,191,36,0.25)] dark:border-amber-400/70'
                  : 'border-slate-200 dark:border-white/10'
              )}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-black">
                  {t('Mais popular')}
                </span>
              )}
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">{plan.name}</h2>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{plan.tagline}</p>

              <div className="mt-4">
                <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{plan.price}</span>
                <span className="text-sm font-semibold text-slate-400">{plan.period}</span>
                {plan.monthlyEquivalent && (
                  <p className="mt-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {t('Equivale a {{valor}}', { valor: plan.monthlyEquivalent })}
                  </p>
                )}
              </div>

              <ul className="mt-4 flex-1 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                className="mt-5 w-full"
                variant={plan.popular ? 'primary' : 'secondary'}
                onClick={() => void handleSubscribe(plan)}
                disabled={opening === plan.id || hasActivePlan}
              >
                {hasActivePlan ? (
                  <>
                    <BadgeCheck className="h-4 w-4" /> {t('Plano ativo')}
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" /> {t('Assinar agora')}
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400 dark:text-slate-500">
          <Zap className="h-3.5 w-3.5" />
          {t('Pagamento seguro via Kirvano / GGCheckout · O acesso é liberado automaticamente pelo webhook após a aprovação.')}
        </p>
      </div>

      {/* Checkout ainda não configurado */}
      <Modal
        open={pendingPlan != null}
        onClose={() => setPendingPlan(null)}
        title={t('Checkout em configuração')}
        size="sm"
        footer={
          <Button variant="secondary" onClick={() => setPendingPlan(null)}>
            {t('Entendi')}
          </Button>
        }
      >
        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <p>
            {t('O checkout do {{plano}} ainda não foi conectado à plataforma de pagamento. Assim que a URL do checkout for configurada, este botão direciona direto para o pagamento.', { plano: pendingPlan?.name ?? '' })}
          </p>
          <p className="rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 dark:bg-amber-400/10 dark:text-amber-300">
            {t('Boas notícias: toda a parte de recebimento já está pronta e validada — quando o pagamento for aprovado, o webhook libera seu acesso automaticamente, sem precisar de nenhuma ação manual.')}
          </p>
        </div>
      </Modal>
    </div>
  );
}
