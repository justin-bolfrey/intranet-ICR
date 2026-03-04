"use server";

import { unstable_cache } from "next/cache";
import { getCachedAuth } from "@/utils/supabase/cached-auth";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export type StatusCounts = {
  active: number;
  alumni: number;
  applicant: number;
  cancelled: number;
};

export type DemographicsItem = {
  name: string;
  count: number;
};

export type InsightsData = {
  statusCounts: StatusCounts;
  demographics: DemographicsItem[];
  payingMembersCount: number;
  activeTotal: number;
  newInLast6Months: number;
};

/** Start of current semester: Oct 1 (Winter) or Apr 1 (Summer). */
function getCurrentSemesterStart(): Date {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (month >= 10) return new Date(year, 9, 1); // 1 Oct
  if (month >= 4) return new Date(year, 3, 1);  // 1 Apr
  return new Date(year - 1, 9, 1);              // previous year 1 Oct
}

/** Date 6 months ago from now. */
function getSixMonthsAgo(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - 6);
  return d;
}

const getInsightsDataCached = unstable_cache(
  async (): Promise<InsightsData | null> => {
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: rows, error } = await admin
    .from("profiles")
    .select('"Status", "Datum_Antrag", "Studiengang / Fach"');

  if (error || !rows) return null;

  const statusCounts: StatusCounts = {
    active: 0,
    alumni: 0,
    applicant: 0,
    cancelled: 0,
  };

  const studiengangMap = new Map<string, number>();
  const semesterStart = getCurrentSemesterStart();
  const sixMonthsAgo = getSixMonthsAgo();
  let payingCount = 0;
  let newInLast6 = 0;

  for (const row of rows) {
    const raw = row as Record<string, unknown>;
    const status = String(raw.Status ?? raw.status ?? "")
      .trim()
      .toLowerCase();
    const statusKey =
      status === "active"
        ? "active"
        : status === "alumni"
          ? "alumni"
          : status === "applicant"
            ? "applicant"
            : status === "cancelled"
              ? "cancelled"
              : null;
    if (statusKey) statusCounts[statusKey]++;

    const datumRaw = raw["Datum_Antrag"] ?? (raw as Record<string, unknown>)["datum_antrag"];
    let datumAntrag: Date | null = null;
    if (datumRaw) {
      const d = new Date(String(datumRaw));
      if (!Number.isNaN(d.getTime())) datumAntrag = d;
    }

    if (status === "active" && datumAntrag && datumAntrag < semesterStart)
      payingCount++;
    if (datumAntrag && datumAntrag >= sixMonthsAgo) newInLast6++;

    const sg =
      raw["Studiengang / Fach"] ?? (raw as Record<string, unknown>)["Studiengang / Fach"];
    const studiengang = String(sg ?? "")
      .trim();
    const key = studiengang || "Ohne Angabe";
    studiengangMap.set(key, (studiengangMap.get(key) ?? 0) + 1);
  }

  const demographics: DemographicsItem[] = Array.from(studiengangMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    statusCounts,
    demographics,
    payingMembersCount: payingCount,
    activeTotal: statusCounts.active,
    newInLast6Months: newInLast6,
  };
  },
  ["insights-data"],
  { revalidate: 60 }
);

export async function getInsightsData(): Promise<InsightsData | null> {
  const { user, profile } = await getCachedAuth();
  if (!user) return null;

  const role = ((profile?.["Rolle"] as string) ?? "member").trim().toLowerCase();
  if (role !== "board") return null;

  return getInsightsDataCached();
}
