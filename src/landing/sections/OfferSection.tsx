import { CheckCircle2, Lock, ShieldCheck, Zap } from 'lucide-react';
import { CtaButton } from '../components/CtaButton';
import { PRICE_ORIGINAL, PRICE_PROMO, PRODUCT, SAVINGS, WARRANTY } from '../data';

/** Seção 2 — CTA imediato / card de oferta destacado. */
export function OfferSection({ onCheckout }: { onCheckout: () => void }) {
  return (
    <section className="mt-8">
      <div className="rounded-3xl border-2 border-amber-400 bg-white p-6 shadow-[0_20px_60px_rgba(245,197,24,0.22)]">
        <div className="flex justify-center">
          <span className="rounded-full bg-amber-400 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-black shadow-sm">
            🔥 Oferta limitada
          </span>
        </div>
        <div className="mt-5 text-center">
          <p className="text-sm font-semibold text-slate-400">
            <span className="line-through">De {PRICE_ORIGINAL}</span> por apenas
          </p>
          <p className="mt-1 text-5xl font-black tracking-tight text-slate-900">{PRICE_PROMO}</p>
          <p className="mt-2 text-xs font-medium text-slate-500">acesso completo ao {PRODUCT} · pelo seu celular</p>
          <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> Economize {SAVINGS}
          </span>
        </div>
        <CtaButton className="mt-6" onClick={onCheckout} />
        <div className="mt-4 flex items-center justify-center gap-4 text-[11px] font-bold text-slate-500">
          <span className="flex items-center gap-1">
            <Lock className="h-3.5 w-3.5 text-emerald-600" /> Seguro
          </span>
          <span className="flex items-center gap-1">
            <Zap className="h-3.5 w-3.5 text-amber-500" /> Acesso imediato
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Garantia de {WARRANTY}
          </span>
        </div>
      </div>
    </section>
  );
}
