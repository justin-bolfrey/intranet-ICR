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
    .select('id, Vorname, Nachname, "Studiengang / Fach", "E-Mail", Handynummer, Rolle')
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
    return {
      id: String(raw.id ?? ""),
      name,
      studiengang: String(sg ?? "").trim(),
      email: String(em ?? "").trim(),
      handynummer: String(hn ?? "").trim(),
      rolle: String(rl ?? "member").trim().toLowerCase(),
    };
  });
}

export async function updateMemberRole(
  profileId: string,
  newRole: string
): Promise<{ error: string }> {
  const { user, profile } = await getCachedAuth();
  if (!user) return { error: "Nicht eingeloggt." };

  const role = ((profile?.["Rolle"] as string) ?? "member").trim().toLowerCase();
  if (role !== "board") return { error: "Nur Vorstand (board) darf Rollen ändern." };

  const allowed = ["member", "admin", "board"];
  const roleValue = newRole.trim().toLowerCase();
  if (!allowed.includes(roleValue)) return { error: "Ungültige Rolle." };

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await admin
    .from("profiles")
    .update({ Rolle: roleValue })
    .eq("id", profileId);

  if (error) return { error: error.message };

  revalidatePath("/admin/members");
  revalidatePath("/admin");
  return { error: "" };
}
