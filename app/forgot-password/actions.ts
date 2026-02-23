"use server";

import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export type ForgotPasswordState = {
  error: string;
  success: boolean;
  email?: string;
};

export async function forgotPasswordAction(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const email = (formData.get("email") as string)?.trim();
  if (!email) {
    return { error: "Bitte E-Mail-Adresse eingeben.", success: false, email: "" };
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const redirectTo = `${origin}/auth/callback?next=/reset-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    return { error: error.message, success: false, email };
  }

  return { error: "", success: true, email };
}
