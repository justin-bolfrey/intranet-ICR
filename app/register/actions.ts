"use server";
import { createClient } from "@/utils/supabase/server";
import { validateIBAN, validateBICFormat } from "@/lib/iban";

/** Bei Fehler zurückgegebene Formulardaten (ohne Passwörter) für erneute Anzeige. */
export type RegisterSavedState = {
  vorname: string;
  nachname: string;
  email: string;
  geburtstag: string;
  strasse: string;
  hausnummer: string;
  ort: string;
  plz: string;
  landesvorwahl: string;
  handynummer: string;
  student: string;
  studiengang: string;
  abschluss: string;
  semester: string;
  iban: string;
  bic: string;
  hochschultyp: string;
  sepa: boolean;
};

/**
 * Validiert Datum im ISO-Format YYYY-MM-DD (vom Date-Picker).
 */
function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

export async function registerAction(
  _prevState: { error: string },
  formData: FormData
): Promise<{ error: string; redirect?: string; saved?: RegisterSavedState }> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const passwordRepeat = formData.get("passwordRepeat") as string;
  const vorname = (formData.get("vorname") as string)?.trim();
  const nachname = (formData.get("nachname") as string)?.trim();
  const geburtstagRaw = (formData.get("geburtstag") as string)?.trim();
  const strasse = (formData.get("strasse") as string)?.trim();
  const hausnummer = (formData.get("hausnummer") as string)?.trim();
  const ort = (formData.get("ort") as string)?.trim();
  const plz = (formData.get("plz") as string)?.trim();
  const landesvorwahl = (formData.get("landesvorwahl") as string)?.trim() || "+49";
  const handynummerRaw = (formData.get("handynummer") as string)?.trim();
  const handynummer = handynummerRaw
    ? `${landesvorwahl} ${handynummerRaw}`.trim()
    : "";
  const student = formData.get("student") as string;
  const studiengang = (formData.get("studiengang") as string)?.trim();
  const abschluss = (formData.get("abschluss") as string)?.trim();
  const semester = (formData.get("semester") as string)?.trim();
  const iban = (formData.get("iban") as string)?.trim();
  const bic = (formData.get("bic") as string)?.trim();
  const hochschultyp = formData.get("hochschultyp") as string;
  const sepa = formData.get("sepa") === "on";

  /** Bei Fehler zurückgeben, damit die Eingaben im Formular erhalten bleiben (keine Passwörter). */
  const saved: RegisterSavedState = {
    vorname: vorname ?? "",
    nachname: nachname ?? "",
    email: email ?? "",
    geburtstag: geburtstagRaw ?? "",
    strasse: strasse ?? "",
    hausnummer: hausnummer ?? "",
    ort: ort ?? "",
    plz: plz ?? "",
    landesvorwahl: landesvorwahl ?? "+49",
    handynummer: handynummerRaw ?? "",
    student: student ?? "",
    studiengang: studiengang ?? "",
    abschluss: abschluss ?? "",
    semester: semester ?? "",
    iban: iban ?? "",
    bic: bic ?? "",
    hochschultyp: hochschultyp ?? "",
    sepa,
  };

  // Validierung Pflichtfelder
  const required: Record<string, unknown> = {
    email,
    password,
    passwordRepeat,
    vorname,
    nachname,
    geburtstag: geburtstagRaw,
    strasse,
    hausnummer,
    ort,
    plz,
    handynummer: handynummerRaw,
    student,
    iban,
    bic,
  };

  // Studiendaten sind nur Pflicht, wenn "Student = Ja"
  if (student === "Ja") {
    required.studiengang = studiengang;
    required.abschluss = abschluss;
    required.semester = semester;
    required.hochschultyp = hochschultyp;
  }
  const missing = Object.entries(required)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length > 0) {
    return { error: "Bitte alle Pflichtfelder ausfüllen.", saved };
  }

  if (!sepa) {
    return { error: "Die SEPA-Bestätigung ist erforderlich.", saved };
  }

  if (password !== passwordRepeat) {
    return { error: "Die Passwörter stimmen nicht überein.", saved };
  }

  if (!isValidDate(geburtstagRaw!)) {
    return { error: "Bitte wähle ein gültiges Geburtsdatum im Picker aus.", saved };
  }
  const geburtstag = geburtstagRaw!;

  const ibanClean = iban!.replace(/\s/g, "");
  const bicClean = bic!.replace(/\s/g, "");

  if (!validateIBAN(ibanClean)) {
    return { error: "Die IBAN ist ungültig.", saved };
  }

  if (!validateBICFormat(bicClean)) {
    return { error: "Die BIC ist ungültig (8 oder 11 Zeichen).", saved };
  }

  // Turnstile Bot-Schutz validieren (VOR signUp)
  const turnstileToken = formData.get("cf-turnstile-response") as string | null;
  if (!turnstileToken?.trim()) {
    return { error: "Bot-Schutz fehlgeschlagen. Bitte bestätige, dass du kein Bot bist.", saved };
  }

  const isLocalhostBypass =
    turnstileToken === "localhost-bypass" && process.env.NODE_ENV === "development";

  if (!isLocalhostBypass) {
    const turnstileRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY ?? "",
        response: turnstileToken,
      }),
    });

    const turnstileData = (await turnstileRes.json()) as { success?: boolean };
    if (!turnstileData.success) {
      return { error: "Bot-Schutz fehlgeschlagen. Bitte versuche es erneut.", saved };
    }
  }

  const supabase = await createClient();

  // options.data: Keys exakt wie vom SQL-Trigger erwartet (raw_user_meta_data->>'Vorname' etc.).
  console.log("PAYLOAD CHECK:", formData.get("vorname"));

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: email!,
    password: password!,
    options: {
      data: {
        Vorname: formData.get("vorname"),
        Nachname: formData.get("nachname"),
        Geburtsdatum: formData.get("geburtstag"),
        "Straße": formData.get("strasse"),
        Hausnr: formData.get("hausnummer"),
        Ort: formData.get("ort"),
        PLZ: formData.get("plz"),
        Handynummer: handynummer, // Vorwahl + Nummer (bereits aus formData zusammengesetzt)
        Fach: formData.get("studiengang"),
        Abschluss: formData.get("abschluss"),
        Semester: formData.get("semester"),
        "Uni/OTH": formData.get("hochschultyp"),
        IBAN: ibanClean,
        BIC: bicClean,
        "Sepa-Bestätigung": formData.get("sepa") === "on" || formData.get("sepa") === "true",
      },
    },
  });

  if (signUpError) {
    return { error: signUpError.message, saved };
  }

  if (!authData.user) {
    return { error: "Registrierung fehlgeschlagen. Bitte erneut versuchen.", saved };
  }

  return { error: "", redirect: "/dashboard" };
}
