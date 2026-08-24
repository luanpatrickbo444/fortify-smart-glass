import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/crypto";
import { audit } from "@/lib/audit";
import { COOKIE_SESSION } from "@/lib/auth-cookies";
import { requestHasSameOrigin } from "@/lib/security";

export async function POST(request: Request) {
  if (!requestHasSameOrigin(request)) {
    return NextResponse.json({ error: "Origem da requisição não autorizada." }, { status: 403 });
  }
  const jar = await cookies();
  const session = await verifyToken(jar.get(COOKIE_SESSION)?.value);
  if (!session || session.stage !== "authenticated" || !session.deviceId) {
    return NextResponse.json({ error: "Sessão não autenticada." }, { status: 401 });
  }
  if (!session.permissions?.includes("ai.query")) {
    audit("authorization_denied", { user: session.sub, deviceId: session.deviceId, permission: "ai.query" });
    return NextResponse.json({ error: "Usuário sem permissão para consultar IA." }, { status: 403 });
  }

  const { message } = await request.json().catch(() => ({}));
  if (typeof message !== "string" || !message.trim() || message.length > 2000) {
    return NextResponse.json({ error: "Solicitação inválida." }, { status: 400 });
  }

  audit("ai_query_authorized", { user: session.sub, deviceId: session.deviceId, messageLength: message.length });
  const endpoint = process.env.LLM_ENDPOINT;
  if (endpoint) {
    const llmRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.LLM_API_KEY ? { Authorization: `Bearer ${process.env.LLM_API_KEY}` } : {}),
      },
      body: JSON.stringify({ message, context: { user: session.sub, deviceId: session.deviceId, permissions: session.permissions } }),
      cache: "no-store",
    });
    if (!llmRes.ok) return NextResponse.json({ error: "Serviço corporativo indisponível." }, { status: 502 });
    const data = await llmRes.json();
    return NextResponse.json({ answer: data.answer ?? data.message ?? "Resposta recebida do serviço corporativo." });
  }

  const answer = `Consulta autorizada para ${session.sub} no dispositivo ${session.deviceId}. O Fortify validou JWT, MFA, vínculo do dispositivo e a permissão ai.query antes desta resposta. Em produção, este endpoint encaminha a solicitação ao LLM corporativo por meio do gateway, sem expor a chave de API ao Smart Glasses.`;
  return NextResponse.json({ answer });
}
