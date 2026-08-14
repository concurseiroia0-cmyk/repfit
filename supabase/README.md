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
npm test          # inclui subscription.test.ts e sync.test.ts
npm run typecheck
npm run build
```

Os testes cobrem especialmente a **regra crítica**: cancelar hoje com
`current_period_end` no futuro mantém o acesso até a data; depois dela, expira.
