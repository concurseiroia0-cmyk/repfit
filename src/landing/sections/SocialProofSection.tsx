import { BadgeCheck, TrendingUp } from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';
import { Stars } from '../components/Stars';
import { TESTIMONIALS } from '../data';

/** Seção 3 — prova social (nota média + depoimentos). */
export function SocialProofSection() {
  return (
    <section className="mt-12">
      <SectionHeading title="Quem já comprou aprovou" />
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
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-black text-white ${t.color}`}
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
  );
}
