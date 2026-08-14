-- ============================================================================
-- RepFit — Migration 0003: payments
-- ----------------------------------------------------------------------------
-- Histórico de pagamentos. NUNCA é apagado quando a assinatura é cancelada:
-- subscription_id usa ON DELETE SET NULL justamente para preservar o histórico.
-- ============================================================================

create table if not exists public.payments (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.profiles (id) on delete cascade,
  subscription_id      uuid references public.subscriptions (id) on delete set null,
  provider             text,                                   -- plataforma de origem
  external_payment_id  text,                                   -- id do pagamento na plataforma
  amount               numeric(10, 2) not null,
  currency             text not null default 'BRL',
  status               text not null default 'pending',
  payment_method       text,                                   -- ex.: 'pix', 'credit_card', 'boleto'
  paid_at              timestamptz,                            -- quando o pagamento foi confirmado
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint payments_status_check check (
    status in ('pending', 'paid', 'failed', 'refunded', 'canceled')
  )
);

comment on table public.payments is
  'Histórico de pagamentos. Preservado mesmo após cancelamento/expiração da assinatura.';
comment on column public.payments.subscription_id is
  'ON DELETE SET NULL: se a assinatura sumir, o pagamento (auditoria) permanece.';

-- ---------------------------------------------------------------------------
-- RLS: o usuário lê apenas os PRÓPRIOS pagamentos.
-- ---------------------------------------------------------------------------
alter table public.payments enable row level security;

drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own"
  on public.payments for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------------
create index if not exists payments_user_id_idx
  on public.payments (user_id);
create index if not exists payments_user_paid_at_idx
  on public.payments (user_id, paid_at desc);
create index if not exists payments_subscription_id_idx
  on public.payments (subscription_id);

-- Trigger de updated_at
drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();
