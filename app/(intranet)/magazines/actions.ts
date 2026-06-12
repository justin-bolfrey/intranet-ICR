"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getCachedAuth } from "@/utils/supabase/cached-auth";
import {
  BVH_MITGLIEDER_CSV_HEADER,
  formatBirthdayIso,
  genderFromAnrede,
  joinCsvRow,
  vorstandFromRolle,
} from "@/lib/bvh-mitglieder-csv";

export type RequestBvhResult = { ok: boolean; error?: string };

/** Status der BVH-Anfrage des aktuellen Users (für Anzeige „Erledigt“ → „Login per E-Mail versendet“). */
export type BvhLoginStatus = { hasRequested: boolean; handled: boolean };

export async function getBvhLoginStatusForCurrentUser(): Promise<BvhLoginStatus> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return { hasRequested: false, handled: false };

  const { data, error } = await supabase
    .from("bvh_login_requests")
    .select("handled")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data)
    return { hasRequested: false, handled: false };

  return {
    hasRequested: true,
    handled: Boolean((data as { handled?: boolean }).handled),
  };
}

/** Stellt eine Anfrage für BVH-Login-Daten (speichert in bvh_login_requests). */
export async function requestBvhLogin(): Promise<RequestBvhResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht eingeloggt." };

  const { data: profile } = await supabase
    .from("profiles")
    .select('id, Vorname, Nachname, "E-Mail"')
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) return { ok: false, error: "Profil nicht gefunden." };

  const raw = profile as Record<string, unknown>;
  const vorname = String(raw.Vorname ?? raw.vorname ?? "").trim();
  const nachname = String(raw.Nachname ?? raw.nachname ?? "").trim();
  const email = String(raw["E-Mail"] ?? (raw as Record<string, unknown>)["e-mail"] ?? "").trim();

  if (!email) return { ok: false, error: "E-Mail im Profil fehlt." };

  const { error } = await supabase.from("bvh_login_requests").insert({
    user_id: user.id,
    vorname,
    nachname,
    email,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/bvh-login");
  revalidatePath("/magazines");
  return { ok: true };
}

export type BvhLoginRequestRow = {
  id: string;
  vorname: string;
  nachname: string;
  email: string;
  handled: boolean;
  created_at: string;
};

/** Liste aller BVH-Anfragen (nur Admin/Vorstand). */
export async function getBvhLoginRequests(): Promise<BvhLoginRequestRow[]> {
  const { user, profile } = await getCachedAuth();
  if (!user) return [];
  const role = ((profile?.["Rolle"] as string) ?? "member").trim().toLowerCase();
  if (role !== "admin" && role !== "board") return [];

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await admin
    .from("bvh_login_requests")
    .select("id, vorname, nachname, email, handled, created_at")
    .order("created_at", { ascending: false });

  if (error) return [];

  return (data ?? []).map((r) => ({
    id: String(r.id),
    vorname: String(r.vorname ?? ""),
    nachname: String(r.nachname ?? ""),
    email: String(r.email ?? ""),
    handled: Boolean(r.handled),
    created_at: String(r.created_at ?? ""),
  }));
}

/** Anfrage als „akzeptiert“ markieren (Button ausgrauen; Freischaltung erfolgt manuell auf BVH-Seite). */
export async function markBvhRequestHandled(id: string): Promise<{ error?: string }> {
  const { user, profile } = await getCachedAuth();
  if (!user) return { error: "Nicht eingeloggt." };
  const role = ((profile?.["Rolle"] as string) ?? "member").trim().toLowerCase();
  if (role !== "admin" && role !== "board") return { error: "Keine Berechtigung." };

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await admin
    .from("bvh_login_requests")
    .update({ handled: true })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/bvh-login");
  return {};
}

/**
 * CSV für BVH-Mitglieder-Upload: nur Anfragen mit handled = false.
 * Kopfzeile und Spaltenreihenfolge exakt laut BVH-Template.
 */
export async function buildBvhUnhandledRequestsCsv(): Promise<{
  csv: string | null;
  error: string;
}> {
  const { user, profile } = await getCachedAuth();
  if (!user) return { csv: null, error: "Nicht eingeloggt." };
  const role = ((profile?.["Rolle"] as string) ?? "member").trim().toLowerCase();
  if (role !== "admin" && role !== "board") {
    return { csv: null, error: "Keine Berechtigung." };
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: reqs, error: reqErr } = await admin
    .from("bvh_login_requests")
    .select("user_id, vorname, nachname, email")
    .eq("handled", false)
    .order("created_at", { ascending: true });

  if (reqErr) return { csv: null, error: reqErr.message };
  if (!reqs?.length) {
    return {
      csv: `${BVH_MITGLIEDER_CSV_HEADER}\n`,
      error: "",
    };
  }

  const userIds = [
    ...new Set(
      (reqs as { user_id?: string }[])
        .map((r) => r.user_id)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  let profiles: Record<string, unknown>[] = [];
  if (userIds.length > 0) {
    const { data: profData, error: profErr } = await admin
      .from("profiles")
      .select(
        'user_id, Vorname, Nachname, "E-Mail", Handynummer, Geburtsdatum, Anrede, "Straße", Hausnummer, PLZ, Ort, Rolle'
      )
      .in("user_id", userIds);
    if (profErr) return { csv: null, error: profErr.message };
    profiles = (profData ?? []) as Record<string, unknown>[];
  }

  const byUserId = new Map<string, Record<string, unknown>>();
  for (const p of profiles) {
    const uid = String((p as Record<string, unknown>).user_id ?? "");
    if (uid) byUserId.set(uid, p as Record<string, unknown>);
  }

  const lines: string[] = [BVH_MITGLIEDER_CSV_HEADER];

  for (const r of reqs as {
    user_id?: string;
    vorname?: string;
    nachname?: string;
    email?: string;
  }[]) {
    const uid = r.user_id ?? "";
    const prof = uid ? byUserId.get(uid) : undefined;

    const email =
      String(
        prof?.["E-Mail"] ?? prof?.["e-mail"] ?? r.email ?? ""
      ).trim();
    const firstName = String(prof?.Vorname ?? prof?.vorname ?? r.vorname ?? "").trim();
    const lastName = String(prof?.Nachname ?? prof?.nachname ?? r.nachname ?? "").trim();
    const phone = String(prof?.Handynummer ?? prof?.handynummer ?? "").trim();
    const birthday = formatBirthdayIso(prof?.Geburtsdatum ?? prof?.geburtsdatum);
    const gender = genderFromAnrede(
      String(prof?.Anrede ?? prof?.anrede ?? "").trim() || undefined
    );
    const pcode = String(prof?.PLZ ?? prof?.plz ?? "").trim();
    const place = String(prof?.Ort ?? prof?.ort ?? "").trim();
    const street = String(prof?.["Straße"] ?? prof?.Strasse ?? "").trim();
    const snumber = String(prof?.Hausnummer ?? prof?.hausnummer ?? "").trim();
    const addition = "";
    const vorstand = vorstandFromRolle(
      String(prof?.Rolle ?? prof?.rolle ?? "member")
    );
    const deleteFlag = "0";

    lines.push(
      joinCsvRow([
        email,
        firstName,
        lastName,
        gender,
        phone,
        birthday,
        "DE",
        pcode,
        place,
        street,
        snumber,
        addition,
        vorstand,
        deleteFlag,
      ])
    );
  }

  return { csv: lines.join("\n") + "\n", error: "" };
}
