import type { NextConfig } from "next";

/**
 * Sicherheits-Header für alle Routen.
 * Bewusst ohne striktes Content-Security-Policy, um bestehendes Verhalten
 * (Inline-Styles, Vercel Analytics, Supabase, Turnstile) nicht zu brechen.
 */
const securityHeaders = [
  // Clickjacking-Schutz: Einbettung in fremde Frames verbieten.
  { key: "X-Frame-Options", value: "DENY" },
  // MIME-Sniffing unterbinden.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Referrer nur minimal weitergeben.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Sensible Browser-APIs standardmäßig deaktivieren.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  // HTTPS erzwingen (1 Jahr inkl. Subdomains).
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
