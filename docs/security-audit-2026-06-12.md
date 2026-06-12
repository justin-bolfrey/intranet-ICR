# Sicherheits- & Code-Audit – ICR Intranet (web)

**Datum:** 2026-06-12
**Umfang:** Auth-/Middleware-Logik, Datenbankzugriffe (Supabase), Server Actions, Logging, Code-Sauberkeit
**Grundregel des Audits:** keine Änderung der Anwendungslogik – nur Sicherheits-Härtung, Effizienz und Aufräumen.

---

## 1. Zusammenfassung

Die Anwendung ist insgesamt solide gebaut: Auth läuft serverseitig über `supabase.auth.getUser()` (nicht über manipulierbare Cookies), Rollenprüfungen sind in Layouts **und** in jeder schreibenden Server Action vorhanden, der Service-Role-Key wird ausschließlich in `"use server"`-Dateien verwendet und ist nie an den Client exponiert. Open-Redirects sind in beiden Auth-Routes abgefangen, SEPA-/CSV-/XML-Ausgaben werden escaped.

Gefunden und **behoben** wurden: eine Filter-Injection-Schwachstelle in der Mitgliedersuche, Debug-Logging von Finanzdaten, eine tote/doppelte Admin-Layout-Route, drei ungenutzte Funktionen und eine ineffiziente DB-Abfrage in der Middleware. Es bleiben einige **Empfehlungen** (keine Auto-Fixes, da sie Verhalten ändern würden).

---

## 2. Behobene Punkte

### 2.1 [HARDENING] PostgREST-Filterstring der Mitgliedersuche abgesichert
**Datei:** `app/(intranet)/members/actions.ts` → `searchMembers()`

Die Sucheingabe wurde in einen `.or("Vorname.ilike.\"%...%\"")`-Filterstring interpoliert und dabei nur das Zeichen `"` escaped (Backslash unbehandelt, LIKE-Wildcards `%`/`_` ungefiltert).

**Verifikation (gegen die echte DB, 438 Profile):** Sowohl die alte als auch die neue Variante wehren konkrete Filter-Breakout-Versuche ab (PostgREST behandelt `\"` in gequoteten Werten bereits robust → 0 Treffer). Die Schwachstelle war damit **nicht zweifelsfrei aktiv ausnutzbar**; der Fix ist Defense-in-Depth nach dokumentierter Escaping-Praxis.

**Fix:**
- Backslash **vor** Quote escapen (korrekte Reihenfolge), `%`/`_` entfernen.
- Eingabe auf 100 Zeichen begrenzt (Schutz gegen überlange/missbräuchliche Queries).
- Suchverhalten (Vorname/Nachname `ilike`) bleibt unverändert – per Test bestätigt (normale Suchbegriffe liefern erwartete Treffer, Injection-Payloads 0 Treffer).

### 2.2 [SECURITY/LOGGING] Debug-Logging von SEPA-Exportdaten entfernt
**Datei:** `app/(intranet)/admin/actions/finance.ts`

`console.log("--- SEPA EXPORT FILTER STATS ---", stats)` lief bei **jedem** Export und schrieb Filter-/Zählstatistiken des Finanzexports in die Server-Logs. In Produktion landet das unkontrolliert in den Vercel-/Hosting-Logs. Entfernt.

> Verbleibendes Logging im Projekt ist unkritisch: `app/auth/callback/route.ts` loggt nur eine Fehlermeldung (kein PII), `components/admin/FinanceExport.tsx` loggt clientseitig einen Fehler. Beide belassen.

### 2.3 [BUG/DEAD CODE] Doppelte Admin-Layout-Route entfernt
**Datei (gelöscht):** `app/admin/layout.tsx`

Es existierten zwei Layouts für die `/admin`-Route: das aktive unter `app/(intranet)/admin/layout.tsx` und ein zweites unter `app/admin/layout.tsx` ohne zugehörige Page. Letzteres wurde nie gerendert, dupliziert die Rollenprüfung und nutzte `.single()`, das bei Usern ohne Profil-Zeile eine Exception wirft. Entfernt – der Build bestätigt, dass `/admin` weiterhin korrekt über die `(intranet)`-Gruppe aufgelöst wird.

### 2.4 [EFFIZIENZ] Middleware-DB-Abfrage verschlankt
**Datei:** `middleware.ts`

Die Middleware lädt bei jedem (nicht-statischen) Request das Profil, um gekündigte Accounts zu sperren – vorher mit `select("*")`. Da nur das Statusfeld benötigt wird, jetzt `select('"Status"')`. Reduziert die übertragene Datenmenge pro Request spürbar, Sperrlogik unverändert.

### 2.5 [CLEANUP] Ungenutzte Funktionen entfernt
Verifiziert per projektweiter Suche (0 Verwendungen außerhalb der Definition):
- `formatIBAN()` – `lib/iban.ts`
- `hasRequestedBvhLogin()` – `app/(intranet)/magazines/actions.ts` (die Seite nutzt `getBvhLoginStatusForCurrentUser()`)
- `getFinanceExportDataAction()` + Typ `FinanceExportState` – `app/(intranet)/admin/actions/finance.ts`

---

## 3. Geprüft & in Ordnung (keine Änderung nötig)

- **Auth-Flow:** `getUser()` serverseitig statt Cookie-Vertrauen; gekündigte Accounts werden dreifach abgesichert (Middleware, `getCachedAuth`, Login-Action).
- **Rollenprüfung:** Jede schreibende Action (`createEvent`, `deleteEvent`, `createNews`, `deleteNews`, `updateMemberRole`, Finanz-/BVH-Exporte) prüft `admin`/`board` bzw. `board`. Rollenwechsel nur durch `board`.
- **Service-Role-Key:** Ausschließlich in Server-Dateien; kein Leak in Client-Bundles (geprüft).
- **Open-Redirect:** `getSafeRedirectPath()` in `auth/callback` und `auth/confirm` blockt `//`- und externe Ziele.
- **XSS:** Kein `dangerouslySetInnerHTML`/`innerHTML`/`eval`. News-Inhalt wird als Text gerendert.
- **SEPA-/CSV-Ausgabe:** `escapeXml()` und RFC-4180-CSV-Escaping vorhanden; IBAN/BIC werden vor Export validiert.
- **Bot-Schutz:** Turnstile-Verifikation vor `signUp`, Localhost-Bypass nur in `NODE_ENV=development`.
- **Geheimnisse:** `.env*` korrekt in `.gitignore`; keine Secrets im Repo getrackt.

---

## 4. Empfehlungen (bewusst NICHT automatisch geändert – würden Verhalten/Logik berühren)

1. **`updateProfile` validiert IBAN/BIC nicht** (`app/(intranet)/profile/actions.ts`). Die Registrierung validiert beide, das Profil-Update speichert beliebige Werte. Folgeschäden werden vom Finanzexport zwar abgefangen (landen in „ungültige Bankdaten“), sauberer wäre dieselbe `validateIBAN`/`validateBICFormat`-Prüfung wie bei der Registrierung.
2. **Doppelanmeldung zu Events** (`toggleRegistration`). Ohne Unique-Constraint auf `event_registrations(event_id, user_id)` sind theoretisch doppelte Inserts möglich (z. B. Race/Doppelklick). Empfehlung: DB-seitiger Unique-Index.
3. **Passwort-Mindestlänge 6** (`reset-password/actions.ts`). Entspricht dem Supabase-Default, ist aber schwach. Erhöhung auf z. B. 8–10 Zeichen erwägen.
4. **Pre-existing Lint-Warnungen** (keine Fehler): ungenutzte Variablen `now` in `calendar/page.tsx` und `id` in `EventCreator.tsx`, sowie zwei `<img>`→`next/image`-Hinweise. Kosmetisch, ohne Funktionsbezug.

---

## 5. Verifikation

- `npx tsc --noEmit` → keine Fehler
- `npx eslint .` → 0 Errors (4 vorbestehende Warnungen, s. o.)
- `npx next build` → erfolgreich, alle 27 Routen inkl. `/admin/*` aufgelöst

**Geänderte Dateien:** `middleware.ts`, `lib/iban.ts`, `app/(intranet)/members/actions.ts`, `app/(intranet)/admin/actions/finance.ts`, `app/(intranet)/magazines/actions.ts`, gelöscht: `app/admin/layout.tsx`.

---

## 6. Härtungstest (zweite Runde, adversariell)

Gezielte Suche nach IDOR/Berechtigungslücken pro Action, Service-Role-vs-RLS, Datei-Upload, SSRF, fehlenden Schutzmechanismen.

### 6.1 [SECURITY – behoben] Fehlender Rollen-Check beim Event-Bild-Upload
**Datei:** `app/(intranet)/events/actions.ts` → `uploadEventImage()`

`createEvent` und `deleteEvent` verlangen `admin`/`board`, aber `uploadEventImage` prüfte nur `if (!user)`. Damit konnte **jedes eingeloggte Mitglied** beliebige Dateien in den `event-images`-Storage-Bucket laden (Storage-Missbrauch/Kostentreiber). Die Extension-Allowlist schützt nur den Dateinamen, nicht den Aufrufer.

**Fix:** Rollenprüfung (`admin`/`board`) ergänzt – konsistent mit `createEvent`. Legitime Nutzung (Event-Creator ist nur im Admin-Bereich) bleibt unverändert.

### 6.2 [SECURITY – behoben] Fehlende HTTP-Sicherheits-Header
**Datei:** `next.config.ts` (vorher leer)

Es wurden keine Sicherheits-Header gesetzt. Ergänzt (für alle Routen, zur Laufzeit per `curl` verifiziert):
- `X-Frame-Options: DENY` (Clickjacking)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

> Bewusst **kein** striktes Content-Security-Policy, da das ohne Test Inline-Styles, Vercel Analytics, Supabase und Turnstile brechen könnte. CSP separat mit Report-Only-Phase einführen (siehe Empfehlung 7.4).

### 6.3 [SECURITY – behoben] Defensive Eingabegrenze in öffentlicher IBAN-Action
**Datei:** `app/register/validate-iban-action.ts`

Die Action ist ohne Login aufrufbar und ruft die externe `openiban.com`-API mit Nutzereingabe auf. Ergänzt: harte Format-/Längenprüfung (max. 34 Zeichen, ISO-13616-Muster) **vor** dem externen Fetch – verhindert Missbrauch als HTTP-Proxy und überlange Anfragen.

### 6.4 Geprüft & in Ordnung (Härtungsrunde)
- **IDOR:** `updateProfile`, `cancelMembership`, `markNewsAsRead`, `toggleRegistration`, `getMyEvents` lösen das Zielobjekt immer über die Session-`user.id` auf – kein clientseitig wählbarer Fremd-Identifier.
- **Mass-Assignment:** Der SQL-Trigger `handle_new_user` setzt `Rolle='member'` und `Status='active'` **hartkodiert**; nutzerkontrollierte `raw_user_meta_data` können keine Rolle/keinen Status injizieren.
- **Rollen-Eskalation:** Rollenwechsel ausschließlich durch `board`; erlaubte Rollen per Allowlist validiert.
- **Open-Redirect:** Erneut bestätigt für `auth/callback` und `auth/confirm`.
- **Account-Enumeration:** `forgot-password` verrät nicht, ob eine E-Mail existiert.
- **Reset-Password:** Setzt eine gültige (Recovery-)Session voraus (`getUser()`), `/reset-password` ist als Protected Route abgesichert.
- **Storage-Overwrite:** Upload nutzt eindeutigen Dateinamen + `upsert:false` (kein Überschreiben fremder Dateien); erzwungene Bild-Extension verhindert XSS-via-Upload.
- **Service-Role:** Erneut bestätigt – nur in `"use server"`-Dateien, kein Client-Leak.

---

## 7. Verbleibende Empfehlungen (priorisiert)

1. **IBAN/BIC-Validierung in `updateProfile`** ergänzen (wie bei Registrierung). *Mittel.*
2. **Unique-Constraint** `event_registrations(event_id, user_id)` gegen Doppelanmeldung. *Mittel.*
3. **Passwort-Mindestlänge** von 6 auf ≥ 8–10 erhöhen. *Niedrig.*
4. **Content-Security-Policy** in Report-Only-Phase einführen, dann durchsetzen. *Mittel (größtes verbleibendes Härtungspotenzial).*
5. **RLS-Policies** für alle Tabellen im Supabase-Dashboard verifizieren – der Code verlässt sich an vielen Stellen auf den Service-Role-Key (RLS-Bypass); Reads sollten zusätzlich RLS-geschützt sein, falls jemals der Anon-Pfad genutzt wird. *Mittel.*

### Verifikation Härtungsrunde
- `npx tsc --noEmit` → keine Fehler
- `npx next build` → erfolgreich
- Security-Header zur Laufzeit per `curl` auf `/login` bestätigt (alle 5 vorhanden)

**Zusätzlich geänderte Dateien:** `app/(intranet)/events/actions.ts`, `next.config.ts`, `app/register/validate-iban-action.ts`.
