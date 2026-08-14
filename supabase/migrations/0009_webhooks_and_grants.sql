-- ============================================================================
-- RepFit — Migration 0009: webhooks (Kirvano/GGCheckout) + acesso gratuito manual
-- ----------------------------------------------------------------------------
-- 1. access_grants: acesso concedido manualmente (origem 'manual/free'),
--    separado da assinatura paga — NUNCA sobrescreve a assinatura real.
-- 2. subscription_events: colunas de auditoria (email, produto, plano, erro,
--    status do processamento).
-- 3. subscriptions: novos estados (refunded, chargeback) no CHECK.
-- 4. app_config.owner_emails: dois e-mails de dono (acesso total e admin).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. access_grants
-- ---------------------------------------------------------------------------
create table if not exists public.access_grants (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  email             text not null,
  plan_name         text,
  origin            text not null default 'manual/free' check (origin in ('manual/free', 'kirvano', 'ggcheckout')),
  duration_minutes  integer,                            -- duração concedida (null = indefinida)
  access_until      timestamptz not null,               -- acesso válido até aqui (null nunca — sempra tem data)
  status            text not null default 'active' check (status in ('active', 'revoked', 'expired')),
  granted_by        text,                               -- e-mail do administrador
  granted_at        timestamptz not null default now(),
  revoked_at        timestamptz,
  revoked_by        text,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint access_grants_period_check check (access_until > granted_at)
);

comment on table public.access_grants is
  'Acesso concedido manualmente (cortesia/teste) — separado da assinatura paga.';
comment on column public.access_grants.origin is
  'manual/free = concedido pelo admin; kirvano/ggcheckout = criado por webhook.';
comment on column public.access_grants.status is
  'active = válido enquanto access_until não passar; revoked = revogado manualmente.';

-- RLS: o usuário vê os PRÓPRIOS acessos (necessário para hasActiveAccess no app);
-- escrita apenas via service_role (função admin/edge function).
alter table public.access_grants enable row level security;

drop policy if exists "access_grants_select_own" on public.access_grants;
create policy "access_grants_select_own"
  on public.access_grants for select
  using (auth.uid() = user_id);

create index if not exists access_grants_user_until_idx
  on public.access_grants (user_id, access_until desc);
create index if not exists access_grants_email_idx
  on public.access_grants (lower(email));

drop trigger if exists access_grants_set_updated_at on public.access_grants;
create trigger access_grants_set_updated_at
  before update on public.access_grants
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. subscription_events — auditoria completa
-- ---------------------------------------------------------------------------
alter table public.subscription_events
  add column if not exists email text,
  add column if not exists product text,
  add column if not exists plan text,
  add column if not exists error text,
  add column if not exists normalized_event_type text,
  add column if not exists processing_status text not null default 'received';

comment on column public.subscription_events.processing_status is
  'received | processed | failed | invalid | no-user | duplicate | unknown';

create index if not exists subscription_events_created_idx
  on public.subscription_events (created_at desc);

-- ---------------------------------------------------------------------------
-- 3. subscriptions — novos estados de perda de acesso
-- ---------------------------------------------------------------------------
alter table public.subscriptions drop constraint if exists subscriptions_status_check;
alter table public.subscriptions add constraint subscriptions_status_check check (
  status in ('active', 'trial', 'past_due', 'canceled', 'expired', 'pending', 'lifetime', 'refunded', 'chargeback')
);

-- ---------------------------------------------------------------------------
-- 4. Donos com acesso total (sem assinatura) e acesso ao painel admin
-- ---------------------------------------------------------------------------
update public.app_config
set value = '["juliocesa219853@gmail.com", "juliotrabalho2004@gmail.com"]'::jsonb,
    updated_at = now()
where key = 'owner_emails';
