# 📋 Resumo Completo do RepFit

## O que é o RepFit?

**RepFit** é um aplicativo mobile (PWA) que funciona como **diário de treino e medidas corporais** para pessoas que praticam musculação, calistenia ou cardio. O app é instalado direto no navegador do celular (sem precisar de loja de apps) e funciona **100% offline** — todos os dados ficam salvos apenas no dispositivo do usuário, garantindo total privacidade.

**URL do app:** https://repfit.inosaas.com.br
**Landing page de trial (15 dias grátis):** https://repfit.inosaas.com.br/trial/gratis
**Página de vendas:** https://repfit.inosaas.com.br/oferta

---

## 🎯 Público-Alvo

- **Pessoas que frequentam academia** e querem registrar treinos
- **Praticantes de calistenia** (treino com peso corporal)
- **Atletas de cardio** que querem acompanhar performance
- **Personal trainers** que querem organizar treinos de alunos
- **Iniciantes na musculação** que precisam de orientação
- **Faixa etária:** 16-45 anos (foco: 18-35)
- **Gênero:** Todos (foco masculino: ~70%)
- **Perfil:** Pessoa que treina 3-5x por semana e quer ver evolução

---

## 💡 Proposta de Valor

### Dor do usuário:
- "Não sei quanto eu levanto em cada exercício"
- "Esqueço o que treinei na semana passada"
- "Não consigo ver minha evolução ao longo do tempo"
- "Uso caderno ou planilha, mas é chato e desorganizado"
- "Apps existentes são complexos ou pedem dados na internet"

### Solução do RepFit:
- **Registra treinos em 30 segundos** (exercícios rápidos baseados no histórico)
- **Mostra evolução com gráficos** (carga, repetições, volume)
- **Calcula recordes pessoais automaticamente**
- **Medidas corporais** (peso, braço, peito, cintura, coxa)
- **Funciona 100% offline** — privacidade total
- **Compartilha treinos** com personagens anatômicos profissionais

---

## 📱 Funcionalidades Principais

### 1. Registro de Treinos
- Formulário rápido com exercícios pré-preenchidos (baseado no histórico)
- Campos: exercício, peso, repetições, séries, esforço (1-6)
- Suporte a **academia, calistenia e cardio**
- Modo "Salvar e novo treino" para registrar vários treinos seguidos
- Rascunho automático (se fechar o app, o treino é salvo)
- Timer de descanso entre séries

### 2. Evolução e Gráficos
- **Gráfico de carga** (peso máximo por exercício ao longo do tempo)
- **Gráfico de repetições** (máximo de reps)
- **Gráfico de volume** (soma de peso x reps x séries)
- **Gráfico de frequência** (treinos por semana)
- **Comparação lado a lado** de dois exercícios
- **Filtros por período:** 30 dias, 3 meses, 6 meses, tudo

### 3. Recordes Pessoais
- Detecção automática de recordes (maior carga, mais reps, maior volume)
- Exibição na home e na página de evolução
- Histórico de recordes com datas

### 4. Medidas Corporais
- Registro de: peso, braço, peito, cintura, quadril, coxa, panturrilha
- Gráficos de evolução por medida
- Suporte a **kg e lb**

### 5. Calendário Visual
- Calendário mensal com dias de treino destacados
- Visualização rápida de frequência

### 6. Compartilhamento
- **Cards de compartilhamento** com design profissional
- Templates: muscular, minimal, escuro, claro
- **Personagens anatômicos** (frontal e traseira) com músculos destacados
- Exportação como **PNG em alta resolução**
- Compartilhamento via WhatsApp, Instagram, etc.

### 7. Backup e Sincronização
- Backup local (IndexedDB)
- Sincronização entre dispositivos via Supabase (premium)
- **Device linking** (conectar celular ao navegador)

### 8. Personalização
- Tema claro/escuro
- Unidades (kg/lb)
- Nome do usuário
- Meta semanal de treinos

---

## 💰 Modelo de Negócio

### Trial Gratuito
- **15 dias de acesso completo** para novos usuários
- Landing page dedicada: https://repfit.inosaas.com.br/trial/gratis
- Ativação com login Google (1 toque)
- Banner de contagem regressiva no app

### Planos Pagos (via Kirvano)

| Plano | Preço | Desconto |
|-------|-------|----------|
| **Mensal** | R$ 24,90/mês | — |
| **Trimestral** | R$ 67,90/3 meses | 13% (R$ 22,63/mês) |
| **Semestral** ⭐ popular | R$ 119,90/6 meses | 33% (R$ 19,98/mês) |

### O que muda no plano pago:
- Sincronização na nuvem (backup seguro)
- Histórico e recordes completos
- Medidas corporais e evolução
- Gráficos de progressão
- Suporte prioritário

### Checkout
- Plataforma: **Kirvano** ( gateway de pagamento brasileiro)
- Link: https://pay.kirvano.com/cae35583-ecaa-4b51-973c-0c2873f4e85a
- Webhook automático: pagamento aprovado → acesso liberado no Supabase

---

## 🏗️ Arquitetura Técnica

### Frontend
- **React 19** + TypeScript
- **Vite** (build tool)
- **Tailwind CSS** (estilização)
- **PWA** (Progressive Web App) — funciona offline
- **IndexedDB** (armazenamento local via Dexie)
- **React Router** (navegação SPA)

### Backend
- **Supabase** (autenticação + banco de dados + edge functions)
- **Edge Functions:** webhooks de pagamento, admin, device-link, activate-trial
- **RLS (Row Level Security)** em todas as tabelas

### Segurança
- Content Security Policy (CSP) habilitado
- CORS restrito
- Webhooks com timingSafeEqual (anti timing attack)
- Fotos em IndexedDB (nunca base64 em localStorage)
- Validação de tamanho em payloads

### Hospedagem
- **GitHub Pages** com domínio customizado
- Deploy automático via GitHub Actions
- **URL:** https://repfit.inosaas.com.br

---

## 📊 Métricas Importantes

### Funil de Conversão
1. **Visitante** → Acessa landing page
2. **Trial** → Clica "Quero meus 15 dias grátis"
3. **Ativado** → Cria conta e ativa trial
4. **Engajado** → Usa o app pelo menos 3x na semana
5. **Convertido** → Assina plano pago

### KPIs para Acompanhar
- Visitantes únicos por semana
- Trials iniciados por semana
- Taxa de ativação do trial
- Uso ativo durante o trial (dias com treino)
- Taxa de conversão trial → pago
- Churn mensal (cancelamentos)
- LTV (lifetime value) do cliente
- CAC (custo de aquisição)

---

## 🎨 Identidade Visual

- **Cores:** Dourado/amber (#f59e0b) como cor principal, fundo escuro (#0a0a0b)
- **Tipografia:** Bold/extrabold, moderna
- **Estilo:** Clean, minimalista, profissional
- **Logo:** "RepFit" com ícone de haltere
- **Cards de compartilhamento:** Personagens anatômicos com músculos destacados

---

## 🔗 Links Importantes

| Página | URL |
|--------|-----|
| App principal | https://repfit.inosaas.com.br/ |
| Trial 15 dias grátis | https://repfit.inosaas.com.br/trial/gratis |
| Página de vendas | https://repfit.inosaas.com.br/oferta |
| Planos | https://repfit.inosaas.com.br/planos |
| Checkout Kirvano | https://pay.kirvano.com/cae35583-ecaa-4b51-973c-0c2873f4e85a |

---

## 🏆 Diferenciais Competitivos

1. **100% offline** — maioria dos apps de treino dependem de internet
2. **Privacidade total** — dados ficam no celular, não na nuvem (por padrão)
3. **PWA** — não precisa de loja de apps, funciona no navegador
4. **Cards de compartilhamento** — design profissional com an anatomia
5. **Exercícios rápidos** — baseados no histórico, registro em 30 segundos
6. **Comparação de exercícios** — ver evolução lado a lado
7. **Preço acessível** — a partir de R$ 19,98/mês (plano semestral)
8. **Trial de 15 dias** — experimentar sem compromisso

---

## 📈 Oportunidades de Crescimento

1. **Marketing de conteúdo** — dicas de treino no Instagram/TikTok
2. **Parcerias com personal trainers** — programa de indicação
3. **Tráfego pago** — Instagram/Facebook Ads
4. **SEO** — "app de treino", "registrar musculação"
5. **Referral program** — indique um amigo, ganhe 1 mês grátis
6. **Expansão internacional** — traduzir para espanhol/inglês

---

## 🎯 Positioning Statement

> **RepFit** é o app de treino que cabe no seu bolso e funciona sem internet. Registre seus treinos em 30 segundos, acompanhe sua evolução com gráficos profissionais e compartilhe seus resultados com cards personalizados. Só você vê seus dados — privacidade total garantida.
