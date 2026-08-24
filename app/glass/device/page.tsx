"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HudShell } from "@/components/HudShell";

export default function DevicePage() {
  const router = useRouter();
  const [deviceId, setDeviceId] = useState("FORTIFY-GLASS-001");
  const [status, setStatus] = useState<"idle"|"checking"|"ok"|"error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    setDeviceId(localStorage.getItem("fortify-device-id") ?? "FORTIFY-GLASS-001");
    if (!sessionStorage.getItem("fortify-mfa-token")) router.replace("/glass/login");
  }, [router]);

  async function validate() {
    setStatus("checking"); setError("");
    try {
      const mfaToken = sessionStorage.getItem("fortify-mfa-token");
      const res = await fetch("/api/fortify/device/validate", {
        method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ deviceId, mfaToken })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Dispositivo não autorizado");
      setStatus("ok");
      sessionStorage.removeItem("fortify-preauth");
      sessionStorage.removeItem("fortify-mfa-token");
      setTimeout(()=>router.push("/glass/assistant"), 650);
    } catch(err) { setStatus("error"); setError(err instanceof Error ? err.message : "Falha inesperada"); }
  }

  return (
    <HudShell step={3} eyebrow="DEVICE TRUST // 03" title="Valide o Smart Glasses." description="Mesmo com usuário e MFA válidos, o acesso só é liberado para um dispositivo corporativo autorizado. Essa etapa cria o vínculo entre identidade e equipamento.">
      {error && <div className="error">{error}</div>}
      {status === "ok" && <div className="success">Dispositivo confiável. Sessão segura emitida.</div>}
      <div className="devicePanel">
        <div className="deviceCard deviceVisual" />
        <div className="deviceCard">
          <h3>{deviceId}</h3>
          <p>Perfil corporativo de Smart Glasses configurado para acesso via Fortify Security Gateway.</p>
          <ul className="statusList">
            <li><span>Usuário</span><b>VERIFICADO</b></li>
            <li><span>MFA</span><b>VERIFICADO</b></li>
            <li><span>Certificado / Device ID</span><b>{status === "checking" ? "VALIDANDO" : status === "ok" ? "VÁLIDO" : "PENDENTE"}</b></li>
          </ul>
          <div className="formRow" style={{marginTop:18}}>
            <button className="primaryBtn" onClick={validate} disabled={status === "checking" || status === "ok"}>{status === "checking" ? "VALIDANDO..." : "VALIDAR DISPOSITIVO"}</button>
          </div>
        </div>
      </div>
    </HudShell>
  );
}
