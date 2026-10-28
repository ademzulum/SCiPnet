-- The GMod server as a writer. Run once in the Supabase SQL editor after
-- 004_usernames.sql, then add the server's account (see the end of this file).
--
-- The server logs in with an account of its own. That account is not an
-- admin: it may only
--   - add and change public entries (never closed ones),
--   - hide entries (deleted_at), never remove them,
--   - register characters and keep them up to date.
-- Every change to an entry is copied into entries_history by a trigger, with
-- the character that made it, so anything can be rolled back. Nobody can
-- change that history through the API.

-- ---------------------------------------------------------------- server accounts

create table if not exists public.server_accounts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  note text
);
alter table public.server_accounts enable row level security;
-- no policies: only the SQL editor (and security definer functions) see it

create or replace function public.is_server()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.server_accounts where user_id = auth.uid())
$$;
revoke execute on function public.is_server() from public, anon;
grant execute on function public.is_server() to authenticated;

-- ---------------------------------------------------------------- entries

alter table public.entries add column if not exists deleted_at timestamptz;
-- the character that last changed the entry in game (e.g. john.doe)
alter table public.entries add column if not exists edited_by text;

-- hidden entries are no longer read by anyone
drop policy if exists "entries readable" on public.entries;
create policy "entries readable" on public.entries
  for select to anon, authenticated using (
    deleted_at is null and (
      visibility = 'public'
      or owner = auth.uid()
      or auth.uid() = any (readers)
      or (owner is null and public.is_admin())
    )
  );

drop policy if exists "server inserts public entries" on public.entries;
create policy "server inserts public entries" on public.entries
  for insert to authenticated
  with check (public.is_server() and visibility = 'public' and readers = '{}');

drop policy if exists "server updates public entries" on public.entries;
create policy "server updates public entries" on public.entries
  for update to authenticated
  using (public.is_server() and visibility = 'public')
  with check (public.is_server() and visibility = 'public' and readers = '{}');
-- no delete policy for the server: it hides entries with deleted_at

-- ---------------------------------------------------------------- history

create table if not exists public.entries_history (
  n bigint generated always as identity primary key,
  kind text not null,
  entry_id text not null,
  op text not null,               -- insert, update, delete
  data jsonb,                     -- the entry after the change (before it for delete)
  deleted_at timestamptz,
  changed_by text,                -- character username, or the account id
  changed_at timestamptz not null default now()
);
alter table public.entries_history enable row level security;
drop policy if exists "history readable by admins" on public.entries_history;
create policy "history readable by admins" on public.entries_history
  for select to authenticated using (public.is_admin());
-- no insert/update/delete policies: only the trigger writes here

create or replace function public.entries_log()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  who text := case when public.is_server() then null else auth.uid()::text end;
begin
  if tg_op = 'DELETE' then
    insert into public.entries_history (kind, entry_id, op, data, deleted_at, changed_by)
    values (old.kind, old.id, 'delete', old.data, old.deleted_at, coalesce(who, old.edited_by));
    return old;
  end if;
  insert into public.entries_history (kind, entry_id, op, data, deleted_at, changed_by)
  values (new.kind, new.id, lower(tg_op), new.data, new.deleted_at, coalesce(who, new.edited_by));
  return new;
end;
$$;

drop trigger if exists entries_log on public.entries;
create trigger entries_log after insert or update or delete on public.entries
  for each row execute function public.entries_log();

-- ---------------------------------------------------------------- characters

-- Characters registered at their first login on the terminal. The server
-- keeps job and clearance in step with the gamemode.
create table if not exists public.characters (
  username text primary key,      -- john.doe
  char_id text unique not null,   -- the gamemode's character id
  name text not null,             -- John Doe
  job text,
  clearance int not null default 0 check (clearance between 0 and 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.characters enable row level security;

drop policy if exists "characters readable" on public.characters;
create policy "characters readable" on public.characters
  for select to authenticated using (public.is_server() or public.is_admin());
drop policy if exists "server registers characters" on public.characters;
create policy "server registers characters" on public.characters
  for insert to authenticated with check (public.is_server());
drop policy if exists "server updates characters" on public.characters;
create policy "server updates characters" on public.characters
  for update to authenticated using (public.is_server()) with check (public.is_server());

-- ---------------------------------------------------------------- the server's account
--
-- 1. Supabase dashboard > Authentication > Users > Add user: an e-mail and a
--    long random password (e.g. gmod-server@your-domain), "Auto confirm".
-- 2. Run, with that e-mail:
--      insert into public.server_accounts (user_id, note)
--      select id, 'GMod server' from auth.users where email = 'gmod-server@your-domain';
-- 3. Give the server the login, see gmod/scipnet/lua/scipnet/sh_config.lua.
-- To shut the server out at once: delete its row from server_accounts, or
-- change the password.
