"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";

type Msg = { role: "user" | "ai"; text: string };

type Session = { user: string; deviceId: string; permissions: string[]; expiresAt: number };

export default function AssistantPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Msg[]>([{ role:"ai", text:"Acesso autorizado pelo Fortify Security Gateway. Posso consultar apenas recursos liberados para esta sessão." }]);
  const [input, setInput] = useState("Mostre o status de segurança desta sessão.");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/fortify/auth/session").then(async (r)=>{
      if (!r.ok) { router.replace("/glass/login"); return; }
      setSession(await r.json());
    });
  }, [router]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = input.trim(); if (!text || loading) return;
    setMessages((m)=>[...m,{role:"user",text}]); setInput(""); setLoading(true);
    try {
      const res = await fetch("/api/fortify/ai/query", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ message:text }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gateway recusou a solicitação");
      setMessages((m)=>[...m,{role:"ai",text:data.answer}]);
    } catch(err) {
      setMessages((m)=>[...m,{role:"ai",text:err instanceof Error ? err.message : "Falha ao acessar o gateway."}]);
    } finally { setLoading(false); }
  }

  async function logout() {
    await fetch("/api/fortify/auth/logout", {method:"POST"});
    router.replace("/glass/login");
  }

  return (
    <main className="assistantPage">
      <section className="appShell">
        <aside className="sidebar">
          <Logo />
          <div className="sideStatus">
            <div className="sideMetric"><small>IDENTIDADE</small><strong>{session?.user ?? "VALIDANDO..."}</strong></div>
            <div className="sideMetric"><small>SMART GLASSES</small><strong>{session?.deviceId ?? "VALIDANDO..."}</strong></div>
            <div className="sideMetric"><small>SECURITY GATEWAY</small><strong>ATIVO • TLS</strong></div>
          </div>
          <div className="navInfo">Nenhuma chamada ao assistente é feita diretamente. O Fortify valida sessão, dispositivo e permissões antes do encaminhamento ao LLM.</div>
        </aside>
        <div className="mainAssistant">
          <header className="assistantHeader">
            <div><h2>Assistente corporativo protegido</h2><p>SESSION POLICY: MFA + DEVICE BINDING + RBAC</p></div>
            <button className="dangerBtn" onClick={logout}>ENCERRAR SESSÃO</button>
          </header>
          <div className="chat">
            {messages.map((m,i)=><div key={i} className={`message ${m.role}`}><span className="tag">{m.role === "user" ? "COLABORADOR" : "FORTIFY GATEWAY / AI"}</span>{m.text}</div>)}
            {loading && <div className="message ai"><span className="tag">FORTIFY GATEWAY</span>Validando autorização e processando...</div>}
          </div>
          <form className="composer" onSubmit={send}>
            <textarea value={input} onChange={(e)=>setInput(e.target.value)} placeholder="Envie uma solicitação segura..." />
            <button className="primaryBtn" disabled={loading}>ENVIAR VIA GATEWAY</button>
          </form>
        </div>
      </section>
    </main>
  );
}
