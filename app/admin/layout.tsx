import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

/**
 * Admin-Layout: Rollen-Prüfung.
 * Nur User mit Rolle 'admin' oder 'board' dürfen den Admin-Bereich betreten.
 * Die profiles-Tabelle hat deutsche Spaltennamen (z.B. "Rolle").
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Profil laden – Spalte "Rolle" (deutsche Bezeichnung)
  // Bei Groß-/Kleinschreibung: ggf. .select('Rolle') anpassen je nach DB-Schema
  const { data: profile } = await supabase
    .from("profiles")
    .select("Rolle")
    .eq("id", user.id)
    .single();

  const rolle = (profile as { Rolle?: string })?.Rolle;

  if (rolle !== "admin" && rolle !== "board") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
