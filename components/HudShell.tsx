import type { ReactNode } from "react";
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
        <Logo />
        <div className="hudTopActions">
          <span className="environmentBadge">AMBIENTE CORPORATIVO</span>
          <div className="hudConnection"><span className="pulse" /> CANAL TLS 1.3</div>
        </div>
      </header>

      <section className="hudFrame">
        <aside className="contextPanel">
          <div className="contextKicker">FORTIFY / PETROBRAS</div>
          <h2>Acesso seguro à IA por Smart Glasses</h2>
          <p>
            Identidade, segundo fator e confiança do dispositivo antes de qualquer dado corporativo sair do perímetro protegido.
          </p>

          <div className="securitySummary">
            <div><span>01</span><strong>Autenticação</strong><small>Identidade corporativa validada</small></div>
            <div><span>02</span><strong>Zero Trust</strong><small>Nenhum dispositivo é presumido confiável</small></div>
            <div><span>03</span><strong>Gateway</strong><small>A IA nunca é acessada diretamente</small></div>
          </div>

          <div className="petrobrasAccent" aria-hidden="true">
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
        <span>PROTÓTIPO • SMART GLASSES • PETROBRAS / SENAI</span>
      </footer>
    </main>
  );
}
