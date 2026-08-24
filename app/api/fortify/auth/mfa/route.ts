import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { enabledMfaMethods, MFA_RECOVERY_CODE, TOTP_SECRET, type MfaMethod } from "@/lib/config";
import { signToken, verifyToken } from "@/lib/crypto";
import { audit } from "@/lib/audit";
import { authCookieOptions, COOKIE_MFA, COOKIE_PREAUTH } from "@/lib/auth-cookies";
import { requestHasSameOrigin } from "@/lib/security";
import { constantTimeStringEqual, verifyTotp } from "@/lib/totp";

export async function POST(request: Request) {
  if (!requestHasSameOrigin(request)) {
    return NextResponse.json({ error: "Origem da requisição não autorizada." }, { status: 403 });
  }

  const { code, method } = await request.json().catch(() => ({}));
  if (typeof code !== "string" || (method !== "totp" && method !== "alternative")) {
    return NextResponse.json({ error: "Dados MFA inválidos." }, { status: 400 });
  }

  const jar = await cookies();
  const pre = await verifyToken(jar.get(COOKIE_PREAUTH)?.value);
  if (!pre || pre.stage !== "password") {
    return NextResponse.json({ error: "Pré-autenticação inválida ou expirada." }, { status: 401 });
  }

  const selected = method as MfaMethod;
  if (!enabledMfaMethods().includes(selected)) {
    return NextResponse.json({ error: "Método MFA não habilitado." }, { status: 400 });
  }

  let valid = false;
  if (selected === "totp" && TOTP_SECRET) {
    valid = await verifyTotp(code, TOTP_SECRET);
  } else if (selected === "alternative" && MFA_RECOVERY_CODE) {
    valid = await constantTimeStringEqual(code, MFA_RECOVERY_CODE);
  }

  if (!valid) {
    audit("mfa_denied", { user: pre.sub, deviceId: pre.deviceId, method: selected });
    return NextResponse.json({ error: "Código MFA inválido." }, { status: 401 });
  }

  const mfaToken = await signToken({ sub: pre.sub, stage: "mfa", deviceId: pre.deviceId }, 180);
  const response = NextResponse.json({ next: "device", method: selected });
  response.cookies.set(COOKIE_MFA, mfaToken, authCookieOptions(180));
  response.cookies.set(COOKIE_PREAUTH, "", { ...authCookieOptions(0), expires: new Date(0) });
  audit("mfa_verified", { user: pre.sub, deviceId: pre.deviceId, method: selected });
  return response;
}
