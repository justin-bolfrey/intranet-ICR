"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MemberRoleSelect } from "./MemberRoleSelect";
import type { AdminMemberRow } from "@/app/(intranet)/admin/members/actions";

const ROLE_LABELS: Record<string, string> = {
  member: "Mitglied",
  admin: "Admin",
  board: "Vorstand",
};

type Props = {
  members: AdminMemberRow[];
  canEditRole: boolean;
};

export function AdminMembersTable({ members, canEditRole }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Studiengang</TableHead>
          <TableHead>E-Mail</TableHead>
          <TableHead>Handynummer</TableHead>
          <TableHead>Rolle</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id}>
            <TableCell className="font-medium">{member.name}</TableCell>
            <TableCell>{member.studiengang || "—"}</TableCell>
            <TableCell>{member.email || "—"}</TableCell>
            <TableCell>{member.handynummer || "—"}</TableCell>
            <TableCell>
              {canEditRole ? (
                <MemberRoleSelect member={member} />
              ) : (
                <span>{ROLE_LABELS[member.rolle] ?? member.rolle}</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
