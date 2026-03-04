import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCachedAuth } from "@/utils/supabase/cached-auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { IntranetPageTransition } from "@/components/layout/IntranetPageTransition";

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
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar
        profile={{ vorname, nachname, rolle: rawRole, letzterNewsAufruf }}
      />
      <main className="h-screen flex-1 overflow-y-auto p-6 pb-24 md:p-8 md:pb-28 lg:p-10 lg:pb-32">
        <IntranetPageTransition>
          {children}
        </IntranetPageTransition>
      </main>
    </div>
  );
}
