"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  title: string;
  content: string;
  author: string;
  date: string;
};

export function NewsCard({ title, content, author, date }: Props) {
  const [open, setOpen] = useState(false);

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
          <ChevronDown
            className={`mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
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
