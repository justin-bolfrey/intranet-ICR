"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteEvent } from "@/app/(intranet)/events/actions";

type Props = {
  eventId: string;
  title: string;
};

export function DeleteEventButton({ eventId, title }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const confirmed = window.confirm(
      `Event „${title}“ wirklich entfernen?\n\nDas Event verschwindet aus Events, Kalender und allen Übersichten.`
    );
    if (!confirmed) return;

    startTransition(async () => {
      const { error } = await deleteEvent(eventId);
      if (error) {
        toast.error(error || "Event konnte nicht entfernt werden.");
        return;
      }
      toast.success("Event entfernt.");
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className="border-red-200 text-red-600 hover:bg-red-50"
      aria-label={`Event ${title} entfernen`}
    >
      {isPending ? "Entferne…" : "Entfernen"}
    </Button>
  );
}

