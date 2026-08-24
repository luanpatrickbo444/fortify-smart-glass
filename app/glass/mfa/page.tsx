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
    <HudShell step={2} eyebrow="MULTI-FACTOR AUTHENTICATION // 02" title="Confirme que é realmente você." description={`Segundo fator obrigatório para ${user || "o colaborador"}. No protótipo, um código demonstra o MFA; em produção, substitua por WebAuthn, biometria homologada ou IdP corporativo.`}>
      <form className="authCard" onSubmit={submit}>
        {error && <div className="error">{error}</div>}
        <div className="field">
          <label>CÓDIGO DE VERIFICAÇÃO</label>
          <div className="inputWrap"><input className="codeInput" inputMode="numeric" maxLength={6} value={code} onChange={(e)=>setCode(e.target.value.replace(/\D/g,""))} /></div>
        </div>
        <div className="formRow">
          <button className="primaryBtn" disabled={loading || code.length !== 6}>{loading ? "VERIFICANDO..." : "CONFIRMAR MFA"}</button>
          <button type="button" className="secondaryBtn" onClick={()=>router.push("/glass/login")}>CANCELAR</button>
        </div>
        <p className="hint">DEMO: 246810. O código é somente para demonstração do fluxo de segurança.</p>
      </form>
    </HudShell>
  );
}
