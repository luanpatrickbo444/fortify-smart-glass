import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/crypto";
import { audit } from "@/lib/audit";

const EQUIPMENT = {
  "P-101": {
    id: "P-101",
    name: "Bomba de Processo",
    area: "Área industrial simulada",
    status: "OPERACIONAL",
    pressureBar: 48.2,
    temperatureC: 72.4,
    vibrationMmS: 2.1,
    classification: "DADO OPERACIONAL RESTRITO",
  },
};

export async function POST(request: Request) {
  const jar = await cookies();
  const session = await verifyToken(jar.get("fortify_session")?.value);
  if (!session || session.stage !== "authenticated" || !session.deviceId) {
    return NextResponse.json({ error: "Sessão não autenticada." }, { status: 401 });
  }
  if (!session.permissions?.includes("documents.read")) {
    audit("xr_equipment_denied", { user: session.sub, deviceId: session.deviceId, permission: "documents.read" });
    return NextResponse.json({ error: "Usuário sem permissão para consultar dados operacionais." }, { status: 403 });
  }

  const { equipmentId } = await request.json().catch(() => ({}));
  if (typeof equipmentId !== "string" || !(equipmentId in EQUIPMENT)) {
    return NextResponse.json({ error: "Ativo industrial não encontrado." }, { status: 404 });
  }

  const equipment = EQUIPMENT[equipmentId as keyof typeof EQUIPMENT];
  audit("xr_equipment_authorized", {
    user: session.sub,
    deviceId: session.deviceId,
    equipmentId,
    classification: equipment.classification,
  });

  return NextResponse.json({
    equipment: {
      ...equipment,
      lastUpdate: new Date().toISOString(),
    },
  });
}
