import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase Browser Client für Client Components.
 * Wird z.B. für Logout-Button oder Realtime-Subscriptions genutzt.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
