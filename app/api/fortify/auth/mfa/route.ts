import { NextResponse } from "next/server";
import { DEMO_MFA_CODE } from "@/lib/config";
import { signToken, verifyToken } from "@/lib/crypto";
import { audit } from "@/lib/audit";

export async function POST(request: Request) {
  const { code, preAuthToken } = await request.json().catch(()=>({}));
  const pre = await verifyToken(preAuthToken);
  if (!pre || pre.stage !== "password") return NextResponse.json({error:"Pré-autenticação inválida ou expirada."},{status:401});
  if (code !== DEMO_MFA_CODE) {
    audit("mfa_denied", { user:pre.sub, deviceId:pre.deviceId });
    return NextResponse.json({error:"Código MFA inválido."},{status:401});
  }
  const mfaToken = await signToken({sub:pre.sub,stage:"mfa",deviceId:pre.deviceId}, 180);
  audit("mfa_verified", { user:pre.sub, deviceId:pre.deviceId });
  return NextResponse.json({mfaToken,next:"device"});
}
