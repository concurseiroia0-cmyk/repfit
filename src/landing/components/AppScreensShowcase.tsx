import { useEffect, useState } from 'react';
import { cn } from '../../utils/misc';
import shareCardTreinoConcluido from '../assets/share-card-treino-concluido.png';
import shareCardBiceps from '../assets/share-card-biceps.png';
import telaInicio from '../assets/tela-inicio.png';
import telaNovoTreino from '../assets/tela-novo-treino.png';
import telaHistorico from '../assets/tela-historico.png';
import telaCalendario from '../assets/tela-calendario.png';
import telaMedidas from '../assets/tela-medidas.png';
import telaEvolucao from '../assets/tela-evolucao.png';

// ============================================================================
// Gifcard em moldura de celular: mostra os prints das telas do RepFit em um
// carrossel automático, com pontos clicáveis e legenda.
//
// PARA ADICIONAR MAIS TELAS: coloque o print em src/landing/assets/ e
// adicione um item aqui em SCREENS (ex.: { src: minhaTela, alt: '...',
// caption: '...' }). O carrossel já funciona sozinho com quantas telas
// houver.
// ============================================================================

const SCREENS = [
  {
    src: telaNovoTreino,
    alt: 'Tela de novo treino no RepFit',
    caption: 'Anote séries, peso e repetições em segundos',
  },
  {
    src: telaEvolucao,
    alt: 'Tela de evolução com recordes no RepFit',
    caption: 'Recordes e gráficos da sua evolução',
  },
  {
    src: telaInicio,
    alt: 'Tela inicial do RepFit',
    caption: 'Resumo da semana: sequência, volume e esforço',
  },
  {
    src: telaMedidas,
    alt: 'Tela de medidas corporais no RepFit',
    caption: 'Peso e medidas registrados ao longo do tempo',
  },
  {
    src: telaHistorico,
    alt: 'Tela de histórico de treinos no RepFit',
    caption: 'Histórico completo com busca e filtros',
  },
  {
    src: telaCalendario,
    alt: 'Calendário de treinos no RepFit',
    caption: 'Treinos organizados no calendário',
  },
  {
    src: shareCardTreinoConcluido,
    alt: 'Card de treino concluído compartilhado pelo RepFit',
    caption: 'Compartilhe seu treino concluído com 1 toque',
  },
  {
    src: shareCardBiceps,
    alt: 'Resumo do treino de bíceps no RepFit',
    caption: 'Volume, duração e séries em um card bonito',
  },
];

export function AppScreensShowcase() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % SCREENS.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="mx-auto mt-6 flex w-fit flex-col items-center">
      {/* Moldura de celular */}
      <div className="relative w-[230px] rounded-[2.6rem] bg-slate-900 p-2 shadow-[0_25px_60px_rgba(15,23,42,0.4)] ring-1 ring-slate-700/60">
        <div className="relative aspect-[9/19] w-full overflow-hidden rounded-[2rem] bg-slate-950">
          {/* Ilha dinâmica */}
          <span className="absolute left-1/2 top-2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />

          {SCREENS.map((s, i) => (
            <img
              key={s.src}
              src={s.src}
              alt={s.alt}
              loading="lazy"
              className={cn(
                'absolute inset-0 h-full w-full object-contain transition-opacity duration-700',
                i === index ? 'opacity-100' : 'opacity-0'
              )}
            />
          ))}
        </div>
      </div>

      {/* Pontos + legenda */}
      <div className="mt-3 flex items-center gap-1.5">
        {SCREENS.map((s, i) => (
          <button
            key={s.src}
            type="button"
            aria-label={`Ver tela: ${s.caption}`}
            onClick={() => setIndex(i)}
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              i === index ? 'w-6 bg-amber-400' : 'w-2 bg-slate-300'
            )}
          />
        ))}
      </div>
      <p className="mt-2 min-h-10 max-w-[240px] text-center text-xs font-semibold leading-relaxed text-slate-600">
        {SCREENS[index].caption}
      </p>
    </div>
  );
}
