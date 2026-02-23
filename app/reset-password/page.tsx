import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/utils/supabase/server";
import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Neues Passwort vergeben</CardTitle>
          <CardDescription>
            Gib dein neues Passwort ein und bestätige es. Danach wirst du zum
            Dashboard weitergeleitet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-primary hover:underline">
              Zurück zum Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
