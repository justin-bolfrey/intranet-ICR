"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

type Props = {
  eventId: string;
  eventTitle: string;
};

export function UnregisterEventButton({ eventId, eventTitle }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleUnregister() {
    setLoading(true);
    try {
      const { error } = await toggleRegistration(eventId, true);
      if (error) toast.error(error);
      else {
        setOpen(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="secondary" size="sm">
          Abmelden
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Abmeldung</AlertDialogTitle>
          <AlertDialogDescription>
            Möchtest du deine Anmeldung für „{eventTitle}" zurückziehen?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleUnregister();
            }}
            disabled={loading}
          >
            {loading ? "Bitte warten…" : "Abmelden"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
