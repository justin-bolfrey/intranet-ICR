"use server";

import { getCachedAuth } from "@/utils/supabase/cached-auth";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export type MemberRow = {
  name: string;
  studiengang: string;
};

export async function searchMembers(query: string): Promise<MemberRow[]> {
  const { user } = await getCachedAuth();
  if (!user) return [];

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const q = (query || "").trim();
  if (!q) return [];

  const pattern = `%${q}%`;
  const escaped = pattern.replace(/"/g, '\\"');
  const { data, error } = await admin
    .from("profiles")
    .select('Vorname, Nachname, "Studiengang / Fach"')
    .or(`Vorname.ilike."${escaped}",Nachname.ilike."${escaped}"`);

  if (error) return [];

  return (data ?? []).map((p) => {
    const raw = p as Record<string, unknown>;
    const v = String(raw.Vorname ?? "").trim();
    const n = String(raw.Nachname ?? "").trim();
    const name = [v, n].filter(Boolean).join(" ") || "—";
    const studiengang = String(raw["Studiengang / Fach"] ?? "").trim();
    return { name, studiengang };
  });
}

export async function getAllMembers(): Promise<MemberRow[]> {
  const { user } = await getCachedAuth();
  if (!user) return [];

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await admin
    .from("profiles")
    .select('Vorname, Nachname, "Studiengang / Fach"')
    .order("Nachname", { ascending: true })
    .order("Vorname", { ascending: true });

  if (error) return [];

  return (data ?? []).map((p) => {
    const raw = p as Record<string, unknown>;
    const v = String(raw.Vorname ?? "").trim();
    const n = String(raw.Nachname ?? "").trim();
    const name = [v, n].filter(Boolean).join(" ") || "—";
    const studiengang = String(raw["Studiengang / Fach"] ?? "").trim();
    return { name, studiengang };
  });
}
