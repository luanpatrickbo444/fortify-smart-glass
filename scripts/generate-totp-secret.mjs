import { randomBytes } from "node:crypto";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function base32Encode(buffer) {
  let bits = "";
  for (const byte of buffer) bits += byte.toString(2).padStart(8, "0");
  let out = "";
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, "0");
    out += alphabet[parseInt(chunk, 2)];
  }
  return out;
}

const secret = base32Encode(randomBytes(20));
const issuer = encodeURIComponent("Fortify");
const account = encodeURIComponent("colaborador@fortify.local");
const uri = `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;

console.log("FORTIFY_TOTP_SECRET=" + secret);
console.log("\nCadastre manualmente o segredo acima no aplicativo autenticador.");
console.log("\nURI TOTP (pode ser convertida em QR Code por uma ferramenta interna/confiável):\n" + uri);
