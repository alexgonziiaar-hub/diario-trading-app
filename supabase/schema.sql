-- Esquema de la base de datos de la app (Supabase / Postgres).
-- Se puede volver a ejecutar: crea o actualiza sin borrar datos.

create extension if not exists citext;

-- ---------------------------------------------------------------
-- Emails autorizados (los valida el mentor a mano desde la app)
-- ---------------------------------------------------------------
create table if not exists public.allowed_emails (
  email citext primary key,
  name text,
  role text not null default 'alumno' check (role in ('alumno', 'mentor')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.allowed_emails enable row level security;

-- ¿El usuario conectado tiene acceso?
create or replace function public.is_allowed()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.allowed_emails
    where email = (auth.jwt() ->> 'email')::citext and active
  );
$$;

-- ¿El usuario conectado es mentor?
create or replace function public.is_mentor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.allowed_emails
    where email = (auth.jwt() ->> 'email')::citext and active and role = 'mentor'
  );
$$;

-- Comprobación antes de enviar el código (sin sesión todavía)
create or replace function public.email_autorizado(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.allowed_emails
    where email = lower(trim(p_email))::citext and active
  );
$$;

revoke all on function public.is_allowed() from public;
revoke all on function public.is_mentor() from public;
revoke all on function public.email_autorizado(text) from public;
grant execute on function public.is_allowed() to authenticated;
grant execute on function public.is_mentor() to authenticated;
grant execute on function public.email_autorizado(text) to anon, authenticated;

drop policy if exists "mentor gestiona los accesos" on public.allowed_emails;
create policy "mentor gestiona los accesos" on public.allowed_emails
  for all to authenticated
  using (public.is_mentor())
  with check (public.is_mentor());

drop policy if exists "cada usuario ve su acceso" on public.allowed_emails;
create policy "cada usuario ve su acceso" on public.allowed_emails
  for select to authenticated
  using (email = (auth.jwt() ->> 'email')::citext);

grant select, insert, update, delete on public.allowed_emails to authenticated;

-- ---------------------------------------------------------------
-- Datos de cada alumno (diario, tests, apuntes, plan, preferencias)
-- ---------------------------------------------------------------
create table if not exists public.user_data (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

drop policy if exists "cada alumno gestiona sus datos" on public.user_data;
create policy "cada alumno gestiona sus datos" on public.user_data
  for all to authenticated
  using (user_id = auth.uid() and public.is_allowed())
  with check (user_id = auth.uid() and public.is_allowed());

grant select, insert, update, delete on public.user_data to authenticated;

-- ---------------------------------------------------------------
-- Solo se pueden crear cuentas con emails autorizados
-- (función que Supabase Auth llama antes de crear un usuario)
-- ---------------------------------------------------------------
create or replace function public.hook_before_user_created(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  e text := lower(event -> 'user' ->> 'email');
begin
  if exists (select 1 from public.allowed_emails where email = e::citext and active) then
    return '{}'::jsonb;
  end if;
  return jsonb_build_object(
    'error', jsonb_build_object('http_code', 403, 'message', 'Este email no está autorizado. Escribe a tu mentor.')
  );
end;
$$;

revoke all on function public.hook_before_user_created(jsonb) from public, anon, authenticated;
grant execute on function public.hook_before_user_created(jsonb) to supabase_auth_admin;
grant usage on schema public to supabase_auth_admin;
