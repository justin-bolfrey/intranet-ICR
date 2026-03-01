"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AdminMembersTable } from "./AdminMembersTable";
import type { AdminMemberRow } from "@/app/(intranet)/admin/members/actions";

const ROLE_FILTER_OPTIONS = [
  { value: "all", label: "Alle Rollen" },
  { value: "member", label: "Mitglied" },
  { value: "admin", label: "Admin" },
  { value: "board", label: "Vorstand" },
];

type Props = {
  members: AdminMemberRow[];
  canEditRole: boolean;
};

export function AdminMembersWithSearch({ members, canEditRole }: Props) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filtered = useMemo(() => {
    let list = members;
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((m) => m.name.toLowerCase().includes(q));
    if (roleFilter && roleFilter !== "all") list = list.filter((m) => m.rolle === roleFilter);
    return list;
  }, [members, query, roleFilter]);

  const hasActiveFilters = Boolean(query.trim() || (roleFilter && roleFilter !== "all"));

  return (
    <Card>
      <CardHeader className="space-y-4">
        <h2 className="text-lg font-medium">Mitgliederliste</h2>
        {/* Suchleiste und Rollen-Filter in einer Zeile nebeneinander */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative flex-1 min-w-0 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 shrink-0 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Nach Name suchen …"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 w-full"
              aria-label="Mitglieder nach Name suchen"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <label htmlFor="admin-role-filter" className="text-sm text-muted-foreground whitespace-nowrap">
              Rolle:
            </label>
            <select
              id="admin-role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border-input bg-background text-foreground h-9 rounded-md border px-3 py-1.5 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-w-[160px] cursor-pointer"
            >
              {ROLE_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {!hasActiveFilters
            ? `${members.length} ${members.length === 1 ? "Eintrag" : "Einträge"}`
            : `${filtered.length} von ${members.length} Einträgen`}
        </p>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="rounded-lg border border-dashed bg-muted/20 p-4 text-center text-sm text-muted-foreground">
            {hasActiveFilters ? "Keine Mitglieder passen zu den Filtern." : "Keine Mitglieder gefunden."}
          </p>
        ) : (
          <AdminMembersTable members={filtered} canEditRole={canEditRole} />
        )}
      </CardContent>
    </Card>
  );
}
