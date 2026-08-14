-- ============================================================================
-- RepFit — Migration 0002: subscriptions + app_config (acesso vitalício do dono)
-- ----------------------------------------------------------------------------
-- Assinatura do usuário, flexível para receber eventos de plataformas de
-- pagamento (Kirvano, GGCheckout, Stripe etc.) via Webhook.
--
-- Regra central de acesso (aplicada também no app — src/utils/subscription.ts):
--   * NUNCA armazenar "dias restantes" fixos — calculados dinamicamente a
--     partir de current_period_end.
--   * current_period_end NULL = período vitalício (nunca expira). É assim que
--     o dono (juliocesa219853@gmail.com) tem acesso total sem pagar.
--   * cancel_at_period_end = true → cancelado, mas continua válido até o fim
--     do período já pago.
-- ============================================================================

create table if not exists public.subscriptions (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid not null references public.profiles (id) on delete cascade,
  provider                  text,                                   -- ex.: 'kirvano', 'ggcheckout', 'stripe'
  external_customer_id      text,                                   -- id do cliente na plataforma
  external_subscription_id  text,                                   -- id da assinatura na plataforma
  plan_name                 text,                                   -- ex.: 'RepFit Pro'
  plan_id                   text,                                   -- id do plano na plataforma
  status                    text not null default 'pending',
  amount                    numeric(10, 2),                         -- valor do período
  currency                  text not null default 'BRL',
  started_at                timestamptz,
  current_period_start      timestamptz,
  current_period_end        timestamptz,                            -- NULL = vitalício (nunca expira)
  canceled_at               timestamptz,
  cancel_at_period_end      boolean not null default false,         -- true = cancelada, válida até o fim do período
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  constraint subscriptions_status_check check (
    status in ('active', 'trial', 'past_due', 'canceled', 'expired', 'pending', 'lifetime')
  ),
  constraint subscriptions_period_check check (
    current_period_end is null
    or current_period_start is null
    or current_period_end >= current_period_start
  )
);

comment on table public.subscriptions is
  'Assinatura do usuário. Fonte de verdade do acesso: status + current_period_end.';
comment on column public.subscriptions.status is
  'active | trial | past_due | canceled | expired | pending | lifetime. lifetime = acesso vitalício (dono).';
comment on column public.subscriptions.current_period_end is
  'Fim do período já pago. NULL = vitalício. Acesso é calculado dinamicamente comparando com now().';
comment on column public.subscriptions.cancel_at_period_end is
  'true = cancelada: continua válida até current_period_end e não renova.';

-- ---------------------------------------------------------------------------
-- Configuração global do app (lida pelo cliente autenticado)
-- ---------------------------------------------------------------------------
-- owner_emails: lista de e-mails com acesso total sem assinatura (ex.: o dono).
-- Não é dado privado de usuário — é configuração pública do produto.
create table if not exists public.app_config (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.app_config (key, value)
values ('owner_emails', '["juliocesa219853@gmail.com"]'::jsonb)
on conflict (key) do nothing;

comment on table public.app_config is
  'Configuração global do produto (não contém dados privados de usuário).';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.subscriptions enable row level security;
alter table public.app_config enable row level security;

-- O usuário lê a PRÓPRIA assinatura. Escritas (webhook/cancelamento) são feitas
-- com a chave service_role, que ignora RLS — nunca por policy aberta.
drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "subscriptions_insert_own" on public.subscriptions;
create policy "subscriptions_insert_own"
  on public.subscriptions for insert
  with check (auth.uid() = user_id);

-- app_config: legível por qualquer usuário autenticado (é config pública).
drop policy if exists "app_config_select_authenticated" on public.app_config;
create policy "app_config_select_authenticated"
  on public.app_config for select
  using (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------------
create index if not exists subscriptions_user_id_idx
  on public.subscriptions (user_id);

-- Trigger de updated_at
drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();
