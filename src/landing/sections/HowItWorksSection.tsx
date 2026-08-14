import { CtaButton } from '../components/CtaButton';
import { SectionHeading } from '../components/SectionHeading';
import { PRODUCT, STEPS } from '../data';

/** Seção 7 — como funciona (4 passos) + CTA forte. */
export function HowItWorksSection({ onCheckout }: { onCheckout: () => void }) {
  return (
    <section className="mt-12">
      <SectionHeading title="Como Funciona" subtitle={`4 passos simples para começar com o ${PRODUCT}.`} />

      <ol className="mt-5 space-y-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400 text-base font-black text-black shadow-md">
              {i + 1}
            </span>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">{s.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-6 rounded-3xl bg-slate-900 p-6 text-center shadow-[0_20px_50px_rgba(15,23,42,0.3)]">
        <h3 className="text-xl font-black text-white">Pronto para começar?</h3>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-300">
          Clique no botão abaixo e garanta seu acesso agora com condição especial.
        </p>
        <CtaButton className="mt-5" onClick={onCheckout} />
      </div>
    </section>
  );
}
