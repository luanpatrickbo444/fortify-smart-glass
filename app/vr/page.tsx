import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { VRExperience } from "@/components/VRExperience";
import { verifyToken } from "@/lib/crypto";
import { COOKIE_SESSION } from "@/lib/auth-cookies";

export const metadata = {
  title: "Fortify Subsea XR | Simulação Smart Glasses",
  description: "Simulação WebXR submarina do acesso seguro à IA por dispositivos vestíveis.",
};

// A sessão é validada no runtime Node da própria rota, usando a mesma
// configuração/segredo das APIs de autenticação. Isso evita depender de
// middleware/proxy para decidir se o cookie recém-emitido já é válido.
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export default async function VRPage() {
  const jar = await cookies();
  const session = await verifyToken(jar.get(COOKIE_SESSION)?.value);

  if (!session || session.stage !== "authenticated" || !session.deviceId) {
    redirect("/glass/login?next=/vr");
  }

  return <VRExperience />;
}
