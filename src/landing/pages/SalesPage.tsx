import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { checkoutUrlFor } from '../../services/plans';
import { BonusSection } from '../sections/BonusSection';
import { FaqSection } from '../sections/FaqSection';
import { FinalCtaSection } from '../sections/FinalCtaSection';
import { FooterSection } from '../sections/FooterSection';
import { HeroSection } from '../sections/HeroSection';
import { HowItWorksSection } from '../sections/HowItWorksSection';
import { ObjectionsSection } from '../sections/ObjectionsSection';
import { OfferSection } from '../sections/OfferSection';
import { PainsSection } from '../sections/PainsSection';
import { ShareSection } from '../sections/ShareSection';
import { SocialProofSection } from '../sections/SocialProofSection';
import { StickyCtaSection } from '../sections/StickyCtaSection';

// ============================================================================
// Página de vendas do RepFit (/oferta) — mobile first, tema claro fixo.
// Composição das seções em src/landing/sections/; textos/preços em
// src/landing/data.ts. O checkout usa VITE_CHECKOUT_URL_OFERTA (fallback:
// URL do plano mensal); sem URL configurada, o botão avisa que está em
// configuração. A liberação do acesso é automática via webhook.
// ============================================================================

/** URL do checkout da oferta (env) ou fallback para a do plano mensal. */
function getSalesCheckoutUrl(): string | undefined {
  const oferta = (import.meta.env.VITE_CHECKOUT_URL_OFERTA as string | undefined)?.trim();
  if (oferta) return oferta;
  return checkoutUrlFor('mensal');
}

export function SalesPage() {
  const { push } = useToast();
  const [checkoutMissing, setCheckoutMissing] = useState(false);

  function handleCheckout() {
    const url = getSalesCheckoutUrl();
    if (!url) {
      setCheckoutMissing(true);
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
    push('Abrimos o checkout em uma nova aba.', 'info');
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto w-full max-w-lg px-4 pb-28 pt-6 sm:pb-16">
        {/* 1. Gancho + mini VSL */}
        <HeroSection />

        {/* 2. CTA imediato / oferta */}
        <OfferSection onCheckout={handleCheckout} />

        {/* 3. Prova social */}
        <SocialProofSection />

        {/* 4. Quebra de objeções */}
        <ObjectionsSection />

        {/* Diferencial: compartilhar treino + evolução */}
        <ShareSection />

        {/* 5. Bônus / oferta irresistível */}
        <BonusSection onCheckout={handleCheckout} />

        {/* 6. Dores frequentes + solução */}
        <PainsSection />

        {/* 7. Como funciona */}
        <HowItWorksSection onCheckout={handleCheckout} />

        {/* 8. FAQ */}
        <FaqSection />

        {/* 9. CTA final */}
        <FinalCtaSection onCheckout={handleCheckout} />
      </main>

      {/* 10. Rodapé */}
      <FooterSection />

      {/* CTA fixo no rodapé (mobile) */}
      <StickyCtaSection onCheckout={handleCheckout} />

      {/* Checkout ainda não configurado */}
      <Modal
        open={checkoutMissing}
        onClose={() => setCheckoutMissing(false)}
        title="Checkout em configuração"
        size="sm"
        footer={
          <Button variant="secondary" onClick={() => setCheckoutMissing(false)}>
            Entendi
          </Button>
        }
      >
        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <p>
            O link do checkout desta oferta ainda não foi conectado à plataforma de pagamento. Assim que for
            configurado, este botão leva direto para a compra.
          </p>
          <p className="rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 dark:bg-amber-400/10 dark:text-amber-300">
            <b>Boas notícias:</b> toda a parte de recebimento já está pronta e validada — quando o pagamento for
            aprovado, o acesso é liberado automaticamente, sem ação manual.
          </p>
        </div>
      </Modal>
    </div>
  );
}
