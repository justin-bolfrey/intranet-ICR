import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function InsightsPage() {
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

  const role = ((profile?.["Rolle"] as string) ?? "member").trim().toLowerCase();

  if (role !== "board") {
    redirect("/dashboard");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Insights</h1>
      <p className="mt-2 text-muted-foreground">Hier werden bald Statistiken und Auswertungen angezeigt.</p>
    </div>
  );
}
