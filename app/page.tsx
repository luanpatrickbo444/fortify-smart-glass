import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const controls = [
  ["01", "Identidade corporativa", "Usuário e credencial são validados antes de qualquer acesso ao ambiente protegido."],
  ["02", "Autenticação multifator", "Um segundo estágio impede que apenas a credencial primária seja suficiente para criar uma sessão final."],
  ["03", "Device Trust", "O Device ID acompanha a jornada e precisa estar autorizado antes da emissão do cookie de sessão."],
  ["04", "Sessão de curta duração", "JWT assinado em HMAC-SHA256 e cookie httpOnly por quinze minutos no protótipo."],
  ["05", "RBAC", "ai.query protege o assistente; documents.read protege os dados do ativo industrial simulado."],
  ["06", "Auditoria", "Eventos de autenticação, autorização, consulta XR e logout são emitidos em JSON pelo backend."],
  ["07", "Fortify XR", "WebXR transforma um headset em emulador da experiência do Smart Glasses durante a demonstração."],
  ["08", "Gateway de IA", "O wearable nunca recebe a chave do LLM; a consulta passa pelo backend e só segue após autorização."],
];

export default function AdminPage() {
  return (
    <main className="adminPage">
      <div className="brandStripe" aria-hidden="true" />
      <SiteHeader />
      <div className="adminWrap">
        <section className="adminHero">
          <small>FORTIFY • ARQUITETURA DO PROTÓTIPO</small>
          <h1>Camada de acesso seguro para Smart Glasses e simulação XR.</h1>
          <p>Visão executiva da solução implementada para demonstrar autenticação, confiança do dispositivo, autorização, acesso mediado à IA e uma experiência imersiva em ambiente industrial simulado.</p>
          <div className="adminHeroActions">
            <Link href="/vr" className="heroPrimary">Abrir Fortify XR</Link>
            <Link href="/glass/login" className="heroSecondary light">Fluxo Smart Glasses</Link>
            <Link href="/documentacao" className="heroSecondary light">Documentação técnica</Link>
          </div>
        </section>

        <div className="adminGrid">
          {controls.map(([n,title,desc]) => <div className="adminCard" key={n}><span>{n}</span><h3>{title}</h3><p>{desc}</p></div>)}
        </div>

        <section className="architectureSection">
          <div className="sectionHeading compactHeading">
            <span>FLUXO DE CONFIANÇA</span>
            <h2>VR e Smart Glasses usam o mesmo Security Gateway.</h2>
          </div>
          <div className="arch">
            SMART GLASSES / HEADSET VR (SIMULAÇÃO)<br/>
            &nbsp;&nbsp;│ HTTPS / TLS<br/>
            &nbsp;&nbsp;▼<br/>
            FORTIFY SECURITY GATEWAY<br/>
            &nbsp;&nbsp;├─ Identidade corporativa<br/>
            &nbsp;&nbsp;├─ Autenticação multifator<br/>
            &nbsp;&nbsp;├─ Device ID / confiança do equipamento<br/>
            &nbsp;&nbsp;├─ Sessão JWT httpOnly de curta duração<br/>
            &nbsp;&nbsp;├─ RBAC: ai.query / documents.read<br/>
            &nbsp;&nbsp;└─ Auditoria de acesso<br/>
            &nbsp;&nbsp;│ somente se autorizado<br/>
            &nbsp;&nbsp;├──────────────► IA / LLM<br/>
            &nbsp;&nbsp;└──────────────► Dados industriais simulados P-101
          </div>
        </section>

        <section className="architectureSection">
          <div className="sectionHeading compactHeading">
            <span>DEMONSTRAÇÃO PARA BANCA</span>
            <h2>Quatro cenários que podem ser apresentados ao vivo.</h2>
          </div>
          <div className="adminGrid">
            <div className="adminCard"><span>A</span><h3>Acesso autorizado</h3><p>Login correto → MFA → device autorizado → consulta ao P-101 → resposta da IA.</p></div>
            <div className="adminCard"><span>B</span><h3>Device bloqueado</h3><p>Mesmo com identidade e MFA válidos, um Device ID fora da allowlist não recebe sessão final.</p></div>
            <div className="adminCard"><span>C</span><h3>Dado protegido</h3><p>Sem cookie autenticado, o endpoint do equipamento retorna 401 e não libera os valores operacionais simulados.</p></div>
            <div className="adminCard"><span>D</span><h3>VR imersivo</h3><p>Em headset compatível, /vr abre uma sessão WebXR e renderiza a estação industrial com HUD de autorização.</p></div>
          </div>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
