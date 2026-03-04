export function sanitizeForSEPA(text: string | null | undefined): string {
  if (!text) return "";

  let sanitized = text
    // 1. Deutsche Umlaute sicher umwandeln
    .replace(/Ä/g, "Ae")
    .replace(/ä/g, "ae")
    .replace(/Ö/g, "Oe")
    .replace(/ö/g, "oe")
    .replace(/Ü/g, "Ue")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss");

  // 2. Akzente (é, à, ô etc.) radikal entfernen
  sanitized = sanitized.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 3. Alles löschen, was nicht dem offiziellen SEPA-Zeichensatz entspricht
  // Erlaubt sind A-Z, a-z, 0-9, Leerzeichen und / - ? : ( ) . , ' +
  sanitized = sanitized.replace(/[^a-zA-Z0-9 \/\-\?\:\(\)\.,'\+]/g, " ");

  // 4. Doppelte Leerzeichen, die durch das Löschen entstanden sind, bereinigen
  return sanitized.replace(/\s+/g, " ").trim();
}

