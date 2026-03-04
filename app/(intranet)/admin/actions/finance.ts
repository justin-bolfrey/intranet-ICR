"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { sanitizeForSEPA } from "@/lib/sepa";
import { validateIBAN, validateBICFormat } from "@/lib/iban";

export type Semester = "SoSe" | "WiSe";

export type FinanceMemberRow = {
  id: string;
  firstName: string;
  lastName: string;
  iban: string;
  bic: string;
  status: string;
  joinedAt: string | null;
  mandateDate: string | null;
  amount: number;
};

export type InvalidFinanceMemberRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  iban: string;
  bic: string;
  status: string;
};

export type FilterStats = {
  total: number;
  noIban: number;
  applicant: number;
  cancelled: number;
  freeSemester: number;
  valid: number;
};

export type FinanceExportResult = {
  validMembers: FinanceMemberRow[];
  invalidMembers: InvalidFinanceMemberRow[];
  stats: FilterStats;
};

export type FinanceExportState = {
  error: string;
  semester: Semester;
  year: number;
  rows: FinanceMemberRow[];
};

function getPeriodStart(semester: Semester, year: number): Date {
  if (semester === "SoSe") {
    return new Date(year, 2, 15); // 15.03.YYYY (Monat 2, 0-basiert)
  }
  return new Date(year, 9, 1); // 01.10.YYYY (Monat 9, 0-basiert)
}

export async function getFinanceExportData(
  semester: Semester,
  year: number
): Promise<FinanceExportResult> {
  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const periodStart = getPeriodStart(semester, year);

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(
      '"id", "Vorname", "Nachname", "IBAN", "BIC", "Status", "Datum_Kündigung", "Datum_Antrag", "E-Mail"'
    );

  if (error || !profiles) {
    throw new Error("Fehler beim Laden der Profile aus der Datenbank.");
  }

  const validMembers: FinanceMemberRow[] = [];
  const invalidMembers: InvalidFinanceMemberRow[] = [];
  const stats = {
    total: profiles.length,
    noIban: 0,
    applicant: 0,
    cancelled: 0,
    freeSemester: 0,
    valid: 0,
  };

  for (const profile of profiles as { [key: string]: unknown }[]) {
    // 1. IBAN Check
    const ibanRaw = profile["IBAN"];
    const ibanClean =
      typeof ibanRaw === "string" ? ibanRaw.replace(/\s/g, "").toUpperCase() : "";
    if (!ibanClean) {
      stats.noIban++;
      continue;
    }

    // 2. Status Check
    const statusRaw = profile["Status"];
    const status =
      typeof statusRaw === "string" ? statusRaw.trim().toLowerCase() : "";
    if (status === "applicant") {
      stats.applicant++;
      continue;
    }

    // 3. Kündigungs-Check
    const cancelRaw = profile["Datum_Kündigung"];
    if (typeof cancelRaw === "string" && cancelRaw) {
      const cancelDate = new Date(cancelRaw);
      if (!Number.isNaN(cancelDate.getTime()) && cancelDate < periodStart) {
        stats.cancelled++;
        continue;
      }
    }

    // 4. Freisemester-Check
    const joinedRaw = profile["Datum_Antrag"];
    let joinedAt: string | null = null;
    if (typeof joinedRaw === "string" && joinedRaw) {
      const joinedDate = new Date(joinedRaw);
      if (!Number.isNaN(joinedDate.getTime())) {
        joinedAt = joinedDate.toISOString().slice(0, 10);
        if (joinedDate >= periodStart) {
          stats.freeSemester++;
          continue;
        }
      }
    }

    const firstNameRaw = profile["Vorname"];
    const lastNameRaw = profile["Nachname"];
    const firstName = sanitizeForSEPA(
      typeof firstNameRaw === "string" ? firstNameRaw.trim() : ""
    );
    const lastName = sanitizeForSEPA(
      typeof lastNameRaw === "string" ? lastNameRaw.trim() : ""
    );

    const emailRaw = profile["E-Mail"];
    const email =
      typeof emailRaw === "string" ? emailRaw.trim() : "";

    const bicRaw = profile["BIC"];
    const bicClean =
      typeof bicRaw === "string" ? bicRaw.replace(/\s/g, "").toUpperCase() : "";

    const idValue = (profile as { id?: unknown }).id;
    const id = typeof idValue === "string" ? idValue : String(idValue ?? "");

    const mandateDate = joinedAt ?? new Date().toISOString().slice(0, 10);
    const amount = 15.0;
    const ibanValid = validateIBAN(ibanClean);
    const bicValid = !bicClean || validateBICFormat(bicClean);

    if (ibanValid && bicValid) {
      validMembers.push({
        id,
        firstName,
        lastName,
        iban: ibanClean,
        bic: bicClean,
        status,
        joinedAt,
        mandateDate,
        amount,
      });
    } else {
      invalidMembers.push({
        id,
        firstName,
        lastName,
        email,
        iban: ibanClean,
        bic: bicClean,
        status,
      });
    }
  }

  stats.valid = validMembers.length;
  console.log(`--- SEPA EXPORT FILTER STATS (${semester} ${year}) ---`, stats);

  return { validMembers, invalidMembers, stats };
}

export async function getFinanceExportDataAction(
  _prevState: FinanceExportState,
  formData: FormData
): Promise<FinanceExportState> {
  const semesterValue = (formData.get("semester") as string) ?? "";
  const yearValue = Number(formData.get("year") ?? new Date().getFullYear());

  const semester = (semesterValue as Semester) || "SoSe";

  if (Number.isNaN(yearValue) || yearValue < 2000 || yearValue > 2100) {
    return {
      error: "Bitte ein gültiges Jahr angeben.",
      semester,
      year: new Date().getFullYear(),
      rows: [],
    };
  }

  try {
    const { validMembers } = await getFinanceExportData(semester, yearValue);
    return {
      error: "",
      semester,
      year: yearValue,
      rows: validMembers,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unbekannter Fehler beim Laden.";
    return {
      error: message,
      semester,
      year: yearValue,
      rows: [],
    };
  }
}

