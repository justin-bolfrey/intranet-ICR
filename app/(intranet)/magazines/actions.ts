"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getCachedAuth } from "@/utils/supabase/cached-auth";

export type RequestBvhResult = { ok: boolean; error?: string };

/** Prüft, ob der aktuelle User bereits eine BVH-Anfrage gestellt hat. */
export async function hasRequestedBvhLogin(): Promise<boolean> {
  const status = await getBvhLoginStatusForCurrentUser();
  return status.hasRequested;
}

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
