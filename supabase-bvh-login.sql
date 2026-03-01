-- Tabelle für BVH-Login-Anfragen (Zeitschriften-Bereich).
-- Im Supabase Dashboard unter SQL Editor ausführen.

create table if not exists public.bvh_login_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vorname text not null default '',
  nachname text not null default '',
  email text not null,
  handled boolean not null default false,
  created_at timestamptz not null default now()
);

-- Index für Abfragen nach Nutzer (Duplikate vermeiden optional)
create index if not exists bvh_login_requests_user_id_idx on public.bvh_login_requests(user_id);
create index if not exists bvh_login_requests_created_at_idx on public.bvh_login_requests(created_at desc);

-- RLS: Einloggte Nutzer dürfen nur eigene Zeilen einfügen.
alter table public.bvh_login_requests enable row level security;

create policy "Users can insert own bvh request"
  on public.bvh_login_requests
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Admin/Vorstand: Lesen und Aktualisieren über Service Role (umgeht RLS) oder eigene Policy:
create policy "Admins can read all bvh requests"
  on public.bvh_login_requests
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.user_id = auth.uid()
      and lower(trim(profiles."Rolle")) in ('admin', 'board')
    )
  );

create policy "Admins can update bvh requests"
  on public.bvh_login_requests
  for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.user_id = auth.uid()
      and lower(trim(profiles."Rolle")) in ('admin', 'board')
    )
  );
