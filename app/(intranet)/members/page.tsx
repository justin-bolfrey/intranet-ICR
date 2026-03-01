import { MembersSearch } from "@/components/members/MembersSearch";

export default function MembersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mitglieder</h1>
        <p className="mt-1 text-muted-foreground">
          Mitglieder des ICR suchen oder alle anzeigen (Name und Studiengang).
        </p>
      </div>
      <MembersSearch />
    </div>
  );
}
