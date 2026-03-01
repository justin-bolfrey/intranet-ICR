import { redirect } from "next/navigation";
import { getCachedAuth } from "@/utils/supabase/cached-auth";
import { getInsightsData } from "./actions";
import { KeyMetricsCards } from "@/components/board/KeyMetricsCards";
import { StatusPieChart } from "@/components/board/StatusPieChart";
import { DemographicsChart } from "@/components/board/DemographicsChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FEE_PER_MEMBER = 15;

export default async function InsightsPage() {
  const { user, profile } = await getCachedAuth();

  if (!user) redirect("/login");

  const role = ((profile?.["Rolle"] as string) ?? "member").trim().toLowerCase();
  if (role !== "board") redirect("/dashboard");

  const data = await getInsightsData();
  if (!data) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Insights</h1>
        <p className="mt-2 text-muted-foreground">
          Keine Daten verfügbar.
        </p>
      </div>
    );
  }

  const statusPieData = [
    { name: "Aktiv", value: data.statusCounts.active },
    { name: "Alumni", value: data.statusCounts.alumni },
    { name: "Bewerber", value: data.statusCounts.applicant },
    { name: "Abgebrochen", value: data.statusCounts.cancelled },
  ];

  const cashflow = data.payingMembersCount * FEE_PER_MEMBER;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Insights</h1>
        <p className="text-muted-foreground">
          Übersicht für den Vorstand
        </p>
      </div>

      <KeyMetricsCards
        cashflow={cashflow}
        activeTotal={data.activeTotal}
        newInLast6Months={data.newInLast6Months}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusPieChart data={statusPieData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Studiengang / Fach</CardTitle>
          </CardHeader>
          <CardContent>
            <DemographicsChart data={data.demographics} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
