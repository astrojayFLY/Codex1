-- Run in a new Supabase project's SQL editor. No credentials belong in this file.
begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  singleton boolean not null default true unique check (singleton = true)
);
alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;
grant select(user_id) on public.admin_users to authenticated;
create policy "read own admin membership" on public.admin_users
  for select to authenticated using (user_id = (select auth.uid()));

create function private.is_admin() returns boolean
language sql stable security definer
set search_path = ''
as $$ select exists(select 1 from public.admin_users where user_id = (select auth.uid())); $$;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  title text not null check (title = btrim(title) and title ~ '[^[:space:]]' and char_length(title) between 1 and 60),
  description text not null check (description = btrim(description) and description ~ '[^[:space:]]' and char_length(description) between 1 and 200),
  url text not null unique check (
    char_length(url) <= 2048 and
    url ~ '^https://[A-Za-z0-9][A-Za-z0-9.-]*(:[0-9]{1,5})?([/?#][^[:space:]]*)?$'
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create function private.touch_program() returns trigger
language plpgsql set search_path = ''
as $$ begin new.updated_at = now(); new.created_at = old.created_at; return new; end; $$;
revoke all on function private.touch_program() from public;
create trigger touch_program before update on public.programs
for each row execute function private.touch_program();

alter table public.programs enable row level security;
revoke all on public.programs from anon, authenticated;
grant select on public.programs to anon, authenticated;
grant insert(title, description, url), update(title, description, url), delete on public.programs to authenticated;
create policy "public programs read" on public.programs for select to anon, authenticated using (true);
create policy "admin programs insert" on public.programs for insert to authenticated with check ((select private.is_admin()));
create policy "admin programs update" on public.programs for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admin programs delete" on public.programs for delete to authenticated using ((select private.is_admin()));
commit;

-- AFTER the chosen Google account signs in, copy its UUID from Authentication > Users.
-- Execute manually as database owner (never in the browser):
-- insert into public.admin_users(user_id) values ('CHOSEN-AUTH-USER-UUID');
-- To revoke immediately: delete from public.admin_users where user_id = 'CHOSEN-AUTH-USER-UUID';
