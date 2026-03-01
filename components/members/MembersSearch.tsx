"use client";

import { useState } from "react";
import { Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { searchMembers, getAllMembers, type MemberRow } from "@/app/(intranet)/members/actions";

export function MembersSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MemberRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    setLoading(true);
    try {
      const list = await searchMembers(query);
      setResults(list);
    } finally {
      setLoading(false);
    }
  }

  async function handleShowAll() {
    setLoading(true);
    try {
      const list = await getAllMembers();
      setResults(list);
      setQuery("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Mitglieder suchen</h2>
          <p className="text-sm text-muted-foreground">
            Nach Name suchen oder alle Mitglieder des ICR anzeigen. Es werden nur Name und Studiengang angezeigt.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Name eingeben …"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              Suchen
            </Button>
            <Button variant="secondary" onClick={handleShowAll} disabled={loading}>
              <Users className="mr-2 h-4 w-4" />
              Alle Mitglieder anzeigen
            </Button>
          </div>
        </CardContent>
      </Card>

      {results !== null && (
        <Card>
          <CardHeader>
            <h3 className="text-base font-medium">
              {results.length === 0
                ? "Keine Treffer"
                : `${results.length} ${results.length === 1 ? "Mitglied" : "Mitglieder"}`}
            </h3>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {query.trim()
                  ? "Keine Mitglieder gefunden. Versuche einen anderen Suchbegriff oder klicke auf „Alle Mitglieder anzeigen“."
                  : "Klicke auf „Alle Mitglieder anzeigen“, um alle Mitglieder des ICR zu sehen."}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Studiengang</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((row, i) => (
                    <TableRow key={`${row.name}-${i}`}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>{row.studiengang || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
