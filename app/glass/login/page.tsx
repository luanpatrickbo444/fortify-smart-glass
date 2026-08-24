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
    const saved = localStorage.getItem("fortify-device-id");
    if (saved) setDeviceId(saved);
    else localStorage.setItem("fortify-device-id", "FORTIFY-GLASS-001");
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/fortify/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, password, deviceId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha na autenticação");
      sessionStorage.setItem("fortify-preauth", data.preAuthToken);
      sessionStorage.setItem("fortify-user", user);
      router.push("/glass/mfa");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha inesperada");
    } finally { setLoading(false); }
  }

  return (
    <HudShell
      step={1}
      eyebrow="IDENTITY VERIFICATION // 01"
      title="Acesso seguro começa na identidade."
      description="Autentique o colaborador diretamente no Smart Glasses antes de qualquer acesso a dados corporativos ou assistentes de IA."
    >
      <form className="authCard" onSubmit={submit}>
        {error && <div className="error">{error}</div>}
        <div className="field">
          <label>IDENTIDADE CORPORATIVA</label>
          <div className="inputWrap"><input value={user} onChange={(e)=>setUser(e.target.value)} autoComplete="username" /></div>
        </div>
        <div className="field">
          <label>PIN / SENHA</label>
          <div className="inputWrap"><input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" autoComplete="current-password" /></div>
        </div>
        <div className="formRow">
          <button className="primaryBtn" disabled={loading}>{loading ? "VALIDANDO..." : "AUTENTICAR"}</button>
        </div>
        <div className="meta">
          <span>DEVICE: {deviceId}</span><span>CHANNEL: HTTPS</span><span>POLICY: ZERO TRUST</span>
        </div>
      </form>
    </HudShell>
  );
}
