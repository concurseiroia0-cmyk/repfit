import { CtaButton } from '../components/CtaButton';
import { BONUS, PRICE_PROMO } from '../data';

/** Seção 5 — bônus / recursos inclusos + CTA. */
export function BonusSection({ onCheckout }: { onCheckout: () => void }) {
  return (
    <section className="mt-12">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-center text-2xl font-black tracking-tight text-slate-900">
          Tudo incluso — sem pegadinha
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Um único valor com tudo o que você precisa para anotar e evoluir:
        </p>
        <ul className="mt-5 space-y-3">
          {BONUS.map((b) => (
            <li key={b.title} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-600">
                <b.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-extrabold text-slate-900">{b.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{b.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-400/10 p-4 text-center">
          <p className="text-sm font-extrabold text-slate-800">
            Tudo isso por apenas <span className="text-amber-600">{PRICE_PROMO}</span>
          </p>
        </div>
        <CtaButton className="mt-4" onClick={onCheckout} />
        <p className="mt-3 text-center text-xs font-semibold text-slate-500">
          Acesso liberado automaticamente após a aprovação do pagamento.
        </p>
      </div>
    </section>
  );
}
