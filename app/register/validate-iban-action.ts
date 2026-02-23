"use server";

/**
 * Validiert IBAN via OpenIBAN API und liefert Bankdaten.
 * Kein API-Key nötig, kostenlos.
 */
export async function validateIbanAction(iban: string): Promise<{
  valid: boolean;
  bankName?: string;
  bic?: string;
  error?: string;
}> {
  const cleaned = iban.replace(/\s/g, "").trim();
  if (!cleaned || cleaned.length < 4) {
    return { valid: false, error: "IBAN eingeben" };
  }

  try {
    // validateBankCode=false: Nicht alle Banken (z.B. 10010178 Postbank) sind in der DB.
    // Format + Prüfsumme werden trotzdem validiert. Bankdaten nur wenn vorhanden.
    const res = await fetch(
      `https://openiban.com/validate/${encodeURIComponent(cleaned)}?getBIC=true&validateBankCode=false`,
      { next: { revalidate: 0 } }
    );

    if (!res.ok) {
      return { valid: false, error: "Validierung temporär nicht verfügbar." };
    }

    const data = (await res.json()) as {
      valid?: boolean;
      bankData?: { name?: string; bic?: string };
      messages?: string[];
    };

    if (data.valid) {
      return {
        valid: true,
        bankName: data.bankData?.name,
        bic: data.bankData?.bic,
      };
    }

    return {
      valid: false,
      error: data.messages?.[0] ?? "IBAN ist ungültig.",
    };
  } catch {
    return { valid: false, error: "Validierung fehlgeschlagen." };
  }
}
