"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteNews } from "@/app/(intranet)/news/actions";

type Props = {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  canDelete?: boolean;
};

export function NewsCard({
  id,
  title,
  content,
  author,
  date,
  canDelete = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const preview =
    content.length > 120 ? content.slice(0, 120).trimEnd() + "..." : content;

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => setOpen((v) => !v)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="flex items-center gap-2">
            {canDelete && (
              <Button
                type="button"
                size="xs"
                variant="outline"
                className="border-red-200 px-2 text-xs text-red-600 hover:bg-red-50"
                disabled={isPending}
                onClick={(e) => {
                  e.stopPropagation();
                  const confirmed = window.confirm(
                    "Diese News wirklich dauerhaft entfernen?"
                  );
                  if (!confirmed) return;
                  startTransition(async () => {
                    const { error } = await deleteNews(id);
                    if (error) {
                      toast.error(error || "News konnte nicht entfernt werden.");
                    } else {
                      toast.success("News entfernt.");
                    }
                  });
                }}
              >
                <Trash2 className="mr-1 h-3 w-3" />
                {isPending ? "Entfernen…" : "Entfernen"}
              </Button>
            )}
            <ChevronDown
              className={`mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                open ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>
        <CardDescription>
          {author} &middot; {date}
        </CardDescription>
      </CardHeader>

      {!open && (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {preview}
          </p>
        </CardContent>
      )}

      {open && (
        <CardContent className="pt-0">
          <p className="whitespace-pre-wrap text-sm text-foreground">
            {content}
          </p>
        </CardContent>
      )}
    </Card>
  );
}
