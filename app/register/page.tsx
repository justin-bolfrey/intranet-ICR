import Link from "next/link";
import Image from "next/image";
import { RegisterForm } from "./register-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-4xl space-y-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <Image
            src="/icr-logo.png"
            alt="ICR Regensburg Logo"
            width={64}
            height={64}
            className="h-16 w-16 rounded-xl bg-white p-1 shadow-sm"
            priority
          />
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
              Jetzt Mitglied werden
            </h1>
          </div>
        </div>

        <div className="mx-auto w-full max-w-2xl">
          <Card className="max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Registrieren</CardTitle>
              <CardDescription>
                Erstelle dein Konto für das ICR Intranet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RegisterForm />
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Mit der Registrierung akzeptierst du die{" "}
                <Link
                  href="/dokumente/vereinssatzung.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  Vereinssatzung
                </Link>
                .
              </p>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Bereits ein Konto?{" "}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Zum Login
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
