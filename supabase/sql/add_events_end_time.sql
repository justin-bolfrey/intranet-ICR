-- Optional: Endzeit für Events dauerhaft speichern.
-- Im Supabase SQL Editor ausführen (oder als Migration).
-- Danach werden neue Termine mit Endzeit in `end_time` gespeichert
-- (ohne diese Spalte funktioniert das Anlegen trotzdem, Endzeit wird dann nicht persistiert).

alter table public.events
  add column if not exists end_time text;

comment on column public.events.end_time is 'Endzeit des Events (HH:MM), optional';
