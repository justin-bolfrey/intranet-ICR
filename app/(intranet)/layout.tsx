import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCachedAuth } from "@/utils/supabase/cached-auth";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function IntranetLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, profile } = await getCachedAuth();

  if (!user) {
    redirect("/login");
  }

  const vorname = ((profile?.["Vorname"] as string) ?? "").trim();
  const nachname = ((profile?.["Nachname"] as string) ?? "").trim();
  const rawRole = ((profile?.["Rolle"] as string) ?? "member").trim().toLowerCase();
  const letzterNewsAufruf = (profile?.["letzter_news_aufruf"] as string | null) ?? null;

  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar
        profile={{ vorname, nachname, rolle: rawRole, letzterNewsAufruf }}
      />
      <main className="min-h-screen flex-1 p-6 md:p-8 lg:p-10">
        <div className="intranet-page-fade-in h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
