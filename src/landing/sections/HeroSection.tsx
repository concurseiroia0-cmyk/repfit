import { useState } from 'react';
import { Play, Zap } from 'lucide-react';
import { Logo } from '../../components/Logo';
import { PRODUCT } from '../data';

// ============================================================================
// Mini VSL — vídeo VERTICAL (9:16), pensado para quem acessa pelo celular.
// Para trocar o vídeo, basta mudar o ID abaixo (a parte depois de
// youtube.com/watch?v= ou youtu.be/).
// ============================================================================
const VSL_VIDEO_ID = 'pCivN0ihBco';

/**
 * Player da mini VSL: mostra uma capa com botão de play e só carrega o
 * iframe do YouTube quando o visitante clica (carrega rápido e não trava
 * a página). `playsinline` evita abrir o player nativo no iOS.
 */
function VslPlayer() {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative mx-auto mt-6 w-full max-w-[300px] overflow-hidden rounded-3xl bg-slate-900 shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
      <div className="aspect-[9/16] w-full">
        {playing ? (
          <iframe
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${VSL_VIDEO_ID}?autoplay=1&rel=0&playsinline=1&modestbranding=1`}
            title="Vídeo de apresentação do RepFit"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label="Assistir vídeo de apresentação"
            className="relative block h-full w-full"
          >
            {/* Capa escura com textura pontilhada */}
            <span
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle, #fbbf24 1px, transparent 1px)',
                backgroundSize: '22px 22px',
              }}
            />
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center">
              <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-amber-400 text-black shadow-[0_10px_30px_rgba(245,197,24,0.6)]">
                <span className="absolute inset-0 animate-ping rounded-full bg-amber-400/40" />
                <Play className="relative ml-1 h-7 w-7" fill="currentColor" />
              </span>
              <span className="text-sm font-bold leading-relaxed text-white">
                Como anotar cada série em segundos
                <br />
                e ver sua evolução em gráficos
              </span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Seção 1 — Gancho + mini VSL (vertical, mobile-first).
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

      <VslPlayer />

      <p className="mx-auto mt-5 max-w-sm text-sm leading-relaxed text-slate-600">
        A forma mais <b>simples</b> e <b>rápida</b> de registrar seus treinos e acompanhar carga e
        repetições — direto do celular.
      </p>
    </section>
  );
}
