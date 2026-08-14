-- ============================================================================
-- RepFit — Migration 0007: personal_records
-- ----------------------------------------------------------------------------
-- Recordes pessoais. O banco fica preparado; a lógica automática de cálculo
-- (max_weight / max_reps / max_volume) será implementada numa fase futura.
-- ============================================================================

create table if not exists public.personal_records (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  exercise_id   uuid references public.exercises (id) on delete cascade,
  record_type   text not null,
  value         numeric(12, 2) not null,
  repetitions   integer,
  weight        numeric(8, 2),
  workout_id    uuid references public.workouts (id) on delete cascade,
  achieved_at   timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  constraint personal_records_type_check check (
    record_type in ('max_weight', 'max_reps', 'max_volume')
  )
);

comment on table public.personal_records is
  'Recordes pessoais (max_weight, max_reps, max_volume). Cálculo automático em fase futura.';

-- ---------------------------------------------------------------------------
-- RLS: somente o dono.
-- ---------------------------------------------------------------------------
alter table public.personal_records enable row level security;

drop policy if exists "personal_records_select_own" on public.personal_records;
create policy "personal_records_select_own"
  on public.personal_records for select
  using (auth.uid() = user_id);

drop policy if exists "personal_records_insert_own" on public.personal_records;
create policy "personal_records_insert_own"
  on public.personal_records for insert
  with check (auth.uid() = user_id);

drop policy if exists "personal_records_update_own" on public.personal_records;
create policy "personal_records_update_own"
  on public.personal_records for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "personal_records_delete_own" on public.personal_records;
create policy "personal_records_delete_own"
  on public.personal_records for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------------
create index if not exists personal_records_user_exercise_idx
  on public.personal_records (user_id, exercise_id);
create index if not exists personal_records_user_type_idx
  on public.personal_records (user_id, record_type);
