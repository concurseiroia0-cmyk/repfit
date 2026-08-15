# Landing — página de vendas (/oferta)

Estrutura isolada da página de vendas do RepFit. Alterações aqui **não**
afetam o aplicativo principal (dashboard, treinos, assinatura, etc.).

## Estrutura

```
src/landing/
├── assets/      → imagens (capa da VSL, fotos de depoimentos, banners)
├── components/  → peças pequenas e reutilizáveis da landing
│   ├── CtaButton.tsx      → botão amarelo "ASSINAR AGORA"
│   ├── FaqItem.tsx        → item de FAQ em acordeão
│   ├── SectionHeading.tsx → título + subtítulo padrão de seção
│   └── Stars.tsx          → estrelas de avaliação (com meia estrela)
├── data.ts      → TODOS os textos/preços (copy, depoimentos, FAQ)
├── index.ts     → exporta a página (import estável para o app)
├── pages/
│   └── SalesPage.tsx      → composição das seções + estado do checkout
└── sections/    → uma seção por arquivo, na ordem da página
    ├── HeroSection.tsx         (1. gancho + mini VSL)
    ├── OfferSection.tsx        (2. oferta)
    ├── SocialProofSection.tsx  (3. prova social)
    ├── ObjectionsSection.tsx   (4. quebra de objeções)
    ├── ShareSection.tsx        (diferencial: compartilhar treino + evolução)
    ├── BonusSection.tsx        (5. bônus)
    ├── PainsSection.tsx        (6. dores + solução)
    ├── HowItWorksSection.tsx   (7. como funciona)
    ├── FaqSection.tsx          (8. FAQ)
    ├── FinalCtaSection.tsx     (9. CTA final)
    ├── FooterSection.tsx       (10. rodapé)
    └── StickyCtaSection.tsx    (CTA fixo no mobile)
```

## Como atualizar

- **Preço / copy / depoimentos / FAQ** → edite `data.ts` (não mexe em código).
- **Aparência de uma seção** → edite o arquivo da seção em `sections/`.
- **Mini VSL** → coloque a capa em `assets/` e troque o placeholder no `HeroSection.tsx`.
- **Checkout** → configure `VITE_CHECKOUT_URL_OFERTA` no `.env.production`.

## Dependências do app (deliberadas e estáveis)

A landing reaproveita `Logo`, `Modal`, `Button`, `useToast`, `checkoutUrlFor`
e `cn` do app — peças estáveis que dão identidade e comportamento de checkout
sem risco de quebrar o restante.
