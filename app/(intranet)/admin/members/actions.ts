"use server";

import { revalidatePath } from "next/cache";
import { getCachedAuth } from "@/utils/supabase/cached-auth";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export type AdminMemberRow = {
  id: string;
  name: string;
  studiengang: string;
  email: string;
  handynummer: string;
  rolle: string;
  /** Kleinbuchstaben, z. B. active | cancelled | applicant */
  status: string;
};

export async function getAdminMembers(): Promise<AdminMemberRow[]> {
  const { user, profile } = await getCachedAuth();
  if (!user) return [];

  const role = ((profile?.["Rolle"] as string) ?? "member").trim().toLowerCase();
  if (role !== "admin" && role !== "board") return [];

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await admin
    .from("profiles")
    .select(
      'id, Vorname, Nachname, "Studiengang / Fach", "E-Mail", Handynummer, Rolle, Status'
    )
    .order("Nachname", { ascending: true })
    .order("Vorname", { ascending: true });

  if (error) return [];

  return (data ?? []).map((p) => {
    const raw = p as Record<string, unknown>;
    const v = String(raw.Vorname ?? raw.vorname ?? "").trim();
    const n = String(raw.Nachname ?? raw.nachname ?? "").trim();
    const name = [v, n].filter(Boolean).join(" ") || "—";
    const sg = raw["Studiengang / Fach"] ?? (raw as Record<string, unknown>)["Studiengang / Fach"];
    const em = raw["E-Mail"] ?? (raw as Record<string, unknown>)["e-mail"];
    const hn = raw.Handynummer ?? raw.handynummer;
    const rl = raw.Rolle ?? raw.rolle;
    const st = raw.Status ?? raw.status;
    return {
      id: String(raw.id ?? ""),
      name,
      studiengang: String(sg ?? "").trim(),
      email: String(em ?? "").trim(),
      handynummer: String(hn ?? "").trim(),
      rolle: String(rl ?? "member").trim().toLowerCase(),
      status: String(st ?? "active").trim().toLowerCase(),
    };
  });
}

/** UI-Wert fuer "ausgetreten" - kein Rollenwert, setzt Status + Datum_Kündigung. */
const CANCELLED_UI = "cancelled";

export async function updateMemberRole(
  profileId: string,
  newRole: string
): Promise<{ error: string }> {
  const { user, profile } = await getCachedAuth();
  if (!user) return { error: "Nicht eingeloggt." };

  const role = ((profile?.["Rolle"] as string) ?? "member").trim().toLowerCase();
  if (role !== "board") return { error: "Nur Vorstand (board) darf Rollen ändern." };

  const roleValue = newRole.trim().toLowerCase();
  const allowedRoles = ["member", "admin", "board", "alumni"];
  if (roleValue !== CANCELLED_UI && !allowedRoles.includes(roleValue)) {
    return { error: "Ungültige Auswahl." };
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const today = new Date().toISOString().slice(0, 10);

  if (roleValue === CANCELLED_UI) {
    const { error } = await admin
      .from("profiles")
      .update({
        Status: "cancelled",
        Datum_Kündigung: today,
        Rolle: "member",
      })
      .eq("id", profileId);

    if (error) return { error: error.message };
  } else {
    const { error } = await admin
      .from("profiles")
      .update({
        Rolle: roleValue,
        Status: "active",
        Datum_Kündigung: null,
      })
      .eq("id", profileId);

    if (error) return { error: error.message };
  }

  revalidatePath("/admin/members");
  revalidatePath("/admin");
  return { error: "" };
}
