import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getEventWithParticipants } from "@/app/(intranet)/events/actions";

type Props = {
  params: Promise<{ eventId: string }>;
};

export default async function AdminEventParticipantsPage({ params }: Props) {
  const { eventId } = await params;
  const data = await getEventWithParticipants(eventId);

  if (!data) notFound();

  const { event, participants } = data;
  const dateStr = event.event_date
    ? new Date(
        event.event_date + (event.event_time ? "T" + event.event_time : "")
      ).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        ...(event.event_time && { hour: "2-digit", minute: "2-digit" }),
      })
    : event.event_date;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/events" aria-label="Zurück zu Events">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{event.title}</h1>
          <p className="text-sm text-muted-foreground">
            {dateStr}
            {event.location && ` · ${event.location}`}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium">Teilnehmer</h2>
          <p className="text-sm text-muted-foreground">
            {participants.length}{" "}
            {participants.length === 1 ? "Person angemeldet" : "Personen angemeldet"}
          </p>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <p className="rounded-lg border border-dashed bg-muted/20 p-4 text-center text-sm text-muted-foreground">
              Noch keine Anmeldungen für dieses Event.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Studiengang</TableHead>
                  <TableHead>Rolle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((p) => (
                  <TableRow key={p.user_id}>
                    <TableCell className="font-medium">
                      {[p.vorname, p.nachname].filter(Boolean).join(" ") || "—"}
                    </TableCell>
                    <TableCell>{p.studiengang || "—"}</TableCell>
                    <TableCell>{p.rolle || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
