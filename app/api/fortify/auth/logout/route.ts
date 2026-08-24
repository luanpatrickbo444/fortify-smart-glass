import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/crypto";
import { audit } from "@/lib/audit";

export async function POST() {
  const jar = await cookies();
  const token = jar.get("fortify_session")?.value;
  const session = await verifyToken(token);
  if (session) audit("session_closed",{user:session.sub,deviceId:session.deviceId});
  const res = NextResponse.json({ok:true});
  res.cookies.set("fortify_session","",{httpOnly:true,path:"/",maxAge:0});
  return res;
}
