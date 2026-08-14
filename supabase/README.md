# RepFit × Supabase

Banco de dados principal do RepFit (SaaS de registro e acompanhamento de
treinos). Esta pasta contém as **migrations SQL organizadas** que criam todo o
esquema, o RLS e o Storage.

> **Atenção:** as migrations precisam ser executadas **no projeto Supabase**
> (painel ou CLI). Estar commitado no GitHub não cria o banco.

---

## 1. Como aplicar as migrations

### Opção A — Painel Supabase (sem instalar nada)

1. Acesse https://supabase.com/dashboard → seu projeto
   (`ybhiyiobmcoszmvrwkef`).
2. Menu **SQL Editor** → **New query**.
3. Cole o conteúdo de cada arquivo, **na ordem**, e clique **Run**:
   - `0001_profiles.sql`
   - `0002_subscriptions.sql`
   - `0003_payments.sql`
   - `0004_subscription_events.sql`
   - `0005_workouts.sql`
   - `0006_body_measurements.sql`
   - `0007_personal_records.sql`
   - `0008_storage.sql`

   Todas são **idempotentes**: podem rodar mais de uma vez sem erro e **não
   apagam dados existentes**.

### Opção B — Supabase CLI

```bash
supabase login
supabase link --project-ref ybhiyiobmcoszmvrwkef
supabase db push
```

Depois de aplicar, confira no painel: **Table Editor** deve mostrar as 11
tabelas (`profiles`, `app_config`, `subscriptions`, `payments`,
`subscription_events`, `workouts`, `exercises`, `workout_exercises`,
`workout_sets`, `body_measurements`, `personal_records`).

---

## 2. Autenticação (Google)

Já habilitada no seu projeto. O fluxo:

1. Usuário clica **"Entrar com Google"** → `signInWithGoogle()` (em
   `src/services/supabase/client.ts`).
2. O Supabase cria o usuário em `auth.users`.
3. O trigger `handle_new_user` (migration 0001) cria a linha em `profiles`
   automaticamente (nome/e-mail/foto vindos do Google).

> Nenhuma senha é armazenada no banco — tudo é do Supabase Auth.

---

## 3. Conectar o app (.env)

Copie `.env.example` para `.env` e preencha:

```bash
VITE_SUPABASE_URL=https://ybhiyiobmcoszmvrwkef.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...           # Settings → API → anon public
VITE_OWNER_EMAILS=juliocesa219853@gmail.com
```

A **chave anônima é pública por design** — a segurança dos dados vem do RLS,
não da chave. Nunca use a `service_role` no frontend.

Sem `.env`, o app continua funcionando 100% offline como antes (`getSupabase()`
retorna `null` e tudo é ignorado).

---

## 4. Estrutura criada

| Tabela | Finalidade | RLS |
|---|---|---|
| `profiles` | Perfil 1:1 com `auth.users` | só o dono |
| `subscriptions` | Assinatura atual (status, período pago) | só o dono (escrita via service_role/webhook) |
| `payments` | Histórico de pagamentos (nunca é apagado) | só o dono |
| `subscription_events` | Auditoria de webhooks (payload original JSONB) | só o dono |
| `app_config` | Config pública do produto (`owner_emails`) | autenticado |
| `workouts` | Treinos | só o dono |
| `exercises` | Catálogo (padrão global + personalizados) | padrão: leitura global; personalizado: criador |
| `workout_exercises` | Exercícios do treino (RLS via treino pai) | dono do treino |
| `workout_sets` | Séries (RLS via treino → exercício) | dono do treino |
| `body_measurements` | Medidas corporais | só o dono |
| `personal_records` | Recordes (preparado; cálculo em fase futura) | só o dono |

**Storage:**
- `avatars` — público para leitura (foto de perfil nos cards), escrita só do
  dono (pasta `<user_id>/`).
- `workout-photos` — privado, só o dono.

**Regras RLS:** todas as policies usam `auth.uid()`. Não existe policy
permissiva. `workout_exercises`/`workout_sets` não repetem `user_id` — o dono é
derivado do treino pai via subquery.

---

## 5. Como o sistema decide se o usuário TEM acesso

**Fonte de verdade:** `status` + `current_period_end` (fim do período já pago)
comparados dinamicamente com a data atual. **Nunca** um número fixo de dias
salvo, **nunca** um campo manual `is_premium`.

Lógica em `src/utils/subscription.ts` (funções puras, testadas):

| Situação | Tem acesso? |
|---|---|
| `status = lifetime` ou `current_period_end = NULL` (dono) | ✅ sempre |
| `active` / `trial` / `past_due` e período não passou | ✅ |
| `canceled` e `current_period_end` no futuro | ✅ **até a data** (período já pago) |
| `canceled` e `current_period_end` passou | ❌ expirado |
| `pending` sem outro período válido | ❌ |
| `expired` / status desconhecido | ❌ |

- **Cancelou hoje?** `cancel_at_period_end = true` (ou status `canceled`):
  acesso mantido até `current_period_end`. Ex.: cancelou em 14/08 com fim em
  15/09 → acesso até 15/09 (32 dias restantes).
- **Dias restantes** = `ceil((current_period_end − agora) / dia)`, recalculado a
  cada consulta — nunca desatualiza.
- **Dono sem pagar:** e-mail em `app_config.owner_emails` (e
  `VITE_OWNER_EMAILS` no app) → acesso total. O app usa `hasPlatformAccess()`.

Exemplos exibidos na UI:

```
Plano ativo
Próxima renovação: 15/09/2026
Faltam 32 dias para a renovação.
```

```
Assinatura cancelada
Acesso disponível até 15/09/2026
Faltam 32 dias para o encerramento do acesso.
```

---

## 6. Webhooks (preparado, sem integração ainda)

A tabela `subscription_events` guarda o **payload original** de cada evento
(JSONB) com `external_event_id` único por provedor — o índice
`(provider, external_event_id)` impede processamento duplicado.

Quando a plataforma (Kirvano, GGCheckout etc.) for conectada, o handler deve:

1. Inserir o evento em `subscription_events` (se o `external_event_id` já
   existir → **ignorar**, é duplicado);
2. Atualizar `subscriptions` (status, período, `cancel_at_period_end`);
3. Inserir em `payments` quando `payment_approved`/`payment_failed`;
4. Marcar `processed = true`.

Nada disso é implementado ainda — o banco está pronto.

---

## 7. Sincronização IndexedDB ↔ Supabase

Arquitetura atual (não quebra o offline):

```
Usuário → App → IndexedDB (Dexie) ──com internet──> Supabase
```

- `src/services/supabase/sync.ts` tem `pushWorkout`, `pullWorkouts` e
  `syncAll()` — prontos, tipados e testados.
- O IndexedDB continua sendo a fonte local; o mapa `id-local → id-nuvem` fica
  na tabela `syncMap` (Dexie v3).
- **Nada chama o sync automaticamente ainda** — para ativar, chame `syncAll()`
  quando detectar internet + usuário logado (ex.: botão "Sincronizar" ou um
  `useEffect`). Isso é proposital: só liga a nuvem quando você quiser.

---

## 8. Tipos TypeScript

`src/types/supabase.ts` espelha as migrations (escrito à mão, sem `any`).
Depois de rodar as migrations, gere a versão oficial (substitui o arquivo):

```bash
supabase gen types typescript --project-id ybhiyiobmcoszmvrwkef --schema public > src/types/supabase.ts
```

---

## 9. Testes

```bash
npm test          # inclui subscription, sync, acesso e normalização Kirvano/GGCheckout
npm run typecheck
npm run build
```

Os testes cobrem especialmente a **regra crítica**: cancelar hoje com
`current_period_end` no futuro mantém o acesso até a data; depois dela, expira.

---

## 10. Webhooks Kirvano + GGCheckout (Supabase Edge Functions)

### Arquitetura (processador ÚNICO)

```
Kirvano ─┐                    ┌── Simulador (painel /admin)
         ├─> Webhook → Validação de segurança → Normalização → Idempotência ─> Processador ÚNICO ─> Supabase (assinatura/pagamento/acesso) ─> Log ─> HTTP
GGCheckout┘                    └── Mesmo processador (sem lógica duplicada)
```

### Estrutura

```
supabase/functions/
  _shared/types.ts        formato interno único (NormalizedEvent)
  _shared/normalize.ts    normalização Kirvano/GGCheckout (pura, testada)
  _shared/processor.ts    processador único + concessão/revogação de acesso
  _shared/security.ts     validação de token/secreto (tempo constante)
  _shared/owners.ts       donos (env ∪ app_config.owner_emails)
  webhook-kirvano/index.ts   POST público (verify_jwt = false)
  webhook-ggcheckout/index.ts POST público (verify_jwt = false)
  admin/index.ts          simulador/concessão/revogação/logs (verify_jwt = true + dono)
```

### Deploy (requer CLI com login)

```bash
supabase login
supabase functions deploy webhook-kirvano --no-verify-jwt
supabase functions deploy webhook-ggcheckout --no-verify-jwt
supabase functions deploy admin

# Segredos (NUNCA no código):
supabase secrets set KIRVANO_WEBHOOK_TOKEN=<token da Kirvano>
supabase secrets set GGCHECKOUT_WEBHOOK_SECRET=<secret da GGCheckout>
supabase secrets set OWNER_EMAILS=juliocesa219853@gmail.com,juliotrabalho2004@gmail.com
```

O `config.toml` já define `verify_jwt` por função (webhooks públicos, admin protegido).

### URLs dos webhooks

- Kirvano: `https://ybhiyiobmcoszmvrwkef.supabase.co/functions/v1/webhook-kirvano`
- GGCheckout: `https://ybhiyiobmcoszmvrwkef.supabase.co/functions/v1/webhook-ggcheckout`

### Configuração nas plataformas

**Kirvano** (Integrações → Webhooks):
- URL: `.../webhook-kirvano`
- Token: preencher o mesmo valor de `KIRVANO_WEBHOOK_TOKEN` (enviado no header)
- Eventos: Compra aprovada (recorrente), Assinatura cancelada, Cobrança recusada, Chargeback

**GGCheckout** (Settings → Webhooks):
- URL: `.../webhook-ggcheckout`
- Secret: preencher o mesmo valor de `GGCHECKOUT_WEBHOOK_SECRET` — a GGCheckout envia
  `Authorization: Bearer <secret>` e `x-secret: <secret>` (documentação oficial)
- Eventos: `card.paid`, `card.failed`, `card.refunded`, `pix.*`

### Mapeamento de eventos → estado interno

| Plataforma | Evento | Normalizado | Ação de acesso |
|---|---|---|---|
| Kirvano | `SALE_APPROVED` (RECURRING) | `subscription_activated` | conceder (período de `plan.next_charge_date`) |
| Kirvano | `SALE_APPROVED` (ONE_TIME) | `payment_approved` | conceder |
| Kirvano | `SUBSCRIPTION_CANCELED` | `subscription_canceled` | cancelar (válido até fim do período) |
| Kirvano | `SALE_REFUSED` | `payment_failed` | nenhuma (não revoga acesso existente) |
| Kirvano | `SALE_CHARGEBACK` | `chargeback` | revogar |
| GGCheckout | `card.paid` / `pix.paid` | `payment_approved` | conceder |
| GGCheckout | `card.failed` / `pix.failed` / `*.expired` | `payment_failed` | nenhuma |
| GGCheckout | `card.refunded` / `pix.refunded` | `refund_created` | revogar |
| GGCheckout | `payment.status = charged_back` | `chargeback` | revogar |

### Idempotência

Índice único `(provider, external_event_id)` em `subscription_events`: o mesmo evento
reenviado pela plataforma é ignorado (`status: duplicate`).

### Teste manual (curl)

```bash
# Webhook válido GGCheckout (com secret)
curl -X POST https://ybhiyiobmcoszmvrwkef.supabase.co/functions/v1/webhook-ggcheckout \
  -H "Content-Type: application/json" -H "Authorization: Bearer SEU_SECRET" \
  -d '{"event":"card.paid","customer":{"email":"aluno@exemplo.com"},"payment":{"id":"p1","status":"paid","amount":49},"product":{"title":"RepFit"}}'

# Webhook INVALIDO (sem secret) → 401
curl -X POST https://ybhiyiobmcoszmvrwkef.supabase.co/functions/v1/webhook-ggcheckout \
  -H "Content-Type: application/json" -d '{"event":"card.paid","customer":{"email":"aluno@exemplo.com"}}'
```

O painel `/admin` (somente donos) tem o simulador que dispara o MESMO processador.

---

## 11. Acesso gratuito manual (`access_grants`)

Migration 0009 cria `access_grants` — concedido pelo admin no painel (origem
`manual/free`), com `access_until` calculado (5 min a 365 dias) e revogável.
Separação total da assinatura paga: um usuário com assinatura ativa + acesso
gratuito continua com os dados da assinatura intactos.

A decisão de acesso é centralizada em `hasActiveAccess` (src/utils/subscription.ts):

1. e-mail de DONO (juliocesa219853@gmail.com / juliotrabalho2004@gmail.com) → acesso;
2. assinatura paga válida (status + `current_period_end`);
3. concessão ativa (`access_grants` dentro do prazo e não revogada).
