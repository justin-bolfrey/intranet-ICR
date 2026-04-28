"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  getFinanceExportData,
  type Semester,
  type FinanceMemberRow,
  type InvalidFinanceMemberRow,
  type FilterStats,
} from "@/app/(intranet)/admin/actions/finance";
import {
  buildSepaIdentifier,
  escapeXml,
  sanitizeNameForBank,
} from "@/lib/sepa";

const MIN_YEAR = 2000;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

type ExportWarningRow = {
  id: string;
  displayName: string;
  issues: string[];
};

function getMaxYear() {
  return new Date().getFullYear() + 1;
}

function getPeriodLabel(semester: Semester, year: number): string {
  const yy = String(year).slice(-2);
  if (semester === "WiSe") {
    const yyNext = String(year + 1).slice(-2);
    return `WS${yy}/${yyNext}`;
  }
  return `SS${yy}`;
}

function getExportWarnings(rows: FinanceMemberRow[]): ExportWarningRow[] {
  return rows
    .map((row) => {
      const issues: string[] = [];
      const originalName = `${row.firstName} ${row.lastName}`.trim();
      const sanitizedName = sanitizeNameForBank(originalName);

      if (!sanitizedName) {
        issues.push("Name wird nach Bereinigung leer.");
      }
      if (sanitizedName !== originalName) {
        issues.push("Name wurde für Bankformat verändert (z. B. Bindestrich/Sonderzeichen).");
      }
      if (sanitizedName.length > 70) {
        issues.push("Name ist sehr lang (>70 Zeichen).");
      }

      const normalizedMandateId = buildSepaIdentifier(row.id, 35);
      if (!normalizedMandateId) {
        issues.push("Mandatsreferenz ist leer nach Normalisierung.");
      }
      if (row.id !== normalizedMandateId) {
        issues.push("Mandatsreferenz wurde gekürzt/normalisiert.");
      }
      if (row.id.length > 35) {
        issues.push("Mandatsreferenz war länger als 35 Zeichen.");
      }

      if (!row.bic) {
        issues.push("BIC fehlt (kann je nach Bank problematisch sein).");
      } else {
        const normalizedBic = buildSepaIdentifier(row.bic, 11);
        if (normalizedBic !== row.bic) {
          issues.push("BIC wurde normalisiert.");
        }
      }

      if (!row.mandateDate) {
        issues.push("Mandatsdatum fehlt (Export nutzt Tagesdatum als Fallback).");
      } else if (!ISO_DATE_REGEX.test(row.mandateDate)) {
        issues.push("Mandatsdatum ist nicht im Format YYYY-MM-DD.");
      }

      return {
        id: row.id,
        displayName: originalName || row.id,
        issues,
      };
    })
    .filter((row) => row.issues.length > 0);
}

export function FinanceExport() {
  const currentYear = new Date().getFullYear();
  const [semester, setSemester] = useState<Semester>("SoSe");
  const [year, setYear] = useState<number>(currentYear);
  const maxYear = getMaxYear();
  const [validMembers, setValidMembers] = useState<FinanceMemberRow[]>([]);
  const [invalidMembers, setInvalidMembers] = useState<InvalidFinanceMemberRow[]>([]);
  const [stats, setStats] = useState<FilterStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const exportWarnings = getExportWarnings(validMembers);

  const handleLoadPreview = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const { validMembers, invalidMembers, stats: newStats } =
        await getFinanceExportData(semester, year);
      setValidMembers(validMembers);
      setInvalidMembers(invalidMembers);
      setStats(newStats);
    } catch (err) {
      console.error("Fehler beim Laden der Daten:", err);
      setValidMembers([]);
      setInvalidMembers([]);
      setStats(null);
      setError(
        err instanceof Error
          ? err.message
          : "Es gab einen Fehler beim Laden der Daten."
      );
    } finally {
      setIsLoading(false);
    }
  };

  function handleExportCsv() {
    if (!validMembers.length) return;

    const header = "Name;IBAN;BIC;Betrag;Mandatsreferenz";
    const lines = validMembers.map((row) => {
      const name = `${row.firstName} ${row.lastName}`.trim();
      const amount = row.amount.toFixed(2).replace(".", ",");
      return [name, row.iban, row.bic, amount, row.id].join(";");
    });
    const csv = [header, ...lines].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const today = new Date();
    const fileName = `sepa_export_${today.toISOString().slice(0, 10)}.csv`;
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleExportSepaXml() {
    if (!validMembers.length) return;

    const today = new Date().toISOString().slice(0, 10);
    const periodLabel = getPeriodLabel(semester, year);
    const periodToken = buildSepaIdentifier(periodLabel, 10) || "PERIODE";
    const messageId =
      buildSepaIdentifier(`ICRBEITRAG${periodToken}${today.replace(/-/g, "")}`) ||
      "ICRBEITRAG";

    const totalAmount = validMembers
      .reduce((sum, row) => sum + row.amount, 0)
      .toFixed(2);

    const creditorName = "Investmentclub Regensburg e.V.";
    const creditorIban = "DE79750500000026907543";
    const creditorBic = "BYLADEM1RBG";
    const creditorId = "DE58ZZZ00001948916";

    const txInfos = validMembers
      .map((row, idx) => {
        const nameRaw = `${row.firstName} ${row.lastName}`.trim();
        const name = sanitizeNameForBank(nameRaw) || "MITGLIED";
        const amount = row.amount.toFixed(2);
        const mndtId = buildSepaIdentifier(row.id, 35) || `MANDAT${idx + 1}`;
        const endToEndId =
          buildSepaIdentifier(`${messageId}${idx + 1}`, 35) || `E2E${idx + 1}`;
        const dtOfSgntr = row.mandateDate ?? today;
        const bic = buildSepaIdentifier(row.bic, 11);

        return `
      <DrctDbtTxInf>
        <PmtId>
          <EndToEndId>${escapeXml(endToEndId)}</EndToEndId>
        </PmtId>
        <InstdAmt Ccy="EUR">${amount}</InstdAmt>
        <DrctDbtTx>
          <MndtRltdInf>
            <MndtId>${escapeXml(mndtId)}</MndtId>
            <DtOfSgntr>${dtOfSgntr}</DtOfSgntr>
          </MndtRltdInf>
        </DrctDbtTx>
        ${
          bic
            ? `<DbtrAgt>
          <FinInstnId>
            <BIC>${escapeXml(bic)}</BIC>
          </FinInstnId>
        </DbtrAgt>`
            : ""
        }
        <Dbtr>
          <Nm>${escapeXml(name)}</Nm>
        </Dbtr>
        <DbtrAcct>
          <Id>
            <IBAN>${escapeXml(row.iban)}</IBAN>
          </Id>
        </DbtrAcct>
      </DrctDbtTxInf>`;
      })
      .join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.008.001.02">
  <CstmrDrctDbtInitn>
    <GrpHdr>
      <MsgId>${escapeXml(messageId)}</MsgId>
      <CreDtTm>${today}T00:00:00</CreDtTm>
      <NbOfTxs>${validMembers.length}</NbOfTxs>
      <CtrlSum>${totalAmount}</CtrlSum>
      <InitgPty>
        <Nm>${escapeXml(creditorName)}</Nm>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${escapeXml(messageId)}</PmtInfId>
      <PmtMtd>DD</PmtMtd>
      <NbOfTxs>${validMembers.length}</NbOfTxs>
      <CtrlSum>${totalAmount}</CtrlSum>
      <PmtTpInf>
        <SvcLvl>
          <Cd>SEPA</Cd>
        </SvcLvl>
        <LclInstrm>
          <Cd>CORE</Cd>
        </LclInstrm>
        <SeqTp>RCUR</SeqTp>
      </PmtTpInf>
      <ReqdColltnDt>${today}</ReqdColltnDt>
      <Cdtr>
        <Nm>${escapeXml(creditorName)}</Nm>
      </Cdtr>
      <CdtrAcct>
        <Id>
          <IBAN>${escapeXml(creditorIban)}</IBAN>
        </Id>
      </CdtrAcct>
      <CdtrAgt>
        <FinInstnId>
          <BIC>${escapeXml(creditorBic)}</BIC>
        </FinInstnId>
      </CdtrAgt>
      <CdtrSchmeId>
        <Id>
          <PrvtId>
            <Othr>
              <Id>${escapeXml(creditorId)}</Id>
            </Othr>
          </PrvtId>
        </Id>
      </CdtrSchmeId>
      ${txInfos}
    </PmtInf>
  </CstmrDrctDbtInitn>
</Document>`;

    const blob = new Blob([xml], { type: "application/xml;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const fileName = `sepa_export_${today}.xml`;
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Semester
            </Label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value as Semester)}
              className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2"
            >
              <option value="SoSe">Sommersemester</option>
              <option value="WiSe">Wintersemester</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Jahr
            </Label>
            <div className="flex h-9 w-full items-center overflow-hidden rounded-md border border-input bg-background">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-none border-r border-input"
                onClick={() => setYear((y) => Math.max(MIN_YEAR, y - 1))}
                disabled={year <= MIN_YEAR}
                aria-label="Jahr zurück"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span
                className={`min-w-16 flex-1 text-center text-sm font-medium tabular-nums ${semester === "WiSe" ? "min-w-24" : ""}`}
              >
                {semester === "WiSe" ? `${year}/${year + 1}` : year}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-none border-l border-input"
                onClick={() => setYear((y) => Math.min(maxYear, y + 1))}
                disabled={year >= maxYear}
                aria-label="Jahr vor"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              className="w-full"
              onClick={handleLoadPreview}
              disabled={isLoading}
            >
              {isLoading ? "Lädt..." : "Vorschau laden"}
            </Button>
          </div>
        </div>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {semester === "SoSe" ? (
            <>Sommersemester {year}: Stichtag 15.03.{year}. Alle Eintritte ab Stichtag gelten als Freisemester.</>
          ) : (
            <>Wintersemester {year}/{year + 1}: Stichtag 01.10.{year}. Alle Eintritte ab Stichtag gelten als Freisemester.</>
          )}
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {[
            { label: "Gesamt", value: stats.total, color: "text-foreground" },
            { label: "Gültig", value: stats.valid, color: "text-green-600" },
            { label: "Ohne IBAN", value: stats.noIban, color: "text-amber-600" },
            { label: "Bewerber", value: stats.applicant, color: "text-amber-600" },
            { label: "Gekündigt", value: stats.cancelled, color: "text-red-600" },
            { label: "Freisemester", value: stats.freeSemester, color: "text-blue-600" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-md border bg-card p-3 text-center"
            >
              <p className={`text-2xl font-semibold ${item.color}`}>
                {item.value}
              </p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {!isLoading && !error && validMembers.length === 0 && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Es wurden 0 Mitglieder für diese Periode gefunden. (Möglicherweise
          greifen die Filter für Freisemester, Kündigungen oder fehlende IBANs.)
        </div>
      )}

      {invalidMembers.length > 0 && (
        <div className="space-y-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <p className="font-semibold">
            Achtung: Diese Mitglieder haben ungültige Bankdaten und wurden vom Export
            ausgeschlossen. Bitte manuell kontaktieren.
          </p>
          <div className="overflow-x-auto rounded-md border border-red-200 bg-white/80">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>IBAN</TableHead>
                  <TableHead>BIC</TableHead>
                  <TableHead>E-Mail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invalidMembers.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      {row.firstName} {row.lastName}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {row.iban || "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {row.bic || "—"}
                    </TableCell>
                    <TableCell className="text-xs">{row.email || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {validMembers.length > 0 && (
        <div className="space-y-3">
          <div className="rounded-md border bg-card p-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vorname</TableHead>
                  <TableHead>Nachname</TableHead>
                  <TableHead>IBAN</TableHead>
                  <TableHead>BIC</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Eintrittsdatum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {validMembers.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.firstName}</TableCell>
                    <TableCell>{row.lastName}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {row.iban}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {row.bic || "–"}
                    </TableCell>
                    <TableCell className="capitalize">
                      {row.status || "unbekannt"}
                    </TableCell>
                    <TableCell>
                      {row.joinedAt
                        ? format(new Date(row.joinedAt), "dd.MM.yyyy")
                        : "–"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {exportWarnings.length > 0 && (
            <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-semibold">
                Vorab-Prüfung: {exportWarnings.length} Datensätze mit potenziellen Bank-Risiken
              </p>
              <p className="text-xs text-amber-800">
                Der Export bleibt möglich, aber bitte diese Einträge prüfen.
              </p>
              <div className="overflow-x-auto rounded-md border border-amber-200 bg-white/90">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Mandatsreferenz</TableHead>
                      <TableHead>Hinweise</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exportWarnings.map((row) => (
                      <TableRow key={`warning-${row.id}`}>
                        <TableCell>{row.displayName}</TableCell>
                        <TableCell className="font-mono text-xs">{row.id}</TableCell>
                        <TableCell className="text-xs">{row.issues.join(" | ")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExportCsv}>
              Als CSV exportieren
            </Button>
            <Button variant="outline" onClick={handleExportSepaXml}>
              Als SEPA XML exportieren
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

