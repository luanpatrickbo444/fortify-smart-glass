import { Logo } from "@/components/Logo";

export default function AdminPage() {
  return (
    <main className="adminPage"><div className="adminWrap">
      <div className="adminTop"><Logo /><a href="/glass/login" className="secondaryBtn">ABRIR EXPERIÊNCIA SMART GLASSES</a></div>

      <section className="adminHero">
        <small>FORTIFY • PROTÓTIPO DE SEGURANÇA PARA SMART GLASSES</small>
        <h1>Camada de acesso seguro para ambientes corporativos.</h1>
        <p>O Fortify atua entre o dispositivo vestível e os serviços digitais, concentrando autenticação, confiança do equipamento, autorização e auditoria sem exigir mudanças no LLM de destino.</p>
      </section>

      <div className="adminGrid">
        <div className="adminCard"><span>01</span><h3>Identidade corporativa</h3><p>Usuário e credencial validados antes de qualquer acesso. Em produção, a camada pode ser conectada ao IdP corporativo.</p></div>
        <div className="adminCard"><span>02</span><h3>MFA</h3><p>Protótipo com código de seis dígitos e arquitetura preparada para MFA corporativo, WebAuthn ou biometria homologada.</p></div>
        <div className="adminCard"><span>03</span><h3>Device Binding</h3><p>Somente Smart Glasses autorizados recebem uma sessão válida, reduzindo o risco de uso por equipamentos não gerenciados.</p></div>
      </div>

      <div className="arch">
        SMART GLASSES CORPORATIVO<br/>
        &nbsp;&nbsp;│ HTTPS / TLS 1.3<br/>
        &nbsp;&nbsp;▼<br/>
        FORTIFY SECURITY GATEWAY<br/>
        &nbsp;&nbsp;├─ Identidade corporativa<br/>
        &nbsp;&nbsp;├─ Autenticação multifator<br/>
        &nbsp;&nbsp;├─ Device ID / certificado<br/>
        &nbsp;&nbsp;├─ Sessão JWT httpOnly de curta duração<br/>
        &nbsp;&nbsp;├─ RBAC / autorização<br/>
        &nbsp;&nbsp;└─ Auditoria de acesso<br/>
        &nbsp;&nbsp;│ acesso autorizado<br/>
        &nbsp;&nbsp;▼<br/>
        IA / LLM CORPORATIVO
      </div>
    </div></main>
  );
}
