export const DEMO_USER = process.env.FORTIFY_DEMO_USER ?? "colaborador@fortify.local";
export const DEMO_PASSWORD = process.env.FORTIFY_DEMO_PASSWORD ?? "Fortify@123";
export const DEMO_MFA_CODE = process.env.FORTIFY_DEMO_MFA_CODE ?? "246810";
export const TOTP_SECRET = (process.env.FORTIFY_TOTP_SECRET ?? "").trim();
export const MFA_RECOVERY_CODE = (process.env.FORTIFY_MFA_RECOVERY_CODE ?? DEMO_MFA_CODE).trim();

export type MfaMethod = "totp" | "alternative";

export function enabledMfaMethods(): MfaMethod[] {
  const methods: MfaMethod[] = [];
  if (TOTP_SECRET) methods.push("totp");
  if (MFA_RECOVERY_CODE) methods.push("alternative");
  return methods;
}

export function allowedDevices() {
  return (process.env.FORTIFY_ALLOWED_DEVICE_IDS ?? "FORTIFY-GLASS-001,FORTIFY-GLASS-002")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}
