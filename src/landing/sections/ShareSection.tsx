import { Send, Share2, TrendingUp, Trophy } from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';

// ============================================================================
// Seção diferencial: compartilhar o treino + mostrar a evolução.
// O mockup reproduz o card de compartilhamento real do app (tema escuro,
// selo de modalidade, stats de volume/duração/séries e o aviso de recorde).
// ============================================================================

const DIFFERENTIALS = [
  {
    icon: Share2,
    title: 'Card pronto para postar',
    text: 'Volume, duração, séries e recordes em um card bonito — gerado com um toque.',
  },
  {
    icon: Send,
    title: 'Feito para redes sociais',
    text: 'Poste no Instagram, mande no WhatsApp ou mostre para o seu personal.',
  },
  {
    icon: TrendingUp,
    title: 'Evolução em gráficos',
    text: 'Carga e repetições subindo treino após treino, tudo visual e fácil de entender.',
  },
  {
    icon: Trophy,
    title: 'Recordes em destaque',
    text: 'Bateu seu melhor? O app marca "NOVO RECORDE" bem no card.',
  },
];

/** Mockup do card de compartilhamento do app (tema escuro). */
function ShareCardMockup() {
  return (
    <div className="relative">
      <div className="w-full max-w-xs rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 p-5 shadow-[0_25px_60px_rgba(15,23,42,0.45)] ring-1 ring-white/10">
        {/* Cabeçalho: avatar + nome + data + selos */}
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400 text-base font-black text-black">
            R
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">Treino concluído</p>
            <p className="text-[11px] font-medium text-slate-400">14 AGO 2026</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white">Costas + Bíceps</span>
            <span className="rounded-full bg-sky-800/80 px-2 py-0.5 text-[10px] font-bold text-white">ACADEMIA</span>
          </div>
        </div>

        {/* Status */}
        <div className="mt-4 flex justify-center">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-black">
            ✓ Treino concluído
          </span>
        </div>

        <h3 className="mt-3 text-center text-2xl font-black tracking-tight text-white">Bíceps</h3>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          {[
            ['6', 'Exercícios'],
            ['24', 'Séries'],
            ['160', 'Repetições'],
            ['8.450', 'Volume (kg)'],
          ].map(([num, label]) => (
            <div key={label} className="rounded-xl bg-white/5 p-2 text-center ring-1 ring-white/10">
              <p className="text-base font-black text-white">{num}</p>
              <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Esforço + exercício */}
        <p className="mt-4 text-[11px] font-semibold text-slate-300">
          Esforço médio <span className="font-black text-amber-400">4/6</span>
        </p>
        <div className="mt-2 flex items-center justify-between rounded-xl bg-white/5 px-3 py-2.5 ring-1 ring-white/10">
          <span className="text-xs font-bold text-white">Rosca Martelo</span>
          <span className="text-[11px] font-semibold text-slate-400">52 kg · 4×10</span>
        </div>

        {/* Recorde */}
        <div className="mt-3 flex items-center justify-center gap-1.5 rounded-full border border-amber-400/60 bg-amber-400/15 px-3 py-2">
          <Trophy className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-[11px] font-black text-amber-400">NOVO RECORDE · Rosca Martelo · 52 kg</span>
        </div>
      </div>

      {/* Marca d'água RepFit */}
      <div className="mt-3 flex justify-end">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 shadow-md">
          <span className="flex h-4 w-4 items-center justify-center rounded bg-amber-400">
            <DumbbellIcon className="h-2.5 w-2.5 text-black" />
          </span>
          <span className="text-[11px] font-black text-white">RepFit</span>
        </span>
      </div>
    </div>
  );
}

/** Ícone local do haltere (marca d'água) — evita dependência extra. */
function DumbbellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <g fill="currentColor">
        <rect x="9.5" y="22" width="3.4" height="20" rx="1.7" transform="rotate(8 11.2 32)" />
        <rect x="18" y="17" width="4.4" height="30" rx="2.2" transform="rotate(8 20.2 32)" />
        <circle cx="30.4" cy="32" r="3.1" />
        <circle cx="33.6" cy="32" r="3.1" />
        <rect x="41.6" y="17" width="4.4" height="30" rx="2.2" transform="rotate(-8 43.8 32)" />
        <rect x="51.1" y="22" width="3.4" height="20" rx="1.7" transform="rotate(-8 52.8 32)" />
      </g>
    </svg>
  );
}

/** Mini gráfico de evolução (barras crescentes). */
function EvolutionChartMockup() {
  const bars = [38, 42, 44, 48, 51, 55, 58, 63];
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-extrabold text-slate-900">Evolução do Supino Reto</p>
        <p className="text-xs font-black text-amber-600">40 kg → 52 kg</p>
      </div>
      <div className="mt-4 flex h-20 items-end gap-1.5">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 rounded-t-md bg-amber-400/70" style={{ height: `${h}%` }} />
        ))}
        <div className="flex-1 rounded-t-md bg-amber-500 shadow-[0_0_12px_rgba(245,197,24,0.6)]" style={{ height: '100%' }} />
      </div>
      <p className="mt-2 text-[11px] font-semibold text-slate-400">Carga subindo semana após semana — visível no app.</p>
    </div>
  );
}

/** Seção diferencial — compartilhar treino + mostrar evolução. */
export function ShareSection() {
  return (
    <section className="mt-12">
      <SectionHeading
        title={
          <>
            Compartilhe o treino. Mostre a <span className="text-amber-500">evolução</span>.
          </>
        }
        subtitle="Depois de cada treino, o RepFit gera um card com volume, séries e recordes pronto para postar — e transforma sua evolução em gráficos claros."
      />

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:items-center">
        <div className="order-2 sm:order-1">
          <ul className="space-y-3">
            {DIFFERENTIALS.map((d) => (
              <li key={d.title} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-md">
                  <d.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-extrabold text-slate-900">{d.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{d.text}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-5">
            <EvolutionChartMockup />
          </div>
        </div>

        <div className="order-1 flex justify-center sm:order-2">
          <ShareCardMockup />
        </div>
      </div>
    </section>
  );
}
