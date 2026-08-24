import { NextResponse } from "next/server";
import { allowedDevices } from "@/lib/config";
import { signToken, verifyToken } from "@/lib/crypto";
import { audit } from "@/lib/audit";

export async function POST(request: Request) {
  const { deviceId, mfaToken } = await request.json().catch(()=>({}));
  const mfa = await verifyToken(mfaToken);
  if (!mfa || mfa.stage !== "mfa") return NextResponse.json({error:"MFA inválido ou expirado."},{status:401});
  if (deviceId !== mfa.deviceId) return NextResponse.json({error:"O dispositivo mudou durante a autenticação."},{status:403});
  if (!allowedDevices().includes(deviceId)) {
    audit("device_denied", {user:mfa.sub,deviceId});
    return NextResponse.json({error:`Dispositivo ${deviceId} não está autorizado.`},{status:403});
  }

  const permissions = ["ai.query","documents.read"];
  const token = await signToken({sub:mfa.sub,stage:"authenticated",deviceId,permissions}, 900);
  const response = NextResponse.json({ok:true,expiresIn:900});
  response.cookies.set("fortify_session",token,{
    httpOnly:true,
    secure:process.env.NODE_ENV === "production",
    sameSite:"strict",
    path:"/",
    maxAge:900
  });
  audit("session_issued", {user:mfa.sub,deviceId,permissions});
  return response;
}
