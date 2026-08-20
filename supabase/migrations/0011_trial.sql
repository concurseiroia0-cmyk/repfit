-- ============================================================================
-- RepFit — Migration 0011: Trial de 15 dias grátis
-- ----------------------------------------------------------------------------
-- Adiciona campos de controle de trial na tabela profiles.
-- O trial é armazenado como access_grants com origin = 'trial'.
-- ============================================================================

alter table public.profiles
  add column if not exists trial_activated_at timestamptz,
  add column if not exists trial_expires_at   timestamptz,
  add column if not exists trial_status       text default 'none'
    check (trial_status in ('none', 'active', 'expired', 'converted'));

comment on column public.profiles.trial_activated_at is
  'Data/hora em que o usuario ativou o trial de 15 dias. NULL = nunca ativou.';
comment on column public.profiles.trial_expires_at is
  'Data/hora em que o trial expira. NULL = sem trial.';
comment on column public.profiles.trial_status is
  'none = nunca ativou; active = trial em andamento; expired = trial expirou; converted = virou cliente pago.';

create index if not exists profiles_trial_status_idx
  on public.profiles (trial_status) where trial_status != 'none';

create index if not exists profiles_trial_expires_idx
  on public.profiles (trial_expires_at) where trial_expires_at is not null;

-- Atualizar CHECK constraint de access_grants para aceitar origin = 'trial'
alter table public.access_grants
  drop constraint if exists access_grants_origin_check;

alter table public.access_grants
  add constraint access_grants_origin_check
    check (origin in ('manual/free', 'kirvano', 'ggcheckout', 'trial'));
