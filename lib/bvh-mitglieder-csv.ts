/**
 * BVH-Mitglieder-Upload: exakte Kopfzeile laut Template (Spalten nicht ändern).
 * Komma-getrennt, UTF-8.
 */
export const BVH_MITGLIEDER_CSV_HEADER =
  "email,firstName,lastName,gender,phone,birthday,country,pcode,place,street,snumber,addition,vorstand,delete";

/** RFC-4180-ähnliches Escaping für CSV-Zellen */
export function escapeCsvField(value: string): string {
  const s = value ?? "";
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function joinCsvRow(fields: string[]): string {
  return fields.map(escapeCsvField).join(",");
}

/** Anrede → BVH gender m/f (Pflichtfeld; Fallback m) */
export function genderFromAnrede(anrede: string | null | undefined): "m" | "f" {
  const a = String(anrede ?? "")
    .trim()
    .toLowerCase();
  if (a.includes("frau") || a === "fr") return "f";
  if (a.includes("herr") || a === "hr") return "m";
  return "m";
}

/** Geburtsdatum für Spalte birthday (YYYY-MM-DD oder leer) */
export function formatBirthdayIso(raw: unknown): string {
  if (raw == null || raw === "") return "";
  const d = new Date(String(raw));
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function vorstandFromRolle(rolle: string | null | undefined): "0" | "1" {
  const r = String(rolle ?? "")
    .trim()
    .toLowerCase();
  return r === "board" || r === "admin" ? "1" : "0";
}
