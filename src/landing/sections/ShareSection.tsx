import { Send, Share2, TrendingUp, Trophy } from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';
import shareCardTreinoConcluido from '../assets/share-card-treino-concluido.png';
import shareCardBiceps from '../assets/share-card-biceps.png';

// ============================================================================
// Seção diferencial: compartilhar o treino + mostrar a evolução.
// Mostra as AMOSTRAS REAIS dos cards de compartilhamento do app
// (src/landing/assets/): o card "Treino concluído" e o card vertical do
// treino — para trocar, basta substituir os PNGs em assets/.
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
        </div>

        {/* Amostras reais dos cards de compartilhamento do app */}
        <div className="order-1 flex flex-wrap items-start justify-center gap-3 sm:order-2 sm:gap-4">
          <img
            src={shareCardTreinoConcluido}
            alt="Card de treino concluído compartilhado pelo RepFit"
            loading="lazy"
            className="w-[44%] rounded-2xl shadow-[0_20px_50px_rgba(15,23,42,0.3)] ring-1 ring-slate-900/10 sm:w-48"
          />
          <img
            src={shareCardBiceps}
            alt="Card de treino Bíceps compartilhado pelo RepFit"
            loading="lazy"
            className="w-[44%] rounded-2xl shadow-[0_20px_50px_rgba(15,23,42,0.3)] ring-1 ring-slate-900/10 sm:w-48"
          />
        </div>
      </div>
    </section>
  );
}
