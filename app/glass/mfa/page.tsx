"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HudShell } from "@/components/HudShell";

type MfaMethod = "totp" | "alternative";

export default function MfaPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [user, setUser] = useState("");
  const [methods, setMethods] = useState<MfaMethod[]>(["alternative"]);
  const [method, setMethod] = useState<MfaMethod>("alternative");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setUser(sessionStorage.getItem("fortify-user") ?? "");
    try {
      const parsed = JSON.parse(sessionStorage.getItem("fortify-mfa-methods") ?? "[]") as MfaMethod[];
      if (parsed.length) {
        setMethods(parsed);
        setMethod(parsed.includes("totp") ? "totp" : parsed[0]);
      }
    } catch {
      setMethods(["alternative"]);
      setMethod("alternative");
    }
  }, []);

  const copy = useMemo(() => method === "totp"
    ? { label: "CÓDIGO DO APLICATIVO AUTENTICADOR", hint: "Digite o código de 6 dígitos gerado pelo Authenticator. Ele muda aproximadamente a cada 30 segundos." }
    : { label: "CÓDIGO ALTERNATIVO / RECUPERAÇÃO", hint: "Use o código alternativo configurado para contingência quando o aplicativo autenticador não estiver disponível." }, [method]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/fortify/auth/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({ code, method }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "MFA inválido");
      router.push("/glass/device");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha inesperada");
    } finally {
      setLoading(false);
    }
  }

  return (
    <HudShell
      step={2}
      eyebrow="ETAPA 02 • AUTENTICAÇÃO MULTIFATOR"
      title="Confirme sua identidade."
      description={`Segundo fator obrigatório para ${user || "o colaborador"}. A versão de produção permite um aplicativo TOTP e um método alternativo de contingência.`}
    >
      <form className="authCard" onSubmit={submit}>
        {error && <div className="error">{error}</div>}
        {methods.length > 1 && (
          <div className="field">
            <label>MÉTODO DE AUTENTICAÇÃO</label>
            <div className="mfaMethodGrid">
              {methods.includes("totp") && <button type="button" className={method === "totp" ? "mfaMethod active" : "mfaMethod"} onClick={() => { setMethod("totp"); setCode(""); }}>APLICATIVO AUTENTICADOR</button>}
              {methods.includes("alternative") && <button type="button" className={method === "alternative" ? "mfaMethod active" : "mfaMethod"} onClick={() => { setMethod("alternative"); setCode(""); }}>CÓDIGO ALTERNATIVO</button>}
            </div>
          </div>
        )}
        <div className="field">
          <label>{copy.label}</label>
          <div className="inputWrap"><input className="codeInput" inputMode="numeric" autoComplete="one-time-code" maxLength={12} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} /></div>
        </div>
        <div className="formRow">
          <button className="primaryBtn" disabled={loading || code.length < 6}>{loading ? "VERIFICANDO..." : "VALIDAR SEGUNDO FATOR"}</button>
          <button type="button" className="secondaryBtn" onClick={() => router.push("/glass/login")}>VOLTAR</button>
        </div>
        <p className="hint">{copy.hint}</p>
      </form>
    </HudShell>
  );
}
