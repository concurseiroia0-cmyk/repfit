-- ============================================================================
-- RepFit — Migration 0004: subscription_events
-- ----------------------------------------------------------------------------
-- Registro bruto dos eventos recebidos das plataformas de pagamento (Webhooks).
-- O payload original é guardado em JSONB para auditoria e diagnóstico.
--
-- A restrição única (provider, external_event_id) impede o processamento
-- duplicado do mesmo evento (idempotência de webhook). Como o Postgres permite
-- múltiplos NULLs em índices únicos, eventos sem external_event_id não colidem.
-- ============================================================================

create table if not exists public.subscription_events (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references public.profiles (id) on delete cascade,   -- opcional (nem todo evento tem usuário)
  subscription_id     uuid references public.subscriptions (id) on delete cascade, -- opcional
  provider            text,                                   -- ex.: 'kirvano', 'ggcheckout', 'stripe'
  event_type          text not null,                          -- ex.: 'subscription_created', 'payment_approved'...
  external_event_id   text,                                   -- id do evento na plataforma (dedup)
  payload             jsonb not null default '{}'::jsonb,     -- corpo ORIGINAL do webhook
  processed           boolean not null default false,         -- consumido pelo app?
  processed_at        timestamptz,
  created_at          timestamptz not null default now()
);

comment on table public.subscription_events is
  'Auditoria de webhooks. payload = corpo original recebido da plataforma de pagamento.';
comment on column public.subscription_events.processed is
  'false = evento novo aguardando processamento (worker/webhook handler).';

-- Idempotência: mesmo (provider, external_event_id) só pode existir uma vez.
create unique index if not exists subscription_events_provider_event_uidx
  on public.subscription_events (provider, external_event_id);

-- ---------------------------------------------------------------------------
-- RLS: o usuário vê apenas eventos do próprio user_id.
-- (Escritas são feitas pela service_role via webhook — sem policy de escrita.)
-- ---------------------------------------------------------------------------
alter table public.subscription_events enable row level security;

drop policy if exists "subscription_events_select_own" on public.subscription_events;
create policy "subscription_events_select_own"
  on public.subscription_events for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------------
create index if not exists subscription_events_user_id_idx
  on public.subscription_events (user_id);
create index if not exists subscription_events_subscription_id_idx
  on public.subscription_events (subscription_id);
create index if not exists subscription_events_processed_idx
  on public.subscription_events (processed, created_at);
