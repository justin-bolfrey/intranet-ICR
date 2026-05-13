import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/EOey0o6eRNnC9jUdbo74qK";

export default function WhatsAppPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          WhatsApp Gruppe
        </h1>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          Tritt der offiziellen Investment Club Regensburg WhatsApp-Gruppe bei,
          um Updates und Austausch im Verein direkt mitzubekommen.
        </p>
      </div>

      <Card>
        <CardHeader className="items-center text-center">
          <Image
            src="/whatsapp-logo.png"
            alt="WhatsApp Logo"
            width={180}
            height={180}
            className="h-16 w-16"
            priority
          />
          <CardTitle>Investment Club Regensburg</CardTitle>
          <CardDescription>Offizielle WhatsApp-Gruppe des ICR</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <div className="rounded-2xl border bg-white p-4">
            <Image
              src="/whatsapp-group-qr.png"
              alt="QR-Code zur WhatsApp-Gruppe des Investment Club Regensburg"
              width={472}
              height={1024}
              className="h-auto w-64 rounded-lg md:w-72"
              priority
            />
          </div>

          <div className="flex w-full max-w-md flex-col gap-3 text-center">
            <p className="break-all rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
              {WHATSAPP_GROUP_URL}
            </p>
            <Button asChild className="w-full">
              <Link
                href={WHATSAPP_GROUP_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Gruppe in WhatsApp öffnen
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
