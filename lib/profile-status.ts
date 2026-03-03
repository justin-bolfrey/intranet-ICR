export function getProfileStatus(
  profile: Record<string, unknown> | null | undefined
): string {
  if (!profile) return "";

  const candidates = [profile.status, profile.Status]
    .map((v) => String(v ?? "").trim().toLowerCase())
    .filter(Boolean);

  // Sicherheitspriorität: sobald eines der Status-Felder "cancelled" ist, gilt der Account als gekündigt.
  if (candidates.includes("cancelled")) return "cancelled";

  return candidates[0] ?? "";
}

export function isCancelledProfile(
  profile: Record<string, unknown> | null | undefined
): boolean {
  return getProfileStatus(profile) === "cancelled";
}
