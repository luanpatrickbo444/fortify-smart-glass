import Link from "next/link";
import { Logo } from "./Logo";

export function SiteHeader() {
  return (
    <header className="siteHeader">
      <div className="siteHeaderInner">
        <Link href="/" className="siteBrand" aria-label="Fortify - Início">
          <Logo />
        </Link>
        <nav className="siteNav" aria-label="Navegação principal">
          <Link href="/#visao-geral">Visão geral</Link>
          <Link href="/documentacao">Documentação</Link>
          <Link href="/admin">Arquitetura</Link>
          <Link href="/vr">Simulador XR</Link>
          <Link href="/glass/login" className="navCta">Abrir Smart Glasses</Link>
        </nav>
      </div>
    </header>
  );
}
