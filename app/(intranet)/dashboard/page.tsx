import { createClient } from "@/utils/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select('"Vorname"')
    .eq("user_id", user?.id ?? "")
    .maybeSingle();

  const firstName = (profile?.["Vorname"] as string | null) ?? "Mitglied";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Willkommen zurück, {firstName}!
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dies ist dein Dashboard. Hier werden später deine wichtigsten Infos
          und Aktionen angezeigt.
        </p>
      </div>
    </div>
  );
}

