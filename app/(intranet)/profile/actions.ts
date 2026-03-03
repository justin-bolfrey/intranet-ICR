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

  // 1) Datenbank-Update (Legacy-Felder zuerst, da diese im aktuellen Intranet aktiv verwendet werden)
  const legacyUpdate = await supabase
    .from("profiles")
    .update({
      Status: "cancelled",
      "Datum_Kündigung": cancelledAt,
    })
    .eq("user_id", user.id)
    .select("user_id")
    .maybeSingle();

  let updateWorked = !legacyUpdate.error && !!legacyUpdate.data;
  let updateErrorMessage = legacyUpdate.error?.message ?? "";

  // Falls Legacy-Spalten nicht existieren: Fallback auf neue Feldnamen.
  if (!updateWorked) {
    const modernUpdate = await supabase
      .from("profiles")
      .update({
        status: "cancelled",
        cancelled_at: cancelledAt,
      })
      .eq("user_id", user.id)
      .select("user_id")
      .maybeSingle();

    updateWorked = !modernUpdate.error && !!modernUpdate.data;
    updateErrorMessage =
      modernUpdate.error?.message || updateErrorMessage || "Profil konnte nicht aktualisiert werden.";
  } else {
    // Best effort: neue Felder zusätzlich mitschreiben, falls vorhanden.
    await supabase
      .from("profiles")
      .update({
        status: "cancelled",
        cancelled_at: cancelledAt,
      })
      .eq("user_id", user.id);
  }

  if (!updateWorked) {
    return {
      success: false,
      error: `Fehler bei der Kündigung: ${updateErrorMessage}`,
    };
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
