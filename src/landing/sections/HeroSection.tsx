import { Play, Zap } from 'lucide-react';
import { Logo } from '../../components/Logo';
import { PRODUCT } from '../data';

/**
 * Seção 1 — Gancho + mini VSL.
 * O bloco de vídeo é um placeholder (capa + play) até o dono enviar o link
 * real da mini VSL. Coloque a capa em src/landing/assets/ e troque aqui.
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
  );
}
