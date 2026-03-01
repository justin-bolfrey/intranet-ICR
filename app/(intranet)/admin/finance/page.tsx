import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FinanceExport } from "@/components/admin/FinanceExport";

export default function AdminFinancePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin" aria-label="Zurück zum Admin-Bereich">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Finanzen & SEPA</h1>
          <p className="text-sm text-muted-foreground">
            SEPA-Export, Vorschau und CSV/XML-Download
          </p>
        </div>
      </div>

      <FinanceExport />
    </div>
  );
}
