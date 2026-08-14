import { Dumbbell } from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';
import { OBJECTIONS, PRODUCT } from '../data';

/** Seção 4 — quebra de objeções (banner + 4 cards com ícones azuis). */
export function ObjectionsSection() {
  return (
    <section className="mt-12">
      <SectionHeading
        title="Segredo Revelado"
        subtitle="A mesma técnica que atletas usam para evoluir a carga, agora de forma simples para você."
      />

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
  );
}
