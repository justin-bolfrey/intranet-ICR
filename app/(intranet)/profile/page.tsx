import { createClient } from "@/utils/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select('"Vorname", "Nachname", "Rolle"')
    .eq("user_id", user?.id ?? "")
    .maybeSingle();

  const firstName = (profile?.["Vorname"] as string | null) ?? "";
  const lastName = (profile?.["Nachname"] as string | null) ?? "";
  const role = (profile?.["Rolle"] as string | null) ?? "member";

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Mein Profil</h1>
      <div className="rounded-lg border bg-card p-4 text-sm">
        <p className="font-medium">
          {firstName || lastName
            ? `${firstName} ${lastName}`.trim()
            : user?.email}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Rolle: {role}</p>
        <p className="mt-2 text-muted-foreground">
          Hier werden später weitere Profildaten und Einstellungen angezeigt.
        </p>
      </div>
    </div>
  );
}

