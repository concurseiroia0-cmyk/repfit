import { CheckCircle2, Sparkles } from 'lucide-react';
import { PAINS, SOLUTIONS } from '../data';

/** Seção 6 — dores frequentes (cards rosa) + bloco azul "A Solução Simples". */
export function PainsSection() {
  return (
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
  );
}
