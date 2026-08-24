import { NextResponse } from "next/server";
import { DEMO_PASSWORD, DEMO_USER } from "@/lib/config";
import { signToken } from "@/lib/crypto";
import { audit } from "@/lib/audit";

export async function POST(request: Request) {
  const { user, password, deviceId } = await request.json().catch(()=>({}));
  if (typeof user !== "string" || typeof password !== "string" || typeof deviceId !== "string") {
    return NextResponse.json({error:"Dados de autenticação inválidos."},{status:400});
  }
  if (user !== DEMO_USER || password !== DEMO_PASSWORD) {
    audit("login_denied", { user, deviceId });
    return NextResponse.json({error:"Identidade ou credencial inválida."},{status:401});
  }
  const preAuthToken = await signToken({sub:user,stage:"password",deviceId}, 180);
  audit("password_verified", { user, deviceId });
  return NextResponse.json({preAuthToken, next:"mfa"});
}
