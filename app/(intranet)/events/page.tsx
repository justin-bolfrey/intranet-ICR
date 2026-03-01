import { MapPin, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getCachedAuth } from "@/utils/supabase/cached-auth";
import { getEvents } from "./actions";
import { RegistrationButton } from "@/components/events/RegistrationButton";

export default async function EventsPage() {
  const { user } = await getCachedAuth();
  const events = await getEvents();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Events</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Veranstaltungen und Termine des ICR.
        </p>
      </div>

      {events.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          Noch keine Events vorhanden.
        </div>
      ) : (
        <div className="mx-auto max-w-2xl space-y-4">
          {events.map((event) => {
            const date = event.event_date
              ? new Date(
                  event.event_date + (event.event_time ? "T" + event.event_time : "")
                )
              : null;
            const dateStr =
              date && !Number.isNaN(date.getTime())
                ? date.toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    ...(event.event_time && {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                  })
                : event.event_date;

            return (
              <Card key={event.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center gap-3 p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {event.organizer || "ICR"}
                      </p>
                      <p className="text-xs text-muted-foreground">{dateStr}</p>
                    </div>
                  </div>
                  <div className="border-t px-3 pb-3 pt-2">
                    <h2 className="font-semibold">{event.title}</h2>
                    {event.description && (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                        {event.description}
                      </p>
                    )}
                  </div>
                  {event.image_url && (
                    <div className="w-full border-t">
                      <img
                        src={event.image_url}
                        alt=""
                        className="w-full object-cover"
                        width={672}
                        height={280}
                      />
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center gap-1.5 border-t px-3 py-2 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  {event.requires_registration && (
                    <RegistrationButton
                      eventId={event.id}
                      eventTitle={event.title}
                      registrations={event.registrations}
                      currentUserId={user?.id ?? null}
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
