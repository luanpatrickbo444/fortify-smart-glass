import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/crypto";

export async function GET() {
  const jar = await cookies();
  const session = await verifyToken(jar.get("fortify_session")?.value);
  if (!session || session.stage !== "authenticated" || !session.deviceId) return NextResponse.json({error:"Sessão inválida."},{status:401});
  return NextResponse.json({
    user:session.sub,
    deviceId:session.deviceId,
    permissions:session.permissions ?? [],
    expiresAt:session.exp
  });
}
