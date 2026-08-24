import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function AdminPage() {
  return (
    <main className="adminPage">
      <div className="brandStripe" aria-hidden="true" />
      <SiteHeader />
      <div className="adminWrap">
        <section className="adminHero">
          <small>FORTIFY • ARQUITETURA DO PROTÓTIPO</small>
          <h1>Camada de acesso seguro para Smart Glasses.</h1>
          <p>Visão executiva da solução implementada para demonstrar autenticação, confiança do dispositivo, autorização e acesso mediado à IA.</p>
          <div className="adminHeroActions">
            <Link href="/glass/login" className="heroPrimary">Abrir experiência</Link>
            <Link href="/documentacao" className="heroSecondary light">Documentação técnica</Link>
          </div>
        </section>

        <div className="adminGrid">
          <div className="adminCard"><span>01</span><h3>Identidade corporativa</h3><p>Usuário e credencial são validados antes de qualquer acesso. Em produção, esta etapa deve ser conectada ao provedor corporativo de identidade.</p></div>
          <div className="adminCard"><span>02</span><h3>Autenticação multifator</h3><p>O protótipo utiliza um código de seis dígitos, com separação de estágio para futura integração com MFA corporativo, WebAuthn ou mecanismo homologado.</p></div>
          <div className="adminCard"><span>03</span><h3>Device Trust</h3><p>O Device ID é vinculado à jornada e precisa pertencer à lista autorizada antes da emissão da sessão final.</p></div>
          <div className="adminCard"><span>04</span><h3>Sessão de curta duração</h3><p>O Fortify emite JWT assinado e o armazena em cookie httpOnly por quinze minutos no protótipo.</p></div>
          <div className="adminCard"><span>05</span><h3>Autorização</h3><p>A permissão ai.query é validada antes de qualquer chamada ao endpoint de IA.</p></div>
          <div className="adminCard"><span>06</span><h3>Auditoria</h3><p>Login negado, MFA, dispositivo, emissão de sessão, autorização e logout geram eventos estruturados de auditoria.</p></div>
        </div>

        <section className="architectureSection">
          <div className="sectionHeading compactHeading">
            <span>FLUXO DE CONFIANÇA</span>
            <h2>O LLM permanece atrás do Security Gateway.</h2>
          </div>
          <div className="arch">
            SMART GLASSES CORPORATIVO<br/>
            &nbsp;&nbsp;│ HTTPS / TLS<br/>
            &nbsp;&nbsp;▼<br/>
            FORTIFY SECURITY GATEWAY<br/>
            &nbsp;&nbsp;├─ Identidade corporativa<br/>
            &nbsp;&nbsp;├─ Autenticação multifator<br/>
            &nbsp;&nbsp;├─ Device ID / confiança do equipamento<br/>
            &nbsp;&nbsp;├─ Sessão JWT httpOnly de curta duração<br/>
            &nbsp;&nbsp;├─ RBAC / autorização<br/>
            &nbsp;&nbsp;└─ Auditoria de acesso<br/>
            &nbsp;&nbsp;│ somente se autorizado<br/>
            &nbsp;&nbsp;▼<br/>
            IA / LLM CORPORATIVO
          </div>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
