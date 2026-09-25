import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { CtaButton } from '../components/CtaButton';
import { PRICE_PROMO, PRODUCT, WARRANTY } from '../data';

/** Seção 9 — CTA final (fundo azul destacado + preço repetido). */
export function FinalCtaSection({ onCheckout }: { onCheckout: () => void }) {
  return (
    <section className="mt-12">
      <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-center shadow-[0_20px_60px_rgba(37,99,235,0.35)]">
        <h2 className="text-2xl font-black leading-tight text-white">
          Treine sem anúncios com o {PRODUCT} Premium
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-blue-100">
          O app é grátis para todos. Com o Premium, você remove os anúncios, recebe os bônus inclusos e ainda conta com garantia de {WARRANTY}.
        </p>

        <div className="mx-auto mt-5 max-w-xs rounded-3xl bg-white p-5 shadow-xl">
          <p className="text-sm font-semibold text-slate-500">{PRODUCT} Premium · sem anúncios</p>
          <p className="mt-0.5 text-4xl font-black tracking-tight text-slate-900">{PRICE_PROMO}</p>
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> Cancele quando quiser
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
