"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  cashflow: number;
  activeTotal: number;
  newInLast6Months: number;
  cancellationsInLast6Months: number;
};

export function KeyMetricsCards({
  cashflow,
  activeTotal,
  newInLast6Months,
  cancellationsInLast6Months,
}: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Erwarteter Umsatz
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold tabular-nums">
            {cashflow.toLocaleString("de-DE")} €
          </p>
          <p className="text-xs text-muted-foreground">
            Zahlende Mitglieder × 15 € (laufendes Semester)
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Aktive Mitglieder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold tabular-nums">{activeTotal}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Neuzugänge (letzte 6 Monate)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold tabular-nums">
            {newInLast6Months}
          </p>
          <p className="text-xs text-muted-foreground">
            Nach Datum Antrag (Mitglieder mit neuem Eintritt)
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Kündigungen / Abgänge (letzte 6 Monate)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold tabular-nums">
            {cancellationsInLast6Months}
          </p>
          <p className="text-xs text-muted-foreground">
            Status „cancelled“, nach Datum Kündigung
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
