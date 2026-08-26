import type { NextResponse } from "next/server";

export const COOKIE_PREAUTH = "fortify_preauth";
export const COOKIE_MFA = "fortify_mfa";
export const COOKIE_SESSION = "fortify_session";

export function authCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    priority: "high" as const,
    path: "/",
    maxAge,
  };
}

export function clearAuthCookies(response: NextResponse) {
  for (const name of [COOKIE_PREAUTH, COOKIE_MFA, COOKIE_SESSION]) {
    response.cookies.set(name, "", { ...authCookieOptions(0), expires: new Date(0) });
  }
}
