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
import { cancelMembership } from "@/app/(intranet)/profile/actions";

export function CancelMembership() {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      const result = await cancelMembership();
      if (result.success) {
        toast.success("Austritt im System vermerkt.");
      } else {
        toast.error(result.error || "Ein Fehler ist aufgetreten.");
      }
    } catch {
      toast.error("Ein unerwarteter Fehler ist aufgetreten.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className="w-full bg-primary text-white hover:bg-primary/90 sm:w-auto">
          Aus dem Verein austreten
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Willst du den ICR wirklich verlassen?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">
              Deine Mitgliedschaft wird beendet und das heutige Datum als
              Kündigungsdatum hinterlegt. Die Abbuchung der Beiträge stoppt
              automatisch zum nächstmöglichen Semester-Stichtag.
            </span>
            <span className="block font-medium text-foreground">
              Diese Aktion kann im System nur durch den Vorstand rückgängig
              gemacht werden.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className="bg-primary text-white hover:bg-primary/90"
          >
            {loading ? "Wird verarbeitet..." : "Kündigung bestätigen"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
