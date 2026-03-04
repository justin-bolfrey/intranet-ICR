import Link from "next/link";
import { ArrowLeft, ChevronRight, Users, CalendarPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EventCreator } from "@/components/admin/EventCreator";
import { getEvents } from "@/app/(intranet)/events/actions";
import { DeleteEventButton } from "@/components/admin/DeleteEventButton";

export default async function AdminEventsPage() {
  const events = await getEvents();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin" aria-label="Zurück zum Admin-Bereich">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="mt-1 text-muted-foreground">
            Veranstaltungen anlegen und Teilnehmer verwalten.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-2 transition-all duration-300 ease-out hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
              <CalendarPlus className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="mb-4">
              <CardTitle className="text-lg">Neues Event anlegen</CardTitle>
              <CardDescription className="mt-1.5">
                Neue Veranstaltung mit Datum, Uhrzeit, Bild und optionaler Anmeldung erstellen.
              </CardDescription>
            </div>
            <EventCreator />
          </CardContent>
        </Card>

        <Card className="border-2 transition-all duration-300 ease-out hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Aktive Events verwalten</CardTitle>
                <CardDescription className="mt-1.5">
                  Event anklicken, um Teilnehmer zu sehen – oder dauerhaft entfernen.
                </CardDescription>
              </div>
              <div className="hidden items-center gap-1 text-xs font-medium text-muted-foreground sm:flex">
                <Trash2 className="h-4 w-4" />
                <span>Event entfernen</span>
              </div>
            </div>
            {events.length === 0 ? (
              <p className="rounded-lg border border-dashed bg-muted/20 p-4 text-center text-sm text-muted-foreground">
                Noch keine Events angelegt.
              </p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {events.map((event) => {
                  const dateStr = event.event_date
                    ? new Date(
                        event.event_date + (event.event_time ? "T" + event.event_time : "")
                      ).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        ...(event.event_time && { hour: "2-digit", minute: "2-digit" }),
                      })
                    : event.event_date;
                  const count = event.registrations?.length ?? 0;
                  return (
                    <li key={event.id} className="px-4 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <Link
                          href={`/admin/events/${event.id}`}
                          className="group flex flex-1 items-center justify-between gap-4 rounded-md px-0 py-1 text-left transition-all duration-300 hover:bg-muted/50"
                        >
                          <div className="min-w-0">
                            <p className="font-medium transition-colors duration-300 group-hover:text-primary">
                              {event.title}
                            </p>
                            <p className="text-xs text-muted-foreground">{dateStr}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2 text-muted-foreground">
                            <span className="flex items-center gap-1 text-sm">
                              <Users className="h-4 w-4" />
                              {count}
                            </span>
                            <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary" />
                          </div>
                        </Link>
                        <DeleteEventButton eventId={event.id} title={event.title} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
