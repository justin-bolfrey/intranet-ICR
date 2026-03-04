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
    <div className="min-h-screen bg-muted/30 md:flex md:h-screen md:overflow-hidden">
      <Sidebar
        profile={{ vorname, nachname, rolle: rawRole, letzterNewsAufruf }}
      />
      <main className="w-full p-4 pb-24 md:h-screen md:flex-1 md:overflow-y-auto md:p-8 md:pb-28 lg:p-10 lg:pb-32">
        <IntranetPageTransition>
          {children}
        </IntranetPageTransition>
      </main>
    </div>
  );
}
