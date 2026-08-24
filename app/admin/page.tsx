import { Logo } from "@/components/Logo";

export default function AdminPage() {
  return (
    <main className="adminPage"><div className="adminWrap">
      <div className="adminTop"><Logo /><a href="/glass/login" className="secondaryBtn">ABRIR SMART GLASSES</a></div>
      <div className="adminGrid">
        <div className="adminCard"><h3>Identidade</h3><p>Usuário corporativo + credencial. No ambiente real, integre o Fortify ao IdP da empresa.</p></div>
        <div className="adminCard"><h3>MFA</h3><p>Protótipo com código de 6 dígitos; produção preparada conceitualmente para WebAuthn ou MFA corporativo.</p></div>
        <div className="adminCard"><h3>Device Binding</h3><p>Somente Smart Glasses presentes na allowlist recebem uma sessão autenticada.</p></div>
      </div>
      <div className="arch">
        SMART GLASSES<br/>
        &nbsp;&nbsp;│ HTTPS / TLS<br/>
        &nbsp;&nbsp;▼<br/>
        FORTIFY SECURITY GATEWAY<br/>
        &nbsp;&nbsp;├─ Identidade<br/>
        &nbsp;&nbsp;├─ MFA<br/>
        &nbsp;&nbsp;├─ Device ID / certificado<br/>
        &nbsp;&nbsp;├─ JWT httpOnly de curta duração<br/>
        &nbsp;&nbsp;├─ RBAC<br/>
        &nbsp;&nbsp;└─ Auditoria<br/>
        &nbsp;&nbsp;│ acesso autorizado<br/>
        &nbsp;&nbsp;▼<br/>
        IA / LLM CORPORATIVO
      </div>
    </div></main>
  );
}
