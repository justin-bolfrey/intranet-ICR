import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBvhLoginRequests } from "@/app/(intranet)/magazines/actions";
import { BvhLoginRequestsTable } from "@/components/admin/BvhLoginRequestsTable";

export default async function AdminBvhLoginPage() {
  const requests = await getBvhLoginRequests();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin" aria-label="Zurück zum Admin-Bereich">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">BVH Login</h1>
          <p className="text-sm text-muted-foreground">
            Anfragen für BVH-Zugangsdaten. „Akzeptieren“ nur zum Abhaken – die Freischaltung erfolgt manuell auf der BVH-Seite.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Anfragen</CardTitle>
        </CardHeader>
        <CardContent>
          <BvhLoginRequestsTable requests={requests} />
        </CardContent>
      </Card>
    </div>
  );
}
