-- Access per entry. Run once in the Supabase SQL editor after 002_messages.sql.
--
-- visibility: 'public'  everyone may read (clearance levels are then checked by the site)
--             'closed'  only the account that created the entry
--             'readers' the creator and the accounts listed in readers
-- Closed entries are filtered by the database itself: they never reach a
-- browser that isn't allowed to see them.

alter table public.entries add column if not exists visibility text not null default 'public'
  check (visibility in ('public', 'closed', 'readers'));
alter table public.entries add column if not exists owner uuid default auth.uid()
  references auth.users (id) on delete set null;
alter table public.entries add column if not exists readers uuid[] not null default '{}';

drop policy if exists "entries are public" on public.entries;
drop policy if exists "entries readable" on public.entries;
create policy "entries readable" on public.entries
  for select to anon, authenticated using (
    visibility = 'public'
    or owner = auth.uid()
    or auth.uid() = any (readers)
    -- entries from before this change have no owner: any admin keeps them
    or (owner is null and public.is_admin())
  );

-- Accounts that can be picked as readers (admins only; e-mail for the list).
create or replace function public.list_accounts()
returns table (id uuid, email text)
language sql stable security definer set search_path = ''
as $$
  select u.id, u.email::text from auth.users u where public.is_admin() order by u.email
$$;
revoke execute on function public.list_accounts() from public, anon;
grant execute on function public.list_accounts() to authenticated;
