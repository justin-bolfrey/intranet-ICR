import { cache } from "react";
import { createClient } from "@/utils/supabase/server";

/**
 * Ein Supabase-Client pro Request (wird von Layouts und Seiten geteilt).
 * Vermeidet mehrfache createClient()- und Auth-Aufrufe pro Seitenaufruf.
 */
export const getCachedSupabase = cache(async () => createClient());

/**
 * Aktueller User, einmal pro Request gecacht.
 */
export const getCachedUser = cache(async () => {
  const supabase = await getCachedSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * User + Profil (nur Layout-relevante Felder), einmal pro Request gecacht.
 */
export const getCachedAuth = cache(async () => {
  const user = await getCachedUser();
  if (!user) return { user: null, profile: null };

  const supabase = await getCachedSupabase();
  const { data: profile } = await supabase
    .from("profiles")
    .select("Vorname, Nachname, Rolle, letzter_news_aufruf")
    .eq("user_id", user.id)
    .maybeSingle();

  return { user, profile };
});
