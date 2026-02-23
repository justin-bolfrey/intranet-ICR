import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { LogoutButton } from "./logout-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const displayName =
    user.user_metadata?.first_name ||
    user.user_metadata?.last_name ||
    user.email?.split("@")[0] ||
    "Mitglied";

  return (
    <div className="flex min-h-screen flex-col p-8">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">ICR Intranet</h1>
        <LogoutButton />
      </header>
      <main>
        <h2 className="text-xl text-muted-foreground">
          Willkommen, {displayName}!
        </h2>
        <p className="mt-4">
          Dies ist dein Dashboard. Hier findest du später weitere Inhalte.
        </p>
      </main>
    </div>
  );
}
