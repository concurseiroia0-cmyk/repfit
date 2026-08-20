// Landing Page: Trial de 15 dias gratis
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, CalendarCheck, Check, CheckCircle2, Cloud, Clock, Dumbbell, Lock, ShieldCheck, Smartphone, Sparkles, Timer, Trophy, TrendingUp, Zap } from 'lucide-react';
import { Logo } from '../../components/Logo';
import { useSupabaseAuth } from '../../services/supabase/useSupabaseAuth';

const BENEFITS = [
  { icon: Dumbbell, text: 'Registre treinos ilimitados com series, peso e esforco' },
  { icon: TrendingUp, text: 'Graficos de progressao de carga e repeticoes' },
  { icon: Trophy, text: 'Recordes pessoais automaticos' },
  { icon: Cloud, text: 'Backup na nuvem' },
  { icon: CalendarCheck, text: 'Calendario de treinos e medidas corporais' },
  { icon: BarChart3, text: 'Evolucao com graficos detalhados' },
  { icon: Timer, text: 'Acompanhe tempo de treino e descanso' },
  { icon: Smartphone, text: 'Funciona 100% offline' },
];

const STEPS = [
  { step: '1', title: 'Ative seu trial', text: 'Clique no botao e faca login com o Google.' },
  { step: '2', title: 'Use o RepFit', text: 'Registre treinos e acompanhe sua evolucao por 15 dias.' },
  { step: '3', title: 'Escolha seu plano', text: 'Se gostar, escolha um plano a partir de R$ 24,90/mes.' },
];

const FAQS = [
  { q: 'Preciso de cartao de credito?', a: 'Nao. O trial e 100% gratuito.' },
  { q: 'O que acontece depois dos 15 dias?', a: 'Voce escolhe um plano pago para continuar.' },
  { q: 'Posso cancelar durante o trial?', a: 'Sim, a qualquer momento sem cobranca.' },
  { q: 'Perco meus dados se nao assinar?', a: 'Seus dados ficam salvos por 30 dias.' },
  { q: 'Funciona no celular?', a: 'Sim! E um PWA que funciona ate offline.' },
];

export function TrialLandingPage() {
  const navigate = useNavigate();
  const auth = useSupabaseAuth();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (auth.user && !auth.loading) navigate('/trial', { replace: true });
  }, [auth.user, auth.loading, navigate]);

  function handleCta() {
    setBusy(true);
    navigate('/login?redirect=/trial');
  }

  if (auth.loading) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto w-full max-w-lg px-4 pb-28 pt-6 sm:pb-16">
        <section className="text-center">
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 shadow-sm">
            <Logo className="h-6 w-6 rounded-lg" />
            <span className="text-sm font-extrabold text-slate-900">RepFit</span>
            <span className="text-xs font-semibold text-slate-400">· app de treinos</span>
          </div>
          <div className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-emerald-700">
            <Sparkles className="h-3.5 w-3.5" /> 15 dias gratis
          </div>
          <h1 className="mt-4 text-[1.85rem] font-black leading-[1.15] tracking-tight text-slate-900">
            Teste o <span className="text-amber-500">RepFit</span> por{' '}
            <span className="text-amber-500">15 dias gratis</span>
          </h1>
          <p className="mt-3 text-base font-semibold text-slate-600">
            Sem cartao. Sem compromisso. Cancele quando quiser.
          </p>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-slate-600">
            Registre treinos, acompanhe sua evolucao com graficos, bata recordes e mantenha a constancia.
          </p>
        </section>

        <section className="mt-8">
          <div className="rounded-3xl border-2 border-emerald-400 bg-white p-6 shadow-[0_20px_60px_rgba(16,185,129,0.22)]">
            <div className="flex justify-center">
              <span className="rounded-full bg-emerald-400 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-black shadow-sm">Teste gratis</span>
            </div>
            <div className="mt-5 text-center">
              <p className="text-sm font-semibold text-slate-400">Acesso completo ao RepFit</p>
              <p className="mt-1 text-5xl font-black tracking-tight text-slate-900">15 dias gratis</p>
              <p className="mt-2 text-xs font-medium text-slate-500">Sem necessidade de cartao de credito</p>
              <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> Cancele quando quiser
              </span>
            </div>
            <button type="button" onClick={handleCta} disabled={busy}
              className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-6 text-lg font-black tracking-wide text-black shadow-[0_10px_30px_rgba(245,197,24,0.45)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-amber-300 active:translate-y-0 active:bg-amber-500">
              <Zap className="h-5 w-5" /> Quero meus 15 dias gratis
            </button>
            <div className="mt-4 flex items-center justify-center gap-4 text-[11px] font-bold text-slate-500">
              <span className="flex items-center gap-1"><Lock className="h-3.5 w-3.5 text-emerald-600" /> Seguro</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-amber-500" /> 15 dias</span>
              <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Sem cartao</span>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-center text-xl font-black text-slate-900">O que voce ganha nos 15 dias</h2>
          <div className="mt-5 space-y-3">
            {BENEFITS.map((f, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600"><f.icon className="h-4 w-4" /></span>
                {f.text}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-center text-xl font-black text-slate-900">Como funciona?</h2>
          <div className="mt-5 space-y-4">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400 text-sm font-black text-black">{s.step}</span>
                <div>
                  <p className="text-sm font-bold text-slate-800">{s.title}</p>
                  <p className="text-xs text-slate-500">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-center text-xl font-black text-slate-900">Perguntas frequentes</h2>
          <div className="mt-5 space-y-3">
            {FAQS.map((f, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-bold text-slate-800">{f.q}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 text-center shadow-[0_20px_60px_rgba(16,185,129,0.35)]">
            <h2 className="text-2xl font-black leading-tight text-white">Comece agora — e gratis por 15 dias</h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-emerald-100">
              Sem cartao. Sem compromisso. A
ceste tudo que o RepFit oferece.</p>
            <button type="button" onClick={handleCta} disabled={busy}
              className="mx-auto mt-5 flex h-14 max-w-xs items-center justify-center gap-2 rounded-2xl bg-amber-400 px-6 text-lg font-black tracking-wide text-black shadow-[0_10px_30px_rgba(245,197,24,0.45)] transition-all hover:bg-amber-300 active:bg-amber-500">
              <Sparkles className="h-5 w-5" /> Quero meus 15 dias gratis
            </button>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {["Gratis", "Sem cartao", "15 dias", "Cancele quando quiser"].map((s) => (
                <span key={s} className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white backdrop-blur">
                  <Check className="h-3.5 w-3.5" /> {s}
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(15,23,42,0.12)] backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <div className="shrink-0"><p className="text-[11px] font-bold text-emerald-600">15 dias gratis</p><p className="text-xs text-slate-400">Sem cartao</p></div>
          <button type="button" onClick={handleCta} disabled={busy}
            className="h-12 flex-1 rounded-2xl bg-amber-400 text-base font-black tracking-wide text-black shadow-[0_6px_20px_rgba(245,197,24,0.45)] transition-colors hover:bg-amber-300 active:bg-amber-500">TESTAR GRATIS</button>
        </div>
      </div>
      <footer className="border-t border-slate-200 bg-white px-4 py-6 text-center">
        <div className="mx-auto flex items-center justify-center gap-2"><Logo className="h-5 w-5 rounded-md" /><span className="text-xs font-bold text-slate-400">RepFit</span></div>
        <p className="mt-2 text-[11px] text-slate-400">2026 RepFit - Seu diario de treino</p>
        <div className="mt-2 flex items-center justify-center gap-3">
          <button type="button" onClick={() => navigate("/oferta")} className="text-[11px] font-semibold text-slate-400 hover:text-slate-600">Ver planos</button>
          <span className="text-slate-300">&middot;</span>
          <button type="button" onClick={() => navigate("/login")} className="text-[11px] font-semibold text-slate-400 hover:text-slate-600">Entrar</button>
        </div>
      </footer>
    </div>
  );
}
