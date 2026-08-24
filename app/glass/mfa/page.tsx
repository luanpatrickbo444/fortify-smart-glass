"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HudShell } from "@/components/HudShell";

export default function MfaPage() {
  const router = useRouter();
  const [code, setCode] = useState("246810");
  const [user, setUser] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setUser(sessionStorage.getItem("fortify-user") ?? "");
    if (!sessionStorage.getItem("fortify-preauth")) router.replace("/glass/login");
  }, [router]);

  async function submit(e: FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const preAuthToken = sessionStorage.getItem("fortify-preauth");
      const res = await fetch("/api/fortify/auth/mfa", {
        method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ code, preAuthToken })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "MFA inválido");
      sessionStorage.setItem("fortify-mfa-token", data.mfaToken);
      router.push("/glass/device");
    } catch(err) { setError(err instanceof Error ? err.message : "Falha inesperada"); }
    finally { setLoading(false); }
  }

  return (
    <HudShell
      step={2}
      eyebrow="ETAPA 02 • AUTENTICAÇÃO MULTIFATOR"
      title="Confirme sua identidade."
      description={`Segundo fator obrigatório para ${user || "o colaborador"}. Esta camada reduz o risco de uso indevido mesmo quando uma credencial primária é comprometida.`}
    >
      <form className="authCard" onSubmit={submit}>
        {error && <div className="error">{error}</div>}
        <div className="field">
          <label>CÓDIGO DE VERIFICAÇÃO</label>
          <div className="inputWrap"><input className="codeInput" inputMode="numeric" maxLength={6} value={code} onChange={(e)=>setCode(e.target.value.replace(/\D/g,""))} /></div>
        </div>
        <div className="formRow">
          <button className="primaryBtn" disabled={loading || code.length !== 6}>{loading ? "VERIFICANDO..." : "VALIDAR SEGUNDO FATOR"}</button>
          <button type="button" className="secondaryBtn" onClick={()=>router.push("/glass/login")}>VOLTAR</button>
        </div>
        <p className="hint">Protótipo: código 246810. Em produção, a etapa pode ser integrada ao MFA corporativo, WebAuthn ou biometria homologada.</p>
      </form>
    </HudShell>
  );
}
