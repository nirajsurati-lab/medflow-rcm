export const APP_ROLES = ["admin", "biller", "patient"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export function isInternalRole(role: string | null | undefined) {
  return role === "admin" || role === "biller";
}
