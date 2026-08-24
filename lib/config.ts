export const DEMO_USER = process.env.FORTIFY_DEMO_USER ?? "colaborador@fortify.local";
export const DEMO_PASSWORD = process.env.FORTIFY_DEMO_PASSWORD ?? "Fortify@123";
export const DEMO_MFA_CODE = process.env.FORTIFY_DEMO_MFA_CODE ?? "246810";

export function allowedDevices() {
  return (process.env.FORTIFY_ALLOWED_DEVICE_IDS ?? "FORTIFY-GLASS-001,FORTIFY-GLASS-002")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}
