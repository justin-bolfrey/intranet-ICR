"use client";

import { useActionState, useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Turnstile } from "@marsidev/react-turnstile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerAction, type RegisterSavedState } from "./actions";
import { countryCodes } from "@/lib/country-codes";
import { IbanBicFields } from "./iban-bic-fields";

const initialState = { error: "", redirect: undefined as string | undefined, saved: undefined as RegisterSavedState | undefined };

const DEFAULT_FORM: RegisterSavedState = {
  vorname: "",
  nachname: "",
  email: "",
  geburtstag: "",
  strasse: "",
  hausnummer: "",
  ort: "",
  plz: "",
  landesvorwahl: "+49",
  handynummer: "",
  student: "",
  studiengang: "",
  abschluss: "",
  semester: "",
  iban: "",
  bic: "",
  hochschultyp: "",
  sepa: false,
};

export function RegisterForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(registerAction, initialState);
  const [formValues, setFormValues] = useState<RegisterSavedState>(DEFAULT_FORM);

  useEffect(() => {
    if (state.redirect) {
      router.push(state.redirect);
      router.refresh();
    }
  }, [state.redirect, router]);

  useEffect(() => {
    if (state.saved) setFormValues(state.saved);
  }, [state.saved]);

  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const passwordRepeatRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onLocalhost =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
    setIsLocalhost(onLocalhost);
    if (onLocalhost) setTurnstileToken("localhost-bypass");
  }, []);

  const checkPasswordMatch = useCallback((pwd: string, repeat: string) => {
    const mismatch = repeat.length > 0 && pwd !== repeat;
    setPasswordMismatch(mismatch);
    passwordRepeatRef.current?.setCustomValidity(
      mismatch ? "Die Passwörter stimmen nicht überein." : ""
    );
  }, []);

  return (
    <form action={formAction} className="space-y-6">
      <p className="text-sm text-muted-foreground">
        * Pflichtfelder
      </p>
      {/* Persönliche Daten */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Persönliche Daten
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="vorname">Vorname *</Label>
            <Input
              id="vorname"
              name="vorname"
              type="text"
              placeholder="Max"
              required
              autoComplete="given-name"
              value={formValues.vorname}
              onChange={(e) => setFormValues((f) => ({ ...f, vorname: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nachname">Nachname *</Label>
            <Input
              id="nachname"
              name="nachname"
              type="text"
              placeholder="Mustermann"
              required
              autoComplete="family-name"
              value={formValues.nachname}
              onChange={(e) => setFormValues((f) => ({ ...f, nachname: e.target.value }))}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="geburtstag">Geburtstag *</Label>
          <Input
            id="geburtstag"
            name="geburtstag"
            type="date"
            required
            max={new Date().toISOString().split("T")[0]}
            autoComplete="bday"
            value={formValues.geburtstag}
            onChange={(e) => setFormValues((f) => ({ ...f, geburtstag: e.target.value }))}
          />
        </div>
      </div>

      {/* Adresse */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">Adresse</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="strasse">Straße *</Label>
            <Input
              id="strasse"
              name="strasse"
              type="text"
              placeholder="Musterstraße"
              required
              autoComplete="street-address"
              value={formValues.strasse}
              onChange={(e) => setFormValues((f) => ({ ...f, strasse: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hausnummer">Hausnummer *</Label>
            <Input
              id="hausnummer"
              name="hausnummer"
              type="text"
              placeholder="42"
              required
              value={formValues.hausnummer}
              onChange={(e) => setFormValues((f) => ({ ...f, hausnummer: e.target.value }))}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="plz">PLZ *</Label>
            <Input
              id="plz"
              name="plz"
              type="text"
              placeholder="80331"
              required
              autoComplete="postal-code"
              value={formValues.plz}
              onChange={(e) => setFormValues((f) => ({ ...f, plz: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ort">Ort *</Label>
            <Input
              id="ort"
              name="ort"
              type="text"
              placeholder="München"
              required
              autoComplete="address-level2"
              value={formValues.ort}
              onChange={(e) => setFormValues((f) => ({ ...f, ort: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Kontakt & Login */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Kontakt & Login
        </h3>
        <div className="space-y-2">
          <Label htmlFor="email">E-Mail *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="name@beispiel.de"
            required
            autoComplete="email"
            value={formValues.email}
            onChange={(e) => setFormValues((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="handynummer">Handynummer *</Label>
          <div className="flex gap-2">
            <select
              id="landesvorwahl"
              name="landesvorwahl"
              value={formValues.landesvorwahl}
              onChange={(e) => setFormValues((f) => ({ ...f, landesvorwahl: e.target.value }))}
              className="border-input bg-background focus-visible:ring-ring flex h-9 w-24 shrink-0 rounded-md border px-2 py-1 text-sm shadow-xs outline-none focus-visible:ring-2"
              aria-label="Ländervorwahl"
            >
              {countryCodes.map(({ code, dialCode }) => (
                <option key={code} value={dialCode}>
                  {dialCode} {code}
                </option>
              ))}
            </select>
            <Input
              id="handynummer"
              name="handynummer"
              type="tel"
              placeholder="171 1234567"
              required
              autoComplete="tel-national"
              className="flex-1"
              value={formValues.handynummer}
              onChange={(e) => setFormValues((f) => ({ ...f, handynummer: e.target.value }))}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Passwort *</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            minLength={6}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              checkPasswordMatch(e.target.value, passwordRepeat);
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="passwordRepeat">Passwort wiederholen *</Label>
          <Input
            ref={passwordRepeatRef}
            id="passwordRepeat"
            name="passwordRepeat"
            type="password"
            required
            autoComplete="new-password"
            value={passwordRepeat}
            onChange={(e) => {
              setPasswordRepeat(e.target.value);
              checkPasswordMatch(password, e.target.value);
            }}
            className={passwordMismatch ? "border-destructive" : ""}
            aria-invalid={passwordMismatch}
            aria-describedby={passwordMismatch ? "password-error" : undefined}
          />
          {passwordMismatch && (
            <p id="password-error" className="text-sm text-destructive" role="alert">
              Die Passwörter stimmen nicht überein.
            </p>
          )}
        </div>
      </div>

      {/* Studiendaten */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Studiendaten
        </h3>
        <div className="space-y-2">
          <Label htmlFor="student">Student *</Label>
          <select
            id="student"
            name="student"
            required
            value={formValues.student}
            onChange={(e) =>
              setFormValues((f) => ({
                ...f,
                student: e.target.value,
                ...(e.target.value === "Nein"
                  ? {
                      studiengang: "",
                      abschluss: "",
                      semester: "",
                      hochschultyp: "",
                    }
                  : {}),
              }))
            }
            className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2"
          >
            <option value="">Bitte wählen</option>
            <option value="Ja">Ja</option>
            <option value="Nein">Nein</option>
          </select>
        </div>
        {formValues.student !== "Nein" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="studiengang">Studiengang / Fach *</Label>
              <Input
                id="studiengang"
                name="studiengang"
                type="text"
                placeholder="z.B. Informatik"
                required={formValues.student === "Ja"}
                value={formValues.studiengang}
                onChange={(e) =>
                  setFormValues((f) => ({ ...f, studiengang: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="abschluss">Angestrebter Abschluss *</Label>
              <Input
                id="abschluss"
                name="abschluss"
                type="text"
                placeholder="z.B. Bachelor, Master"
                required={formValues.student === "Ja"}
                value={formValues.abschluss}
                onChange={(e) =>
                  setFormValues((f) => ({ ...f, abschluss: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="semester">Aktuelles Semester *</Label>
              <Input
                id="semester"
                name="semester"
                type="text"
                placeholder="z.B. 3"
                required={formValues.student === "Ja"}
                value={formValues.semester}
                onChange={(e) =>
                  setFormValues((f) => ({ ...f, semester: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hochschultyp">Hochschulart *</Label>
              <select
                id="hochschultyp"
                name="hochschultyp"
                required={formValues.student === "Ja"}
                value={formValues.hochschultyp}
                onChange={(e) =>
                  setFormValues((f) => ({ ...f, hochschultyp: e.target.value }))
                }
                className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2"
              >
                <option value="">Bitte wählen</option>
                <option value="Universität Regensburg">
                  Universität Regensburg
                </option>
                <option value="Ostbayerische Technische Hochschule">
                  Ostbayerische Technische Hochschule
                </option>
                <option value="sonstige">Sonstige</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* Bankverbindung */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Bankverbindung
        </h3>
        <IbanBicFields initialIban={formValues.iban} initialBic={formValues.bic} />
      </div>

      {/* SEPA */}
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <input
            id="sepa"
            name="sepa"
            type="checkbox"
            required
            checked={formValues.sepa}
            onChange={(e) => setFormValues((f) => ({ ...f, sepa: e.target.checked }))}
            className="mt-1 size-4 rounded border"
          />
          <Label htmlFor="sepa" className="cursor-pointer font-normal">
            Ich bestätige das SEPA-Lastschriftmandat für den ICR Mitgliedsbeitrag. *
          </Label>
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      {isLocalhost && turnstileToken === "localhost-bypass" && (
        <input type="hidden" name="cf-turnstile-response" value="localhost-bypass" readOnly />
      )}
      <Turnstile
        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
        onSuccess={(token) => setTurnstileToken(token)}
        onExpire={() => setTurnstileToken(null)}
        onError={() => isLocalhost && setTurnstileToken("localhost-bypass")}
        options={{ theme: "light", size: "normal" }}
      />
      <Button
        type="submit"
        className="w-full"
        disabled={!turnstileToken}
      >
        Registrieren
      </Button>
    </form>
  );
}
