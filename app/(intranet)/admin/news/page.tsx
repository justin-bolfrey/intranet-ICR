import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewsCreator } from "@/components/admin/NewsCreator";

export default function AdminNewsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin" aria-label="Zurück zum Admin-Bereich">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">News veröffentlichen</h1>
          <p className="text-sm text-muted-foreground">
            Neue Nachricht für das Schwarze Brett schreiben
          </p>
        </div>
      </div>

      <div className="w-full">
        <NewsCreator />
      </div>
    </div>
  );
}
