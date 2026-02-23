/**
 * IBAN- und BIC-Validierung (Format + Prüfsumme).
 * Länderspezifische Längen gemäß ISO 13616.
 */

const IBAN_LENGTHS: Record<string, number> = {
  DE: 22,
  AT: 20,
  CH: 21,
  LI: 21,
  NL: 18,
  BE: 16,
  LU: 20,
  FR: 27,
  IT: 27,
  ES: 24,
  GB: 22,
  // Weitere Länder bei Bedarf erweiterbar
};

/**
 * Berechnet mod 97 für große Zahlen (IBAN-Checksumme).
 * Verarbeitet zeichenweise, um BigInt/Überlauf zu vermeiden.
 */
function mod97(str: string): number {
  let remainder = 0;
  for (let i = 0; i < str.length; i++) {
    remainder = (remainder * 10 + parseInt(str[i], 10)) % 97;
  }
  return remainder;
}

/**
 * Validiert IBAN (Format + Prüfsumme).
 */
export function validateIBAN(iban: string): boolean {
  const cleaned = iban.replace(/\s/g, "").toUpperCase();

  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(cleaned)) {
    return false;
  }

  const country = cleaned.slice(0, 2);
  const expectedLength = IBAN_LENGTHS[country];
  if (expectedLength && cleaned.length !== expectedLength) {
    return false;
  }

  const rearranged =
    cleaned.slice(4) + cleaned.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (c) =>
    (c.charCodeAt(0) - 55).toString()
  );

  return mod97(numeric) === 1;
}

/**
 * Validiert BIC-Format (8 oder 11 Zeichen, alphanumerisch).
 */
export function validateBICFormat(bic: string): boolean {
  const cleaned = bic.replace(/\s/g, "").toUpperCase();
  return /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(cleaned);
}

/**
 * Formatiert IBAN zur Anzeige (4er-Blöcke).
 */
export function formatIBAN(iban: string): string {
  return iban
    .replace(/\s/g, "")
    .toUpperCase()
    .replace(/(.{4})/g, "$1 ")
    .trim();
}
