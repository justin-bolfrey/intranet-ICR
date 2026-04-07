"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { buildBvhUnhandledRequestsCsv } from "@/app/(intranet)/magazines/actions";

type Props = {
  unhandledCount: number;
};

export function BvhCsvDownloadButton({ unhandledCount }: Props) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      const { csv, error } = await buildBvhUnhandledRequestsCsv();
      if (error || csv == null) {
        toast.error(error || "Export fehlgeschlagen.");
        return;
      }
      const bom = "\uFEFF";
      const blob = new Blob([bom + csv], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const day = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `bvh-mitglieder-upload-${day}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(
        unhandledCount === 0
          ? "Vorlage heruntergeladen (keine offenen Anfragen)."
          : "CSV wurde heruntergeladen."
      );
    } catch {
      toast.error("Download fehlgeschlagen.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-2"
      disabled={pending}
      onClick={handleClick}
    >
      <Download className="h-4 w-4" />
      {pending ? "Erzeuge CSV…" : "CSV laden"}
    </Button>
  );
}
