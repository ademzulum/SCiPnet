-- SCiPnet database. Run once in the Supabase SQL editor, then seed.sql.
--
-- Every entry (SCP object, personnel file, field report, Mobile Task Force,
-- Group of Interest) is one row: its kind, its id and the entry itself as JSON
-- in the shape of the types in src/data/*.ts.
--
-- Access: anyone may read. Only a logged-in user whose app_metadata carries
-- role = admin may insert, update or delete. app_metadata can only be set by
-- the project owner (dashboard or SQL), never by the user, so the role can't
-- be forged from the browser.

create table if not exists public.entries (
  kind text not null check (kind in ('scp', 'personnel', 'report', 'mtf', 'goi')),
  id text not null check (length(id) between 1 and 64),
  position integer not null default 0,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (kind, id)
);

alter table public.entries enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
$$;

drop policy if exists "entries are public" on public.entries;
create policy "entries are public" on public.entries
  for select to anon, authenticated using (true);

drop policy if exists "admin inserts" on public.entries;
create policy "admin inserts" on public.entries
  for insert to authenticated with check (public.is_admin());

drop policy if exists "admin updates" on public.entries;
create policy "admin updates" on public.entries
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin deletes" on public.entries;
create policy "admin deletes" on public.entries
  for delete to authenticated using (public.is_admin());

create or replace function public.touch_entries() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists entries_touch on public.entries;
create trigger entries_touch before update on public.entries
  for each row execute function public.touch_entries();

-- Uploaded pictures (portraits, report images, insignias): public to read,
-- only the admin may upload, replace or delete. 5 MB per file, images only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('images', 'images', true, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
on conflict (id) do nothing;

drop policy if exists "admin uploads" on storage.objects;
create policy "admin uploads" on storage.objects
  for insert to authenticated with check (bucket_id = 'images' and public.is_admin());

drop policy if exists "admin replaces" on storage.objects;
create policy "admin replaces" on storage.objects
  for update to authenticated using (bucket_id = 'images' and public.is_admin());

drop policy if exists "admin removes" on storage.objects;
create policy "admin removes" on storage.objects
  for delete to authenticated using (bucket_id = 'images' and public.is_admin());

-- Give your account the admin role (replace the address, run once):
-- update auth.users
--   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}') || '{"role": "admin"}'
--   where email = 'you@example.com';
