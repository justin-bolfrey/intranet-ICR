export function getProfileStatus(
  profile: Record<string, unknown> | null | undefined
): string {
  if (!profile) return "";

  const rawStatus = profile.status ?? profile.Status ?? "";
  return String(rawStatus).trim().toLowerCase();
}

export function isCancelledProfile(
  profile: Record<string, unknown> | null | undefined
): boolean {
  return getProfileStatus(profile) === "cancelled";
}
