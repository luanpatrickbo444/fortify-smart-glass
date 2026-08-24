import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/crypto";
import { audit } from "@/lib/audit";
import { clearAuthCookies, COOKIE_SESSION } from "@/lib/auth-cookies";
import { requestHasSameOrigin } from "@/lib/security";

export async function POST(request: Request) {
  if (!requestHasSameOrigin(request)) {
    return NextResponse.json({ error: "Origem da requisição não autorizada." }, { status: 403 });
  }
  const jar = await cookies();
  const token = jar.get(COOKIE_SESSION)?.value;
  const session = await verifyToken(token);
  if (session) audit("session_closed", { user: session.sub, deviceId: session.deviceId });
  const response = NextResponse.json({ ok: true });
  clearAuthCookies(response);
  return response;
}
