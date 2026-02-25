"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  createNews,
  type NewsActionState,
} from "@/app/(intranet)/news/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Wird veröffentlicht..." : "News veröffentlichen"}
    </Button>
  );
}

const INITIAL_STATE: NewsActionState = { success: false, error: "" };

export function NewsCreator() {
  const [state, formAction] = useActionState(createNews, INITIAL_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success("News veröffentlicht.");
      formRef.current?.reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="news-title">Betreff</Label>
        <Input
          id="news-title"
          name="title"
          placeholder="z.B. Neues Semester, neue Regeln"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="news-content">Nachricht</Label>
        <textarea
          id="news-content"
          name="content"
          rows={5}
          required
          placeholder="Schreibe hier deine Nachricht an alle Mitglieder..."
          className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2"
        />
      </div>
      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
