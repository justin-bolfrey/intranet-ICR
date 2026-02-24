import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/utils/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function IntranetLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select('"Rolle"')
    .eq("user_id", user.id)
    .maybeSingle();

  console.log("SERVER CHECK - Profil-Daten:", profile, "Fehler:", error);

  const rawRole = (profile?.["Rolle"] as string | null) ?? "member";
  const role = rawRole.trim().toLowerCase();

  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar role={role} />
      <main className="flex-1 min-h-screen p-6 md:p-8 lg:p-10">
        {children}
      </main>
    </div>
  );
}

