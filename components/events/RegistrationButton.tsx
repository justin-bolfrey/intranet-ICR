"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toggleRegistration } from "@/app/(intranet)/events/actions";
import type { EventRegistration } from "@/app/(intranet)/events/actions";

type Props = {
  eventId: string;
  eventTitle: string;
  registrations: EventRegistration[];
  currentUserId: string | null;
};

export function RegistrationButton({
  eventId,
  eventTitle,
  registrations,
  currentUserId,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isRegistered = currentUserId
    ? registrations.some((r) => r.user_id === currentUserId)
    : false;

  async function handleToggle() {
    setLoading(true);
    try {
      const { error } = await toggleRegistration(eventId, isRegistered);
      if (error) toast.error(error);
      else setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  const count = registrations.length;

  return (
    <div className="flex items-center justify-between border-t px-3 py-2">
      <span className="text-xs text-muted-foreground">
        {count} {count === 1 ? "Person nimmt teil" : "Personen nehmen teil"}
      </span>
      {currentUserId && (
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <Button variant={isRegistered ? "secondary" : "default"} size="sm">
              {isRegistered ? "Abmelden" : "Anmelden"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {isRegistered ? "Abmeldung" : "Anmeldung"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {isRegistered
                  ? `Möchtest du deine Anmeldung für „${eventTitle}" zurückziehen?`
                  : `Möchtest du dich für „${eventTitle}" verbindlich anmelden?`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleToggle();
                }}
                disabled={loading}
              >
                {loading ? "Bitte warten…" : isRegistered ? "Abmelden" : "Anmelden"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
