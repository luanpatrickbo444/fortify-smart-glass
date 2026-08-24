const encoder = new TextEncoder();

function base64UrlEncode(input: Uint8Array | string) {
  const bytes = typeof input === "string" ? encoder.encode(input) : input;
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlDecode(input: string) {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(input.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmac(data: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(data)));
}

export type TokenPayload = {
  sub: string;
  stage: "password" | "mfa" | "authenticated";
  deviceId?: string;
  permissions?: string[];
  iat: number;
  exp: number;
};

export async function signToken(
  payload: Omit<TokenPayload, "iat" | "exp">,
  ttlSeconds: number
) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64UrlEncode(JSON.stringify({ ...payload, iat: now, exp: now + ttlSeconds }));
  const data = `${header}.${body}`;
  const signature = base64UrlEncode(await hmac(data, getSecret()));
  return `${data}.${signature}`;
}

export async function verifyToken(token?: string | null): Promise<TokenPayload | null> {
  if (!token) return null;
  try {
    const [header, body, signature] = token.split(".");
    if (!header || !body || !signature) return null;
    const expected = await hmac(`${header}.${body}`, getSecret());
    const actual = base64UrlDecode(signature);
    if (expected.length !== actual.length) return null;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) diff |= expected[i] ^ actual[i];
    if (diff !== 0) return null;
    const json = new TextDecoder().decode(base64UrlDecode(body));
    const payload = JSON.parse(json) as TokenPayload;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function getSecret() {
  const secret = process.env.FORTIFY_JWT_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("FORTIFY_JWT_SECRET must have at least 32 characters in production");
    }
    return "fortify-development-secret-change-me-123456789";
  }
  return secret;
}
