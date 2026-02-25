import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { CancelMembership } from "@/components/profile/CancelMembership";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  console.log("PROFILE DEBUG:", { profile, error });

  const profileData = {
    vorname: ((profile?.["Vorname"] as string) ?? "").trim(),
    nachname: ((profile?.["Nachname"] as string) ?? "").trim(),
    email: user.email ?? "",
    rolle: ((profile?.["Rolle"] as string) ?? "member").trim().toLowerCase(),
    status: ((profile?.["Status"] as string) ?? "").trim().toLowerCase(),
    datumAntrag: (profile?.["Datum_Antrag"] as string | null) ?? null,
    strasse: ((profile?.["Straße"] as string) ?? "").trim(),
    hausnummer: ((profile?.["Hausnummer"] as string) ?? "").trim(),
    plz: ((profile?.["PLZ"] as string) ?? "").trim(),
    ort: ((profile?.["Ort"] as string) ?? "").trim(),
    mobil: ((profile?.["Handynummer"] as string) ?? "").trim(),
    iban: ((profile?.["IBAN"] as string) ?? "").trim(),
    bic: ((profile?.["BIC"] as string) ?? "").trim(),
  };

  const isCancelled = profileData.status === "cancelled";

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Mein Profil</h1>
      <ProfileForm profile={profileData} />

      {!isCancelled && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-6">
          <h2 className="text-sm font-semibold text-primary">
            Gefahrenzone
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Du kannst deine Mitgliedschaft im ICR hier beenden. Dieser Schritt
            kann nur durch den Vorstand rückgängig gemacht werden.
          </p>
          <div className="mt-4">
            <CancelMembership />
          </div>
        </div>
      )}
    </div>
  );
}
