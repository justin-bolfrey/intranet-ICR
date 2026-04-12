"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { requestBvhLogin } from "@/app/(intranet)/magazines/actions";

const BVH_LOGIN_URL =
  "https://bvhev.ciamlogin.com/30e45d3e-e384-4d3c-ae5c-00810ddc692f/oauth2/v2.0/authorize?client_id=5130d735-c612-4907-a371-41687b298f50&response_type=code&redirect_uri=https%3A%2F%2Fbvh.org%2Fassets%2Fauth_external%2Fcallback.php&scope=openid+profile+email&state=d302184aff68bb60e7caafa819f980ea&nonce=34bbb217702495aee6ff9d6219a752ba&code_challenge=6cV_m-h3EUVy6pR5KC3XWi5JBrpF8uUKtiBFa3ciRsA&code_challenge_method=S256&prompt=login";

type Props = { hasAlreadyRequested: boolean; handled?: boolean };

export function BvhLoginSection({
  hasAlreadyRequested: initialRequested,
  handled: initialHandled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasRequested, setHasRequested] = useState(initialRequested);
  const [handled] = useState(initialHandled);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const buttonDisabled = hasRequested;
  const buttonLabel = !hasRequested
    ? "BVH-Logindaten beantragen"
    : handled
      ? "Login-Daten per E-Mail versendet"
      : "Anfrage bereits gestellt";

  async function handleRequest() {
    setLoading(true);
    setMessage(null);
    const result = await requestBvhLogin();
    setLoading(false);
    if (result.ok) {
      setHasRequested(true);
      setMessage({ type: "success", text: "Anfrage wurde gesendet. Der Vorstand wird sich bei dir melden." });
      setTimeout(() => setOpen(false), 2000);
    } else {
      setMessage({ type: "error", text: result.error ?? "Fehler beim Senden." });
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button variant="default" size="lg" asChild>
        <Link href={BVH_LOGIN_URL} target="_blank" rel="noopener noreferrer">
          Zum BVH-Login
        </Link>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="lg" disabled={buttonDisabled}>
            {buttonLabel}
          </Button>
        </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>BVH-Logindaten beantragen</DialogTitle>
              <DialogDescription>
                Du hast noch keine Zugangsdaten für den BVH-Bereich? Hier kannst du sie anfordern.
                Deine Anfrage geht an den Vorstand; wir melden uns bei dir, sobald dein Zugang freigeschaltet ist.
              </DialogDescription>
            </DialogHeader>
            {message && (
              <p
                className={
                  message.type === "success"
                    ? "text-sm text-green-600"
                    : "text-sm text-destructive"
                }
              >
                {message.text}
              </p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleRequest} disabled={loading}>
                {loading ? "Wird gesendet…" : "Anfrage senden"}
              </Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
