-- ============================================================================
-- RepFit — Migration 0001: profiles
-- ----------------------------------------------------------------------------
-- Perfil do usuário, vinculado 1:1 ao auth.users (id = auth.users.id).
-- Criado automaticamente por trigger quando o usuário entra pela primeira vez
-- (Google OAuth já habilitado no Supabase). Nenhuma senha é armazenada aqui.
--
-- Idempotente: pode ser executada mais de uma vez sem erro e sem apagar dados.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Trigger utilitário: mantém updated_at atualizado em qualquer UPDATE.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tabela profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  email       text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is
  'Perfil público do usuário. id = auth.users.id. E-mail protegido por RLS (só o dono vê).';

-- ---------------------------------------------------------------------------
-- Trigger: pré-enche o perfil a partir dos metadados do provedor (Google).
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.email,
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger de updated_at
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: cada usuário acessa SOMENTE o próprio perfil.
-- (Nunca o e-mail privado de outro usuário.)
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
