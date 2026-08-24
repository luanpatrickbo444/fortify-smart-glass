import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/crypto";
import { COOKIE_SESSION } from "@/lib/auth-cookies";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(COOKIE_SESSION)?.value;
  const session = await verifyToken(token);
  if (!session || session.stage !== "authenticated") {
    const url = request.nextUrl.clone();
    url.pathname = "/glass/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/glass/assistant/:path*"] };
