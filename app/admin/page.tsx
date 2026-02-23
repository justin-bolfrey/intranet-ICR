import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  return (
    <div className="flex min-h-screen flex-col p-8">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin Control Panel</h1>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Zum Dashboard</Link>
        </Button>
      </header>
      <main>
        <p className="text-muted-foreground">
          Hier kannst du später Admin-Funktionen verwalten.
        </p>
      </main>
    </div>
  );
}
