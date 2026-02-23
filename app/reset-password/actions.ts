"use server";

import { createClient } from "@/utils/supabase/server";

export type ResetPasswordState = {
  error: string;
  redirect?: string;
};

const MIN_PASSWORD_LENGTH = 6;

export async function resetPasswordAction(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const newPassword = (formData.get("newPassword") as string) ?? "";
  const confirmPassword = (formData.get("confirmPassword") as string) ?? "";

  if (!newPassword || !confirmPassword) {
    return { error: "Bitte beide Felder ausfüllen." };
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `Das Passwort muss mindestens ${MIN_PASSWORD_LENGTH} Zeichen haben.`,
    };
  }

  if (newPassword !== confirmPassword) {
    return { error: "Die Passwörter stimmen nicht überein." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error:
        "Deine Sitzung ist abgelaufen. Bitte fordere einen neuen Reset-Link an.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return { error: error.message };
  }

  return { error: "", redirect: "/dashboard" };
}
