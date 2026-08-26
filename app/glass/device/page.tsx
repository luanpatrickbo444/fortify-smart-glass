"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HudShell } from "@/components/HudShell";

export default function DevicePage() {
  const router = useRouter();
  const [deviceId, setDeviceId] = useState("FORTIFY-GLASS-001");
  const [status, setStatus] = useState<"idle" | "checking" | "ok" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    setDeviceId(localStorage.getItem("fortify-device-id") ?? "FORTIFY-GLASS-001");
  }, []);

  async function validate() {
    setStatus("checking");
    setError("");
    try {
      const res = await fetch("/api/fortify/device/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ deviceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Dispositivo não autorizado");
      setStatus("ok");
      sessionStorage.removeItem("fortify-mfa-methods");
      setTimeout(() => router.replace("/vr"), 420);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Falha inesperada");
    }
  }

  return (
    <HudShell
      step={3}
      eyebrow="ETAPA 03 • CONFIANÇA DO DISPOSITIVO"
      title="Valide o Smart Glasses."
      description="O usuário pode estar correto e ainda assim o equipamento precisa ser confiável. O Fortify vincula a sessão a um dispositivo corporativo autorizado."
    >
      {error && <div className="error">{error}</div>}
      {status === "ok" && <div className="success">Dispositivo confiável. Sessão corporativa emitida. Abrindo o Fortify Subsea XR…</div>}
      <div className="devicePanel">
        <div className="deviceCard deviceVisual" />
        <div className="deviceCard">
          <h3>{deviceId}</h3>
          <p>Perfil corporativo de Smart Glasses habilitado para acesso somente por meio do Fortify Security Gateway.</p>
          <ul className="statusList">
            <li><span>Identidade corporativa</span><b>VERIFICADA</b></li>
            <li><span>Segundo fator</span><b>VERIFICADO</b></li>
            <li><span>Device ID / certificado</span><b>{status === "checking" ? "VALIDANDO" : status === "ok" ? "CONFIÁVEL" : "PENDENTE"}</b></li>
          </ul>
          <div className="formRow" style={{ marginTop: 18 }}>
            <button className="primaryBtn" onClick={validate} disabled={status === "checking" || status === "ok"}>{status === "checking" ? "VALIDANDO DISPOSITIVO..." : "LIBERAR ACESSO SEGURO"}</button>
          </div>
        </div>
      </div>
    </HudShell>
  );
}
