import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { FinanceExport } from "@/components/admin/FinanceExport";
import { NewsCreator } from "@/components/admin/NewsCreator";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select('"Rolle"')
    .eq("user_id", user.id)
    .maybeSingle();

  const rawRole = (profile?.["Rolle"] as string | null) ?? "member";
  const role = rawRole.trim().toLowerCase();

  // Harte RBAC: Nur admin oder board darf die Seite überhaupt sehen
  if (role !== "admin" && role !== "board") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">
        Admin Control Panel
      </h1>
      <p className="text-sm text-muted-foreground">
        Verwalte Mitglieder und Finanzexporte für das ICR Intranet.
      </p>

      <Tabs defaultValue="members" className="mt-4">
        <TabsList>
          <TabsTrigger value="members">Mitglieder</TabsTrigger>
          <TabsTrigger value="finance">Finanzen &amp; SEPA</TabsTrigger>
          <TabsTrigger value="news">News</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <div className="mt-4 rounded-lg border bg-card p-4 text-sm text-muted-foreground">
            Hier werden später Werkzeuge zur Mitgliederverwaltung angezeigt.
          </div>
        </TabsContent>

        <TabsContent value="finance">
          <div className="mt-4">
            <FinanceExport />
          </div>
        </TabsContent>

        <TabsContent value="news">
          <div className="mt-4 space-y-2">
            <h2 className="text-lg font-semibold">Neue News veröffentlichen</h2>
            <p className="text-sm text-muted-foreground">
              Schreibe eine Nachricht, die allen Mitgliedern auf dem Schwarzen Brett angezeigt wird.
            </p>
            <NewsCreator />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

