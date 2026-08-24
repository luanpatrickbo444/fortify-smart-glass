import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/crypto";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("fortify_session")?.value;
  const session = await verifyToken(token);
  if (!session || session.stage !== "authenticated") {
    const url = request.nextUrl.clone();
    url.pathname = "/glass/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/glass/assistant/:path*"] };
