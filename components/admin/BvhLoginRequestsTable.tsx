"use client";

import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { markBvhRequestHandled } from "@/app/(intranet)/magazines/actions";
import type { BvhLoginRequestRow } from "@/app/(intranet)/magazines/actions";

type Props = { requests: BvhLoginRequestRow[] };

export function BvhLoginRequestsTable({ requests }: Props) {
  const router = useRouter();

  async function handleAccept(id: string) {
    await markBvhRequestHandled(id);
    router.refresh();
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Vorname</TableHead>
          <TableHead>Nachname</TableHead>
          <TableHead>E-Mail</TableHead>
          <TableHead className="w-[140px]">Aktion</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="text-center text-muted-foreground">
              Keine Anfragen.
            </TableCell>
          </TableRow>
        ) : (
          requests.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.vorname || "—"}</TableCell>
              <TableCell>{r.nachname || "—"}</TableCell>
              <TableCell>{r.email || "—"}</TableCell>
              <TableCell>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  disabled={r.handled}
                  onClick={() => handleAccept(r.id)}
                >
                  {r.handled ? "Erledigt" : "Akzeptieren"}
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
