# Supabase (ICR Intranet)

## Migration: `end_time` auf `public.events`

Diese Migration fügt die Spalte `end_time` hinzu, die die App beim Event-Anlegen nutzt.

### Option A – Supabase Dashboard (schnell)

1. Projekt **Intranet-Database** öffnen.
2. **SQL Editor** → New query.
3. Inhalt von `migrations/20260222120000_add_events_end_time.sql` einfügen und **Run**.

### Option B – Supabase CLI (lokal)

```bash
# Einmalig: https://supabase.com/docs/guides/cli
brew install supabase/tap/supabase   # macOS

cd web
supabase login
supabase link --project-ref <DEIN_PROJECT_REF>

supabase db push
# oder nur Remote ausführen:
supabase db execute --file supabase/migrations/20260222120000_add_events_end_time.sql
```

`project-ref` steht in der Dashboard-URL: `https://supabase.com/dashboard/project/<project-ref>`.

## Hinweis

Die Datei `sql/add_events_end_time.sql` ist identisch zur Migration; die **kanonische** Version für CLI/Push liegt unter `migrations/`.
