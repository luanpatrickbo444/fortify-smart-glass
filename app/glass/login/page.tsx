"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HudShell } from "@/components/HudShell";

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState("colaborador@fortify.local");
  const [password, setPassword] = useState("Fortify@123");
  const [deviceId, setDeviceId] = useState("FORTIFY-GLASS-001");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    const saved = localStorage.getItem("fortify-device-id");
    if (saved) setDeviceId(saved);
    else localStorage.setItem("fortify-device-id", "FORTIFY-GLASS-001");

    fetch("/api/fortify/auth/session", { cache: "no-store", credentials: "include" })
      .then((res) => { if (alive && res.ok) window.location.replace(`/vr?resume=${Date.now()}`); })
      .catch(() => {});

    return () => { alive = false; };
  }, [router]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/fortify/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({ user, password, deviceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha na autenticação");
      sessionStorage.setItem("fortify-user", user);
      sessionStorage.setItem("fortify-mfa-methods", JSON.stringify(data.mfaMethods ?? ["alternative"]));
      router.push("/glass/mfa");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha inesperada");
    } finally {
      setLoading(false);
    }
  }

  return (
    <HudShell
      step={1}
      eyebrow="ETAPA 01 • IDENTIDADE CORPORATIVA"
      title="Identifique o colaborador."
      description="O acesso aos serviços digitais começa pela identidade corporativa. Nenhuma informação de negócio é liberada antes da validação desta etapa."
    >
      <form className="authCard" onSubmit={submit}>
        {error && <div className="error">{error}</div>}
        <div className="field">
          <label>IDENTIDADE / E-MAIL CORPORATIVO</label>
          <div className="inputWrap"><input value={user} onChange={(e) => setUser(e.target.value)} autoComplete="username" /></div>
        </div>
        <div className="field">
          <label>SENHA / PIN DE ACESSO</label>
          <div className="inputWrap"><input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" /></div>
        </div>
        <div className="formRow">
          <button className="primaryBtn" disabled={loading}>{loading ? "VALIDANDO IDENTIDADE..." : "CONTINUAR COM SEGURANÇA"}</button>
        </div>
        <div className="meta">
          <span>DEVICE {deviceId}</span><span>HTTPS / TLS</span><span>ZERO TRUST</span>
        </div>
      </form>
    </HudShell>
  );
}
