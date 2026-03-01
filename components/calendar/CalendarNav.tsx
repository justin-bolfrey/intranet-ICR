"use client";

import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

type Props = {
  year: number;
  month: number; // 1–12
};

export function CalendarNav({ year, month }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function goTo( y: number, m: number ) {
    const params = new URLSearchParams();
    params.set("year", String(y));
    params.set("month", String(m));
    router.push(`${pathname}?${params.toString()}`);
  }

  function prevMonth() {
    if (month === 1) goTo(year - 1, 12);
    else goTo(year, month - 1);
  }

  function nextMonth() {
    if (month === 12) goTo(year + 1, 1);
    else goTo(year, month + 1);
  }

  function goToday() {
    const now = new Date();
    goTo(now.getFullYear(), now.getMonth() + 1);
  }

  const years: number[] = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear - 2; y <= currentYear + 3; y++) years.push(y);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={prevMonth}
          aria-label="Vorheriger Monat"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={nextMonth}
          aria-label="Nächster Monat"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={goToday}>
          Heute
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <select
          value={month}
          onChange={(e) => goTo(year, Number(e.target.value))}
          className="border-input bg-background h-9 rounded-md border px-3 py-1.5 text-sm font-medium shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring min-w-[120px] cursor-pointer"
          aria-label="Monat wählen"
        >
          {MONTHS.map((name, i) => (
            <option key={i} value={i + 1}>
              {name}
            </option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => goTo(Number(e.target.value), month)}
          className="border-input bg-background h-9 rounded-md border px-3 py-1.5 text-sm font-medium shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring min-w-[88px] cursor-pointer"
          aria-label="Jahr wählen"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
