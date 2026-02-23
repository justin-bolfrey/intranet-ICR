"use server";

import { createClient } from "@/utils/supabase/server";

export async function loginAction(
  _prevState: { error: string; redirect?: string },
  formData: FormData
): Promise<{ error: string; redirect?: string }> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Bitte E-Mail und Passwort eingeben." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return { error: "", redirect: "/dashboard" };
}
