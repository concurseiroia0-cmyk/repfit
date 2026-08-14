-- ============================================================================
-- RepFit — Migration 0005: workouts / exercises / workout_exercises / workout_sets
-- ----------------------------------------------------------------------------
-- Modelo de treino (espelha o IndexedDB local para a sincronização na nuvem):
--   workouts → workout_exercises → workout_sets
-- RLS de workout_exercises/workout_sets deriva do DONO do treino pai
-- (subquery em workouts), sem coluna user_id duplicada.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- workouts
-- ---------------------------------------------------------------------------
create table if not exists public.workouts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  name              text not null,
  type              text,                                       -- tipo do treino (ex.: 'Push', 'Full Body')
  workout_date      date not null,                              -- data local YYYY-MM-DD (como no app)
  started_at        timestamptz,
  finished_at       timestamptz,
  duration_seconds  integer,
  notes             text,
  effort_level      integer check (effort_level between 1 and 6), -- 1 = mais difícil, 6 = mais fácil
  mode              text,                                       -- 'academia' | 'calistenia' (app atual)
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on column public.workouts.mode is
  'Modalidade do treino: academia | calistenia (espelha o campo do app).';

-- ---------------------------------------------------------------------------
-- exercises (catálogo compartilhado + personalizados futuros)
-- ---------------------------------------------------------------------------
create table if not exists public.exercises (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  muscle_group  text,
  category      text,
  created_by    uuid references public.profiles (id) on delete set null, -- NULL = exercício padrão (global)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.exercises is
  'Catálogo de exercícios. created_by NULL = padrão/global; preenchido = personalizado.';

-- ---------------------------------------------------------------------------
-- workout_exercises
-- ---------------------------------------------------------------------------
create table if not exists public.workout_exercises (
  id             uuid primary key default gen_random_uuid(),
  workout_id     uuid not null references public.workouts (id) on delete cascade,
  exercise_id    uuid references public.exercises (id) on delete set null,
  exercise_name  text not null,                                 -- snapshot do nome (histórico sobrevive ao catálogo)
  order_index    integer not null default 0,
  notes          text,
  effort_level   integer check (effort_level between 1 and 6),
  created_at     timestamptz not null default now()
);

comment on column public.workout_exercises.exercise_name is
  'Nome do exercício no momento do treino (denormalizado de propósito: preserva o histórico mesmo se o catálogo mudar).';

-- ---------------------------------------------------------------------------
-- workout_sets
-- ---------------------------------------------------------------------------
create table if not exists public.workout_sets (
  id                   uuid primary key default gen_random_uuid(),
  workout_exercise_id  uuid not null references public.workout_exercises (id) on delete cascade,
  set_number           integer not null,
  repetitions          integer,
  weight               numeric(8, 2),
  weight_unit          text not null default 'kg' check (weight_unit in ('kg', 'lb')),
  duration_seconds     integer,                                 -- séries cronometradas (ex.: prancha)
  distance             numeric(8, 2),                           -- séries de distância (ex.: corrida)
  rest_seconds         integer,                                 -- descanso real após a série
  effort_level         integer check (effort_level between 1 and 6),
  completed            boolean not null default true,
  notes                text,
  created_at           timestamptz not null default now(),
  constraint workout_sets_set_number_check check (set_number >= 1)
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.workouts enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_sets enable row level security;

-- workouts: somente o dono.
drop policy if exists "workouts_select_own" on public.workouts;
create policy "workouts_select_own"
  on public.workouts for select
  using (auth.uid() = user_id);

drop policy if exists "workouts_insert_own" on public.workouts;
create policy "workouts_insert_own"
  on public.workouts for insert
  with check (auth.uid() = user_id);

drop policy if exists "workouts_update_own" on public.workouts;
create policy "workouts_update_own"
  on public.workouts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "workouts_delete_own" on public.workouts;
create policy "workouts_delete_own"
  on public.workouts for delete
  using (auth.uid() = user_id);

-- exercises: padrões (created_by NULL) são públicos para leitura;
-- personalizados são restritos ao criador. Escrita apenas no próprio.
drop policy if exists "exercises_select_visible" on public.exercises;
create policy "exercises_select_visible"
  on public.exercises for select
  using (created_by is null or created_by = auth.uid());

drop policy if exists "exercises_insert_own" on public.exercises;
create policy "exercises_insert_own"
  on public.exercises for insert
  with check (auth.uid() = created_by);

drop policy if exists "exercises_update_own" on public.exercises;
create policy "exercises_update_own"
  on public.exercises for update
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

drop policy if exists "exercises_delete_own" on public.exercises;
create policy "exercises_delete_own"
  on public.exercises for delete
  using (created_by = auth.uid());

-- workout_exercises: dono via treino pai.
drop policy if exists "workout_exercises_select_own" on public.workout_exercises;
create policy "workout_exercises_select_own"
  on public.workout_exercises for select
  using (exists (
    select 1 from public.workouts w
    where w.id = workout_id and w.user_id = auth.uid()
  ));

drop policy if exists "workout_exercises_insert_own" on public.workout_exercises;
create policy "workout_exercises_insert_own"
  on public.workout_exercises for insert
  with check (exists (
    select 1 from public.workouts w
    where w.id = workout_id and w.user_id = auth.uid()
  ));

drop policy if exists "workout_exercises_update_own" on public.workout_exercises;
create policy "workout_exercises_update_own"
  on public.workout_exercises for update
  using (exists (
    select 1 from public.workouts w
    where w.id = workout_id and w.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.workouts w
    where w.id = workout_id and w.user_id = auth.uid()
  ));

drop policy if exists "workout_exercises_delete_own" on public.workout_exercises;
create policy "workout_exercises_delete_own"
  on public.workout_exercises for delete
  using (exists (
    select 1 from public.workouts w
    where w.id = workout_id and w.user_id = auth.uid()
  ));

-- workout_sets: dono via exercício do treino → treino pai.
drop policy if exists "workout_sets_select_own" on public.workout_sets;
create policy "workout_sets_select_own"
  on public.workout_sets for select
  using (exists (
    select 1 from public.workout_exercises we
    join public.workouts w on w.id = we.workout_id
    where we.id = workout_exercise_id and w.user_id = auth.uid()
  ));

drop policy if exists "workout_sets_insert_own" on public.workout_sets;
create policy "workout_sets_insert_own"
  on public.workout_sets for insert
  with check (exists (
    select 1 from public.workout_exercises we
    join public.workouts w on w.id = we.workout_id
    where we.id = workout_exercise_id and w.user_id = auth.uid()
  ));

drop policy if exists "workout_sets_update_own" on public.workout_sets;
create policy "workout_sets_update_own"
  on public.workout_sets for update
  using (exists (
    select 1 from public.workout_exercises we
    join public.workouts w on w.id = we.workout_id
    where we.id = workout_exercise_id and w.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.workout_exercises we
    join public.workouts w on w.id = we.workout_id
    where we.id = workout_exercise_id and w.user_id = auth.uid()
  ));

drop policy if exists "workout_sets_delete_own" on public.workout_sets;
create policy "workout_sets_delete_own"
  on public.workout_sets for delete
  using (exists (
    select 1 from public.workout_exercises we
    join public.workouts w on w.id = we.workout_id
    where we.id = workout_exercise_id and w.user_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------------
create index if not exists workouts_user_date_idx
  on public.workouts (user_id, workout_date desc);
create index if not exists workouts_user_created_idx
  on public.workouts (user_id, created_at desc);
create index if not exists exercises_name_lower_idx
  on public.exercises (lower(name));
create index if not exists workout_exercises_workout_idx
  on public.workout_exercises (workout_id, order_index);
create index if not exists workout_sets_workout_exercise_idx
  on public.workout_sets (workout_exercise_id, set_number);

-- ---------------------------------------------------------------------------
-- Triggers de updated_at
-- ---------------------------------------------------------------------------
drop trigger if exists workouts_set_updated_at on public.workouts;
create trigger workouts_set_updated_at
  before update on public.workouts
  for each row execute function public.set_updated_at();

drop trigger if exists exercises_set_updated_at on public.exercises;
create trigger exercises_set_updated_at
  before update on public.exercises
  for each row execute function public.set_updated_at();
