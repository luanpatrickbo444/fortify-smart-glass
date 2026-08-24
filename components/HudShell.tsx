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
  return (
    <main className="hudPage">
      <div className="hudNoise" />
      <header className="hudTopbar">
        <Logo />
        <div className="hudConnection">
          <span className="pulse" /> TLS 1.3 • CANAL SEGURO
        </div>
      </header>

      <section className="hudFrame">
        <div className="corner cornerTl" />
        <div className="corner cornerTr" />
        <div className="corner cornerBl" />
        <div className="corner cornerBr" />

        <div className="stepRail" aria-label="Etapas de autenticação">
          {[1, 2, 3].map((n) => (
            <div key={n} className={`stepDot ${step >= n ? "active" : ""}`}>
              <span>{n}</span>
              <small>{n === 1 ? "IDENTIDADE" : n === 2 ? "MFA" : "DISPOSITIVO"}</small>
            </div>
          ))}
        </div>

        <div className="hudContent">
          <div className="eyebrow">{eyebrow}</div>
          <h1>{title}</h1>
          <p className="lead">{description}</p>
          {children}
        </div>
      </section>

      <footer className="hudFooter">
        <span>FORTIFY SECURITY GATEWAY</span>
        <span>ZERO TRUST • MFA • DEVICE BINDING</span>
      </footer>
    </main>
  );
}
