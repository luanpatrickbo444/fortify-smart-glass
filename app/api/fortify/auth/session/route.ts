import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/crypto";
import { COOKIE_SESSION } from "@/lib/auth-cookies";

export async function GET() {
  const jar = await cookies();
  const session = await verifyToken(jar.get(COOKIE_SESSION)?.value);
  if (!session || session.stage !== "authenticated" || !session.deviceId) {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.json({
    user: session.sub,
    deviceId: session.deviceId,
    permissions: session.permissions ?? [],
    expiresAt: session.exp,
  }, { headers: { "Cache-Control": "no-store" } });
}
