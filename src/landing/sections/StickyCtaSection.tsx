import { PRICE_ORIGINAL, PRICE_PROMO } from '../data';

/**
 * CTA fixo no rodapé (somente mobile) — mantém o checkout sempre à mão
 * enquanto o visitante rola a página.
 */
export function StickyCtaSection({ onCheckout }: { onCheckout: () => void }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(15,23,42,0.12)] backdrop-blur sm:hidden">
      <div className="mx-auto flex max-w-md items-center gap-3">
        <div className="shrink-0">
          <p className="text-[11px] font-bold text-slate-400">
            <span className="line-through">{PRICE_ORIGINAL}</span>
          </p>
          <p className="text-lg font-black leading-none text-slate-900">{PRICE_PROMO}</p>
        </div>
        <button
          type="button"
          onClick={onCheckout}
          className="h-12 flex-1 rounded-2xl bg-amber-400 text-base font-black tracking-wide text-black shadow-[0_6px_20px_rgba(245,197,24,0.45)] transition-colors hover:bg-amber-300 active:bg-amber-500"
        >
          ASSINAR AGORA
        </button>
      </div>
    </div>
  );
}
