const encoder = new TextEncoder();

function normalizeBase32(value: string) {
  return value.toUpperCase().replace(/[^A-Z2-7]/g, "");
}

function decodeBase32(value: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = normalizeBase32(value);
  let bits = "";
  for (const char of clean) {
    const index = alphabet.indexOf(char);
    if (index < 0) throw new Error("TOTP secret inválido");
    bits += index.toString(2).padStart(5, "0");
  }

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return new Uint8Array(bytes);
}

function counterBytes(counter: number) {
  const bytes = new Uint8Array(8);
  let value = BigInt(counter);
  for (let i = 7; i >= 0; i--) {
    bytes[i] = Number(value & 0xffn);
    value >>= 8n;
  }
  return bytes;
}

async function hotp(secret: string, counter: number, digits = 6) {
  const key = await crypto.subtle.importKey(
    "raw",
    decodeBase32(secret),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, counterBytes(counter))
  );
  const offset = signature[signature.length - 1] & 0x0f;
  const binary =
    ((signature[offset] & 0x7f) << 24) |
    ((signature[offset + 1] & 0xff) << 16) |
    ((signature[offset + 2] & 0xff) << 8) |
    (signature[offset + 3] & 0xff);
  return String(binary % 10 ** digits).padStart(digits, "0");
}

export async function verifyTotp(
  candidate: string,
  secret: string,
  window = 1,
  period = 30
) {
  if (!/^\d{6}$/.test(candidate)) return false;
  const current = Math.floor(Date.now() / 1000 / period);
  for (let offset = -window; offset <= window; offset++) {
    if ((await hotp(secret, current + offset)) === candidate) return true;
  }
  return false;
}

export async function sha256Hex(value: string) {
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", encoder.encode(value))
  );
  return [...digest].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function constantTimeStringEqual(a: string, b: string) {
  const [ha, hb] = await Promise.all([sha256Hex(a), sha256Hex(b)]);
  let diff = 0;
  for (let i = 0; i < ha.length; i++) diff |= ha.charCodeAt(i) ^ hb.charCodeAt(i);
  return diff === 0;
}
