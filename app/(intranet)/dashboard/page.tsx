import { getCachedAuth } from "@/utils/supabase/cached-auth";

export default async function DashboardPage() {
  const { profile } = await getCachedAuth();
  const firstName = (profile?.["Vorname"] as string | null) ?? "Mitglied";

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-8">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Willkommen zurück, {firstName}!
        </h1>
        <p className="mt-3 text-base text-muted-foreground md:text-lg">
          Dies ist dein Dashboard. Hier werden später deine wichtigsten Infos
          und Aktionen angezeigt.
        </p>
      </div>
    </div>
  );
}

