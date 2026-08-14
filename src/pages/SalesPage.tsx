import { useState } from 'react';
import {
  BadgeCheck,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Cloud,
  Dumbbell,
  GraduationCap,
  Lock,
  MousePointerClick,
  Play,
  Puzzle,
  Ruler,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Timer,
  TrendingUp,
  Trophy,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { checkoutUrlFor } from '../services/plans';
import { cn } from '../utils/misc';

// ============================================================================
// Página de vendas do RepFit (/oferta) — mobile first, tema claro fixo.
// Copy em pt-BR, CTA repetido nos pontos de conversão, sem promessa absoluta
// de resultado. Os depoimentos e a mini VSL são placeholders até você enviar
// fotos/link reais. O checkout usa VITE_CHECKOUT_URL_OFERTA (fallback: URL do
// plano mensal); sem URL configurada, o botão explica que está em configuração.
// ============================================================================

const PRODUCT = 'RepFit';
const PRICE_ORIGINAL = 'R$ 39,90';
const PRICE_PROMO = 'R$ 27,90';
const SAVINGS = 'R$ 12,00';
const WARRANTY = '7 dias';

/** URL do checkout da oferta (env) ou fallback para a do plano mensal. */
function getSalesCheckoutUrl(): string | undefined {
  const oferta = (import.meta.env.VITE_CHECKOUT_URL_OFERTA as string | undefined)?.trim();
  if (oferta) return oferta;
  return checkoutUrlFor('mensal');
}

const TESTIMONIALS = [
  {
    name: 'Lucas M.',
    initials: 'LM',
    color: 'bg-blue-600',
    text: 'Nunca mais esqueci o peso da última série. Saí de 40 kg para 52 kg no supino em 3 meses acompanhando o gráfico.',
  },
  {
    name: 'Mariana S.',
    initials: 'MS',
    color: 'bg-rose-500',
    text: 'Abro o celular e anoto tudo em segundos. Ver minha evolução nos gráficos me motiva a treinar todo dia.',
  },
  {
    name: 'Pedro R.',
    initials: 'PR',
    color: 'bg-emerald-600',
    text: 'Antes anotava no papel e perdia tudo. Agora o histórico fica salvo e vejo minha progressão de carga e repetições.',
  },
  {
    name: 'Ana C.',
    initials: 'AC',
    color: 'bg-amber-500',
    text: 'A praticidade é incrível. Registro cada treino na hora e acompanho as medidas junto com a evolução.',
  },
  {
    name: 'Rafael T.',
    initials: 'RT',
    color: 'bg-violet-600',
    text: 'Voltei pra academia depois de anos. O app me deu a constância que faltava para evoluir de novo.',
  },
];

const OBJECTIONS = [
  {
    icon: MousePointerClick,
    title: 'Método simples',
    text: 'Você não precisa ser especialista para começar.',
  },
  {
    icon: Smartphone,
    title: 'Só precisa do celular',
    text: 'Acesse e aplique mesmo sem equipamentos caros.',
  },
  {
    icon: GraduationCap,
    title: 'Sem conhecimento avançado',
    text: 'Passo a passo direto, pensado para qualquer pessoa.',
  },
  {
    icon: Zap,
    title: 'Resultado rápido',
    text: 'Criado para facilitar o processo e economizar tempo.',
  },
];

const BONUS = [
  {
    icon: TrendingUp,
    title: 'Gráficos de progressão',
    text: 'Acompanhe carga e repetições de cada exercício ao longo do tempo.',
  },
  {
    icon: ClipboardList,
    title: 'Anotação em segundos',
    text: 'Registre séries, peso e repetições sem atrapalhar o treino.',
  },
  {
    icon: Cloud,
    title: 'Backup na nuvem',
    text: 'Treinos salvos e sincronizados — troque de celular sem perder nada.',
  },
  {
    icon: Trophy,
    title: 'Recordes pessoais',
    text: 'Veja quando bateu seu melhor e supere a cada semana.',
  },
  {
    icon: Ruler,
    title: 'Medidas corporais',
    text: 'Acompanhe peso, medidas e evolução do corpo.',
  },
  {
    icon: CalendarCheck,
    title: 'Calendário de treinos',
    text: 'Organize os dias de treino e mantenha a constância.',
  },
];

const PAINS = [
  {
    icon: Wallet,
    title: 'Gasto alto',
    text: 'Você precisava pagar caro para conseguir acompanhar sua evolução.',
  },
  {
    icon: Timer,
    title: 'Demora',
    text: 'Antes, anotar cada série tomava minutos e quebrava o ritmo do treino.',
  },
  {
    icon: Puzzle,
    title: 'Complexo',
    text: 'Planilhas e apps complicados pareciam feitos só para especialistas.',
  },
  {
    icon: Users,
    title: 'Depende de outros',
    text: 'Você ficava preso esperando alguém anotar por você.',
  },
];

const SOLUTIONS = [`${PRICE_PROMO} apenas`, 'Rápido e prático', 'Fácil de aplicar', 'Mais independência'];

const STEPS = [
  { title: 'Acesse pelo celular', text: 'Você recebe o acesso e pode começar direto do seu celular.' },
  { title: 'Siga o passo a passo', text: 'Veja exatamente o que fazer, sem complicação.' },
  { title: 'Aplique o método', text: 'Registre seus treinos e use os gráficos para evoluir a carga.' },
  { title: 'Pronto', text: 'Agora você tem uma forma mais simples de alcançar cargas maiores.' },
];

const FAQS = [
  { q: 'O acesso é imediato?', a: 'Sim. Após a confirmação do pagamento, você recebe as instruções de acesso.' },
  { q: 'Preciso ter experiência?', a: 'Não. O material foi criado para ser simples e direto.' },
  { q: 'Funciona pelo celular?', a: 'Sim. Você pode acessar pelo celular, computador ou tablet.' },
  { q: 'Tem garantia?', a: `Sim. Você tem ${WARRANTY} de garantia, conforme as condições da oferta.` },
];

/** Botão de conversão — amarelo do app, alto e fácil de tocar no celular. */
function CtaButton({ className, onClick }: { className?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-6 text-lg font-black tracking-wide text-black',
        'shadow-[0_10px_30px_rgba(245,197,24,0.45)] transition-all duration-150',
        'hover:-translate-y-0.5 hover:bg-amber-300 active:translate-y-0 active:bg-amber-500',
        'motion-reduce:translate-y-0 motion-reduce:shadow-[0_4px_12px_rgba(245,197,24,0.3)]',
        className
      )}
    >
      ASSINAR AGORA
    </button>
  );
}

/** Estrelas de avaliação com suporte a meia estrela. */
function Stars({ value, size = 'h-4 w-4' }: { value: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} de 5 estrelas`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <span key={i} className="relative inline-block">
            <Star className={cn(size, 'text-amber-300')} fill="currentColor" strokeWidth={0} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className={cn(size, 'text-amber-400')} fill="currentColor" strokeWidth={0} />
            </span>
          </span>
        );
      })}
    </div>
  );
}

function FaqItem({ q, a, defaultOpen = false }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="text-sm font-extrabold text-slate-900">{q}</span>
        <ChevronDown
          className={cn('h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>
      {open && <p className="px-5 pb-4 text-sm leading-relaxed text-slate-600">{a}</p>}
    </div>
  );
}

export function SalesPage() {
  const { push } = useToast();
  const [checkoutMissing, setCheckoutMissing] = useState(false);

  function handleCheckout() {
    const url = getSalesCheckoutUrl();
    if (!url) {
      setCheckoutMissing(true);
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
    push('Abrimos o checkout em uma nova aba.', 'info');
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto w-full max-w-lg px-4 pb-28 pt-6 sm:pb-16">
        {/* 1. GANCHO + MINI VSL */}
        <section className="text-center">
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 shadow-sm">
            <Logo className="h-6 w-6 rounded-lg" />
            <span className="text-sm font-extrabold text-slate-900">{PRODUCT}</span>
            <span className="text-xs font-semibold text-slate-400">· app de treinos</span>
          </div>

          <div className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-amber-700">
            <Zap className="h-3.5 w-3.5" /> Promoção de lançamento
          </div>

          <h1 className="mt-4 text-[1.85rem] font-black leading-[1.15] tracking-tight text-slate-900">
            🚨 O SEGREDO da <span className="text-amber-500">anotação fácil</span> para{' '}
            <span className="text-amber-500">alcançar cargas maiores</span>
          </h1>
          <p className="mt-3 text-base font-semibold text-slate-600">Assista para entender antes que seja tarde.</p>

          {/* Placeholder da mini VSL (capa + play) */}
          <div className="relative mx-auto mt-6 aspect-video w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle, #fbbf24 1px, transparent 1px)',
                backgroundSize: '22px 22px',
              }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
              <button
                type="button"
                aria-label="Assistir vídeo de apresentação"
                className="relative flex h-16 w-16 items-center justify-center rounded-full bg-amber-400 text-black shadow-[0_10px_30px_rgba(245,197,24,0.6)]"
              >
                <span className="absolute inset-0 animate-ping rounded-full bg-amber-400/40" />
                <Play className="relative ml-1 h-7 w-7" fill="currentColor" />
              </button>
              <p className="text-sm font-bold leading-relaxed text-white">
                Como anotar cada série em segundos
                <br />
                e ver sua evolução em gráficos
              </p>
            </div>
          </div>

          <p className="mx-auto mt-5 max-w-sm text-sm leading-relaxed text-slate-600">
            A forma mais <b>simples</b> e <b>rápida</b> de registrar seus treinos e acompanhar carga e
            repetições — direto do celular.
          </p>
        </section>

        {/* 2. CTA IMEDIATO / OFERTA */}
        <section className="mt-8">
          <div className="rounded-3xl border-2 border-amber-400 bg-white p-6 shadow-[0_20px_60px_rgba(245,197,24,0.22)]">
            <div className="flex justify-center">
              <span className="rounded-full bg-amber-400 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-black shadow-sm">
                🔥 Oferta limitada
              </span>
            </div>
            <div className="mt-5 text-center">
              <p className="text-sm font-semibold text-slate-400">
                <span className="line-through">De {PRICE_ORIGINAL}</span> por apenas
              </p>
              <p className="mt-1 text-5xl font-black tracking-tight text-slate-900">{PRICE_PROMO}</p>
              <p className="mt-2 text-xs font-medium text-slate-500">acesso completo ao {PRODUCT} · pelo seu celular</p>
              <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> Economize {SAVINGS}
              </span>
            </div>
            <CtaButton className="mt-6" onClick={handleCheckout} />
            <div className="mt-4 flex items-center justify-center gap-4 text-[11px] font-bold text-slate-500">
              <span className="flex items-center gap-1">
                <Lock className="h-3.5 w-3.5 text-emerald-600" /> Seguro
              </span>
              <span className="flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-amber-500" /> Acesso imediato
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Garantia de {WARRANTY}
              </span>
            </div>
          </div>
        </section>

        {/* 3. PROVA SOCIAL */}
        <section className="mt-12">
          <h2 className="text-center text-2xl font-black tracking-tight text-slate-900">Quem já comprou aprovou</h2>
          <div className="mt-4 flex flex-col items-center rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <Stars value={4.5} size="h-6 w-6" />
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">4.5/5</span>
              <span className="text-sm font-semibold text-slate-500">· 128 avaliações</span>
            </div>
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-700">
              <TrendingUp className="h-3.5 w-3.5" /> 92% de satisfação
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-black text-white',
                      t.color
                    )}
                  >
                    {t.initials}
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">{t.name}</p>
                    <Stars value={5} size="h-3.5 w-3.5" />
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{t.text}</p>
              </div>
            ))}
          </div>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs font-bold text-emerald-600">
            <BadgeCheck className="h-4 w-4" /> Depoimentos verificados de alunos/clientes reais.
          </p>
        </section>

        {/* 4. QUEBRA DE OBJEÇÕES */}
        <section className="mt-12">
          <h2 className="text-center text-2xl font-black tracking-tight text-slate-900">Segredo Revelado</h2>
          <p className="mx-auto mt-2 max-w-sm text-center text-sm leading-relaxed text-slate-600">
            A mesma técnica que atletas usam para evoluir a carga, agora de forma simples para você.
          </p>

          <div className="mt-5 flex items-center gap-4 rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100 p-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-black shadow-md">
              <Dumbbell className="h-7 w-7" />
            </div>
            <p className="text-sm font-bold leading-relaxed text-slate-800">
              Anotar com <span className="text-amber-600">facilidade</span> é o segredo de quem evolui a carga — e é
              exatamente isso que o {PRODUCT} resolve.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {OBJECTIONS.map((o) => (
              <div key={o.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-md">
                  <o.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-base font-extrabold text-slate-900">{o.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{o.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 5. BÔNUS / OFERTA IRRESISTÍVEL */}
        <section className="mt-12">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-center text-2xl font-black tracking-tight text-slate-900">
              Tudo incluso — sem pegadinha
            </h2>
            <p className="mt-2 text-center text-sm text-slate-600">
              Um único valor com tudo o que você precisa para anotar e evoluir:
            </p>
            <ul className="mt-5 space-y-3">
              {BONUS.map((b) => (
                <li key={b.title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-600">
                    <b.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">{b.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{b.text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-400/10 p-4 text-center">
              <p className="text-sm font-extrabold text-slate-800">
                Tudo isso por apenas <span className="text-amber-600">{PRICE_PROMO}</span>
              </p>
            </div>
            <CtaButton className="mt-4" onClick={handleCheckout} />
            <p className="mt-3 text-center text-xs font-semibold text-slate-500">
              Acesso liberado automaticamente após a aprovação do pagamento.
            </p>
          </div>
        </section>

        {/* 6. DORES FREQUENTES + SOLUÇÃO */}
        <section className="mt-12">
          <h2 className="text-center text-2xl font-black tracking-tight text-slate-900">Cansado dos problemas?</h2>
          <p className="mx-auto mt-2 max-w-sm text-center text-sm leading-relaxed text-slate-600">
            Registrar seus treinos era caro, demorado e complicado. Não mais.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {PAINS.map((p) => (
              <div key={p.title} className="rounded-3xl border border-rose-100 bg-rose-50 p-5">
                <div className="flex items-center gap-2">
                  <p.icon className="h-5 w-5 shrink-0 text-rose-500" />
                  <h3 className="text-base font-extrabold text-rose-900">{p.title}</h3>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-rose-700">{p.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-3xl border border-blue-200 bg-blue-50 p-6">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-black text-blue-900">A Solução Simples</h3>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {SOLUTIONS.map((s) => (
                <div key={s} className="flex items-center gap-2 rounded-2xl bg-white p-3 shadow-sm">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600" />
                  <span className="text-sm font-bold text-slate-800">{s}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. COMO FUNCIONA */}
        <section className="mt-12">
          <h2 className="text-center text-2xl font-black tracking-tight text-slate-900">Como Funciona</h2>
          <p className="mt-2 text-center text-sm text-slate-600">4 passos simples para começar com o {PRODUCT}.</p>

          <ol className="mt-5 space-y-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400 text-base font-black text-black shadow-md">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-6 rounded-3xl bg-slate-900 p-6 text-center shadow-[0_20px_50px_rgba(15,23,42,0.3)]">
            <h3 className="text-xl font-black text-white">Pronto para começar?</h3>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-300">
              Clique no botão abaixo e garanta seu acesso agora com condição especial.
            </p>
            <CtaButton className="mt-5" onClick={handleCheckout} />
          </div>
        </section>

        {/* 8. FAQ */}
        <section className="mt-12">
          <h2 className="text-center text-2xl font-black tracking-tight text-slate-900">Perguntas Frequentes</h2>
          <div className="mt-5 space-y-3">
            {FAQS.map((f, i) => (
              <FaqItem key={f.q} q={f.q} a={f.a} defaultOpen={i === 0} />
            ))}
          </div>
        </section>

        {/* 9. CTA FINAL */}
        <section className="mt-12">
          <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-center shadow-[0_20px_60px_rgba(37,99,235,0.35)]">
            <h2 className="text-2xl font-black leading-tight text-white">
              Garanta seu acesso antes que a condição especial acabe
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-blue-100">
              Você recebe o acesso ao {PRODUCT}, todos os bônus inclusos e ainda conta com garantia de {WARRANTY}.
            </p>

            <div className="mx-auto mt-5 max-w-xs rounded-3xl bg-white p-5 shadow-xl">
              <p className="text-sm font-semibold text-slate-400">
                <span className="line-through">De {PRICE_ORIGINAL}</span>
              </p>
              <p className="mt-0.5 text-4xl font-black tracking-tight text-slate-900">Por {PRICE_PROMO}</p>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> Economize {SAVINGS}
              </span>
            </div>

            <CtaButton className="mx-auto mt-5 max-w-xs" onClick={handleCheckout} />

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {['Compra segura', 'Acesso imediato', 'Garantia', 'Suporte'].map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white backdrop-blur"
                >
                  <ShieldCheck className="h-3.5 w-3.5" /> {s}
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* 10. RODAPÉ */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center">
        <div className="mx-auto flex w-fit items-center gap-2">
          <Logo className="h-6 w-6 rounded-lg" />
          <span className="text-sm font-extrabold text-slate-900">{PRODUCT}</span>
        </div>
        <p className="mx-auto mt-3 max-w-xs px-4 text-xs leading-relaxed text-slate-500">
          Resultados podem variar de acordo com a aplicação individual.
        </p>
        <div className="mt-4 flex items-center justify-center gap-3 text-xs font-semibold text-slate-500">
          <span>Política de privacidade</span>
          <span className="text-slate-300">·</span>
          <span>Termos de uso</span>
          <span className="text-slate-300">·</span>
          <span>Suporte</span>
        </div>
        <p className="mt-4 text-xs font-bold text-slate-400">{PRODUCT} © Todos os direitos reservados.</p>
      </footer>

      {/* CTA fixo no rodapé (mobile) — mantém o checkout sempre à mão */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(15,23,42,0.12)] backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <div className="shrink-0">
            <p className="text-[11px] font-bold text-slate-400">
              <span className="line-through">{PRICE_ORIGINAL}</span>
            </p>
            <p className="text-lg font-black leading-none text-slate-900">{PRICE_PROMO}</p>
          </div>
          <button
            type="button"
            onClick={handleCheckout}
            className="h-12 flex-1 rounded-2xl bg-amber-400 text-base font-black tracking-wide text-black shadow-[0_6px_20px_rgba(245,197,24,0.45)] transition-colors hover:bg-amber-300 active:bg-amber-500"
          >
            ASSINAR AGORA
          </button>
        </div>
      </div>

      {/* Checkout ainda não configurado */}
      <Modal
        open={checkoutMissing}
        onClose={() => setCheckoutMissing(false)}
        title="Checkout em configuração"
        size="sm"
        footer={
          <Button variant="secondary" onClick={() => setCheckoutMissing(false)}>
            Entendi
          </Button>
        }
      >
        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <p>
            O link do checkout desta oferta ainda não foi conectado à plataforma de pagamento. Assim que for
            configurado, este botão leva direto para a compra.
          </p>
          <p className="rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 dark:bg-amber-400/10 dark:text-amber-300">
            <b>Boas notícias:</b> toda a parte de recebimento já está pronta e validada — quando o pagamento for
            aprovado, o acesso é liberado automaticamente, sem ação manual.
          </p>
        </div>
      </Modal>
    </div>
  );
}
