import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "./Logo";

export function HudShell({
  eyebrow,
  title,
  description,
  children,
  step
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  step: number;
}) {
  const labels = ["Identidade", "MFA", "Dispositivo"];

  return (
    <main className="hudPage">
      <div className="brandStripe" aria-hidden="true" />
      <header className="hudTopbar">
        <Link href="/" aria-label="Voltar para o início"><Logo /></Link>
        <div className="hudTopActions">
          <Link href="/documentacao" className="hudDocLink">DOCUMENTAÇÃO</Link>
          <span className="environmentBadge">PROTÓTIPO SENAI</span>
          <div className="hudConnection"><span className="pulse" /> CANAL PROTEGIDO</div>
        </div>
      </header>

      <section className="hudFrame">
        <aside className="contextPanel">
          <div className="contextKicker">DESAFIO TECNOLÓGICO • SMART GLASSES</div>
          <h2>Acesso seguro à IA em dispositivos vestíveis.</h2>
          <p>
            O Fortify concentra identidade, segundo fator, confiança do dispositivo, autorização e auditoria antes do acesso aos serviços digitais corporativos.
          </p>

          <div className="securitySummary">
            <div><span>01</span><strong>Identidade</strong><small>Credencial corporativa validada</small></div>
            <div><span>02</span><strong>Confiança</strong><small>MFA e vínculo do Smart Glasses</small></div>
            <div><span>03</span><strong>Gateway</strong><small>IA acessada somente após autorização</small></div>
          </div>

          <div className="petrobrasAccent" aria-hidden="true">
            <span>AUTENTICAÇÃO CONFIÁVEL</span>
            <span>PROTEÇÃO DE DADOS</span>
            <span>CONTROLE DE ACESSO</span>
          </div>
        </aside>

        <div className="hudWorkspace">
          <div className="stepRail" aria-label="Etapas de autenticação">
            {[1, 2, 3].map((n) => (
              <div key={n} className={`stepDot ${step >= n ? "active" : ""} ${step === n ? "current" : ""}`}>
                <span>{step > n ? "✓" : n}</span>
                <small>{labels[n - 1]}</small>
              </div>
            ))}
          </div>

          <div className="hudContent">
            <div className="eyebrow">{eyebrow}</div>
            <h1>{title}</h1>
            <p className="lead">{description}</p>
            {children}
          </div>
        </div>
      </section>

      <footer className="hudFooter">
        <span>FORTIFY SECURITY GATEWAY</span>
        <span>PROTÓTIPO ACADÊMICO • PETROBRAS / SENAI</span>
      </footer>
    </main>
  );
}
