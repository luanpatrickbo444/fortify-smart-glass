import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { allowedDevices } from "@/lib/config";
import { signToken, verifyToken } from "@/lib/crypto";
import { audit } from "@/lib/audit";
import { authCookieOptions, COOKIE_MFA, COOKIE_SESSION } from "@/lib/auth-cookies";
import { requestHasSameOrigin } from "@/lib/security";

export async function POST(request: Request) {
  if (!requestHasSameOrigin(request)) {
    return NextResponse.json({ error: "Origem da requisição não autorizada." }, { status: 403 });
  }

  const { deviceId } = await request.json().catch(() => ({}));
  if (typeof deviceId !== "string") {
    return NextResponse.json({ error: "Device ID inválido." }, { status: 400 });
  }

  const jar = await cookies();
  const mfa = await verifyToken(jar.get(COOKIE_MFA)?.value);
  if (!mfa || mfa.stage !== "mfa") {
    return NextResponse.json({ error: "MFA inválido ou expirado." }, { status: 401 });
  }
  if (deviceId !== mfa.deviceId) {
    return NextResponse.json({ error: "O dispositivo mudou durante a autenticação." }, { status: 403 });
  }
  if (!allowedDevices().includes(deviceId)) {
    audit("device_denied", { user: mfa.sub, deviceId });
    return NextResponse.json({ error: `Dispositivo ${deviceId} não está autorizado.` }, { status: 403 });
  }

  const permissions = ["ai.query", "documents.read"];
  const token = await signToken({ sub: mfa.sub, stage: "authenticated", deviceId, permissions }, 900);
  const response = NextResponse.json({ ok: true, expiresIn: 900 });
  response.cookies.set(COOKIE_SESSION, token, authCookieOptions(900));
  response.cookies.set(COOKIE_MFA, "", { ...authCookieOptions(0), expires: new Date(0) });
  audit("session_issued", { user: mfa.sub, deviceId, permissions });
  return response;
}
