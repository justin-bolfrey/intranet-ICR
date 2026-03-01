import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCachedAuth } from "@/utils/supabase/cached-auth";

export default async function AdminLayout({
  children,
}: { children: ReactNode }) {
  const { user, profile } = await getCachedAuth();

  if (!user) {
    redirect("/login");
  }

  const role = ((profile?.["Rolle"] as string) ?? "member").trim().toLowerCase();

  if (role !== "admin" && role !== "board") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
