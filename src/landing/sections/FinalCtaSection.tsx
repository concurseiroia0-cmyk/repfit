import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { CtaButton } from '../components/CtaButton';
import { PRICE_ORIGINAL, PRICE_PROMO, PRODUCT, SAVINGS, WARRANTY } from '../data';

/** Seção 9 — CTA final (fundo azul destacado + preço repetido). */
export function FinalCtaSection({ onCheckout }: { onCheckout: () => void }) {
  return (
    <section className="mt-12">
      <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-center shadow-[0_20px_60px_rgba(37,99,235,0.35)]">
        <h2 className="text-2xl font-black leading-tight text-white">
          Garanta seu acesso antes que a condição especial acabe
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-blue-100">
          Você recebe o acesso ao {PRODUCT}, todos os bônus inclusos e ainda conta com garantia de {WARRANTY}.
        </p>

        <div className="mx-auto mt-5 max-w-xs rounded-3xl bg-white p-5 shadow-xl">
          <p className="text-sm font-semibold text-slate-400">
            <span className="line-through">De {PRICE_ORIGINAL}</span>
          </p>
          <p className="mt-0.5 text-4xl font-black tracking-tight text-slate-900">Por {PRICE_PROMO}</p>
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> Economize {SAVINGS}
          </span>
        </div>

        <CtaButton className="mx-auto mt-5 max-w-xs" onClick={onCheckout} />

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {['Compra segura', 'Acesso imediato', 'Garantia', 'Suporte'].map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white backdrop-blur"
            >
              <ShieldCheck className="h-3.5 w-3.5" /> {s}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
