import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCachedAuth } from "@/utils/supabase/cached-auth";
import { getAdminMembers } from "./actions";
import { AdminMembersWithSearch } from "@/components/admin/AdminMembersWithSearch";

export default async function AdminMembersPage() {
  const { profile } = await getCachedAuth();
  const currentRole = ((profile?.["Rolle"] as string) ?? "member").trim().toLowerCase();
  const members = await getAdminMembers();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin" aria-label="Zurück zum Admin-Bereich">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Mitglieder</h1>
          <p className="text-sm text-muted-foreground">
            Alle Mitglieder mit Name, Studiengang, E-Mail, Handynummer und Rolle. Nur Vorstand (board) kann Rollen bearbeiten.
          </p>
        </div>
      </div>

      <AdminMembersWithSearch members={members} canEditRole={currentRole === "board"} />
    </div>
  );
}
