import { Zap } from 'lucide-react';
import { Logo } from '../../components/Logo';
import { AppScreensShowcase } from '../components/AppScreensShowcase';
import { PRODUCT } from '../data';

/**
 * Seção 1 — Gancho + mostra do app em moldura de celular (gifcard).
 * O gifcard substituiu a mini VSL (o vídeo do YouTube estava privado e não
 * podia ser incorporado); as telas vêm de src/landing/components/
 * AppScreensShowcase.tsx — adicione os prints das outras seções lá.
 */
export function HeroSection() {
  return (
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
      <p className="mt-3 text-base font-semibold text-slate-600">
        Veja como o RepFit funciona direto no seu celular.
      </p>

      {/* Gifcard: telas do app em moldura de celular */}
      <AppScreensShowcase />

      <p className="mx-auto mt-5 max-w-sm text-sm leading-relaxed text-slate-600">
        A forma mais <b>simples</b> e <b>rápida</b> de registrar seus treinos e acompanhar carga e
        repetições — direto do celular.
      </p>
    </section>
  );
}
