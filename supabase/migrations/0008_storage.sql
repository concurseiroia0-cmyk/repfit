-- ============================================================================
-- RepFit — Migration 0008: Storage
-- ----------------------------------------------------------------------------
-- Buckets:
--   * avatars        — público para LEITURA (foto do perfil aparece nos cards
--                      de compartilhamento); escrita só do dono.
--   * workout-photos — privado: somente o dono lê/escreve.
--
-- Convenção de pastas: <user_id>/<arquivo> — o RLS usa o primeiro nível da
-- pasta para isolar cada usuário (auth.uid()).
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('workout-photos', 'workout-photos', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- avatars: leitura pública (qualquer um), escrita apenas do dono.
-- ---------------------------------------------------------------------------
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_owner_insert" on storage.objects;
create policy "avatars_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- workout-photos: privado, somente o dono.
-- ---------------------------------------------------------------------------
drop policy if exists "workout_photos_owner_read" on storage.objects;
create policy "workout_photos_owner_read"
  on storage.objects for select
  using (
    bucket_id = 'workout-photos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "workout_photos_owner_insert" on storage.objects;
create policy "workout_photos_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'workout-photos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "workout_photos_owner_update" on storage.objects;
create policy "workout_photos_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'workout-photos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "workout_photos_owner_delete" on storage.objects;
create policy "workout_photos_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'workout-photos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
