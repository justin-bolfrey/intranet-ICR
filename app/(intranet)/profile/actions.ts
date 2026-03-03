"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export type ProfileActionState = {
  success: boolean;
  error: string;
};

export async function updateProfile(
  _prev: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Nicht eingeloggt." };
  }

  const strasse = (formData.get("strasse") as string | null)?.trim() ?? "";
  const hausnummer = (formData.get("hausnummer") as string | null)?.trim() ?? "";
  const plz = (formData.get("plz") as string | null)?.trim() ?? "";
  const ort = (formData.get("ort") as string | null)?.trim() ?? "";
  const mobil = (formData.get("mobil") as string | null)?.trim() ?? "";
  const ibanRaw = (formData.get("iban") as string | null) ?? "";
  const bicRaw = (formData.get("bic") as string | null) ?? "";

  const iban = ibanRaw.replace(/\s/g, "").toUpperCase();
  const bic = bicRaw.replace(/\s/g, "").toUpperCase();

  const { error } = await supabase
    .from("profiles")
    .update({
      "Straße": strasse,
      Hausnummer: hausnummer,
      PLZ: plz,
      Ort: ort,
      Handynummer: mobil,
      IBAN: iban,
      BIC: bic,
    })
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: `Fehler beim Speichern: ${error.message}` };
  }

  revalidatePath("/profile");
  return { success: true, error: "" };
}

export async function cancelMembership(): Promise<ProfileActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Nicht eingeloggt." };
  }

  const cancelledAt = new Date().toISOString();

  // 1) Primärer Write-Path: neue Felder `status` + `cancelled_at`
  // Fallback auf Legacy-Spalten, falls die neue Struktur noch nicht existiert.
  let { error } = await supabase
    .from("profiles")
    .update({
      status: "cancelled",
      cancelled_at: cancelledAt,
    })
    .eq("user_id", user.id);

  if (error) {
    const fallback = await supabase
      .from("profiles")
      .update({
        Status: "cancelled",
        "Datum_Kündigung": cancelledAt,
      })
      .eq("user_id", user.id);
    error = fallback.error;
  }

  if (error) {
    return { success: false, error: `Fehler bei der Kündigung: ${error.message}` };
  }

  // 2) Session killen
  const { error: signOutError } = await supabase.auth.signOut();
  if (signOutError) {
    return {
      success: false,
      error: `Kündigung gespeichert, aber Abmeldung fehlgeschlagen: ${signOutError.message}`,
    };
  }

  // 3) Layout-Cache invalidieren
  revalidatePath("/", "layout");

  // 4) Harte Weiterleitung zum Login
  redirect("/login");
}
