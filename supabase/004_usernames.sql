-- Accounts by name instead of e-mail. Run once in the Supabase SQL editor after 003_access.sql.
--
-- Supabase logs in with an e-mail address, so a name-only account gets the
-- address <name>@scipnet.local (it never receives mail; create it under
-- Authentication > Users with "Auto Confirm User"). The site turns a
-- name without @ into that address. The account list shows the display name
-- from the user's metadata, else the part before the @.

drop function if exists public.list_accounts();
create function public.list_accounts()
returns table (id uuid, name text)
language sql stable security definer set search_path = ''
as $$
  select u.id,
         coalesce(u.raw_user_meta_data ->> 'display_name', u.raw_user_meta_data ->> 'username', split_part(u.email::text, '@', 1))
  from auth.users u where public.is_admin() order by 2
$$;
revoke execute on function public.list_accounts() from public, anon;
grant execute on function public.list_accounts() to authenticated;
