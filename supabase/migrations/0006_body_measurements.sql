-- ============================================================================
-- RepFit — Migration 0006: body_measurements
-- ----------------------------------------------------------------------------
-- Evolução corporal ao longo do tempo. Todas as medidas são opcionais;
-- apenas user_id e measured_at são obrigatórios.
-- ============================================================================

create table if not exists public.body_measurements (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.profiles (id) on delete cascade,
  measured_at          timestamptz not null default now(),
  weight               numeric(8, 2),        -- kg
  body_fat_percentage  numeric(5, 2),        -- %
  chest                numeric(8, 2),        -- cm
  waist                numeric(8, 2),        -- cm
  arm                  numeric(8, 2),        -- cm
  thigh                numeric(8, 2),        -- cm
  calf                 numeric(8, 2),        -- cm
  notes                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

comment on table public.body_measurements is
  'Medidas corporais (todas opcionais exceto user_id e measured_at).';

-- ---------------------------------------------------------------------------
-- RLS: somente o dono.
-- ---------------------------------------------------------------------------
alter table public.body_measurements enable row level security;

drop policy if exists "body_measurements_select_own" on public.body_measurements;
create policy "body_measurements_select_own"
  on public.body_measurements for select
  using (auth.uid() = user_id);

drop policy if exists "body_measurements_insert_own" on public.body_measurements;
create policy "body_measurements_insert_own"
  on public.body_measurements for insert
  with check (auth.uid() = user_id);

drop policy if exists "body_measurements_update_own" on public.body_measurements;
create policy "body_measurements_update_own"
  on public.body_measurements for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "body_measurements_delete_own" on public.body_measurements;
create policy "body_measurements_delete_own"
  on public.body_measurements for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------------
create index if not exists body_measurements_user_date_idx
  on public.body_measurements (user_id, measured_at desc);

-- Trigger de updated_at
drop trigger if exists body_measurements_set_updated_at on public.body_measurements;
create trigger body_measurements_set_updated_at
  before update on public.body_measurements
  for each row execute function public.set_updated_at();
