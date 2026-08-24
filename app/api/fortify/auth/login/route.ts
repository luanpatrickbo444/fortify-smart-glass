import { NextResponse } from "next/server";
import { DEMO_PASSWORD, DEMO_USER, enabledMfaMethods } from "@/lib/config";
import { signToken } from "@/lib/crypto";
import { audit } from "@/lib/audit";
import { authCookieOptions, COOKIE_PREAUTH } from "@/lib/auth-cookies";
import { requestHasSameOrigin } from "@/lib/security";
import { constantTimeStringEqual } from "@/lib/totp";

export async function POST(request: Request) {
  if (!requestHasSameOrigin(request)) {
    return NextResponse.json({ error: "Origem da requisição não autorizada." }, { status: 403 });
  }

  const { user, password, deviceId } = await request.json().catch(() => ({}));
  if (typeof user !== "string" || typeof password !== "string" || typeof deviceId !== "string") {
    return NextResponse.json({ error: "Dados de autenticação inválidos." }, { status: 400 });
  }

  const userOk = await constantTimeStringEqual(user.trim().toLowerCase(), DEMO_USER.trim().toLowerCase());
  const passwordOk = await constantTimeStringEqual(password, DEMO_PASSWORD);
  if (!userOk || !passwordOk) {
    audit("login_denied", { user, deviceId });
    return NextResponse.json({ error: "Identidade ou credencial inválida." }, { status: 401 });
  }

  const methods = enabledMfaMethods();
  if (methods.length === 0) {
    return NextResponse.json({ error: "Nenhum método MFA foi configurado no servidor." }, { status: 503 });
  }

  const preAuthToken = await signToken({ sub: DEMO_USER, stage: "password", deviceId }, 180);
  const response = NextResponse.json({ next: "mfa", mfaMethods: methods });
  response.cookies.set(COOKIE_PREAUTH, preAuthToken, authCookieOptions(180));
  audit("password_verified", { user: DEMO_USER, deviceId, mfaMethods: methods });
  return response;
}
