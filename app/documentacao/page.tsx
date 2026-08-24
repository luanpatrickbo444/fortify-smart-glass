import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const endpointRows = [
  ["POST", "/api/fortify/auth/login", "Valida identidade e credencial e emite token de pré-autenticação por 180 s."],
  ["POST", "/api/fortify/auth/mfa", "Valida o segundo fator e emite token intermediário por 180 s."],
  ["POST", "/api/fortify/device/validate", "Confere vínculo do Device ID e cria a sessão final em cookie httpOnly por 900 s."],
  ["GET", "/api/fortify/auth/session", "Retorna identidade, dispositivo, permissões e expiração da sessão autenticada."],
  ["POST", "/api/fortify/auth/logout", "Encerra a sessão e remove o cookie de autenticação."],
  ["POST", "/api/fortify/ai/query", "Autoriza a solicitação e encaminha ao LLM configurado sem expor a chave ao Smart Glasses."],
  ["POST", "/api/fortify/xr/equipment", "Libera dados industriais simulados somente para sessão autenticada com a permissão documents.read."],
];

const envRows = [
  ["FORTIFY_DEMO_USER", "Identidade usada na demonstração"],
  ["FORTIFY_DEMO_PASSWORD", "Credencial primária do protótipo"],
  ["FORTIFY_DEMO_MFA_CODE", "Código MFA de demonstração"],
  ["FORTIFY_ALLOWED_DEVICE_IDS", "Lista de Device IDs autorizados, separados por vírgula"],
  ["FORTIFY_JWT_SECRET", "Segredo HMAC-SHA256 para assinatura dos tokens; mínimo de 32 caracteres em produção"],
  ["LLM_ENDPOINT", "Endpoint opcional do serviço corporativo/LLM"],
  ["LLM_API_KEY", "Chave opcional do serviço de IA, mantida exclusivamente no servidor"],
];

const tests = [
  ["Login correto", "Credencial válida deve avançar para MFA."],
  ["Login incorreto", "Credencial inválida deve retornar 401 sem emitir token."],
  ["MFA incorreto", "Segundo fator inválido deve interromper o fluxo."],
  ["MFA expirado", "Token de pré-autenticação fora da janela de 180 s deve ser recusado."],
  ["Troca de dispositivo", "Device ID diferente daquele usado no login deve ser bloqueado."],
  ["Dispositivo não autorizado", "Device ID fora da allowlist deve retornar 403."],
  ["Rota protegida", "A página do assistente sem sessão válida deve redirecionar para o login."],
  ["Permissão ausente", "Consulta à IA sem ai.query deve retornar 403."],
  ["Logout", "O cookie de sessão deve ser removido e o acesso subsequente deve falhar."],
  ["Dados XR sem sessão", "A consulta ao ativo P-101 deve retornar 401 sem sessão autenticada."],
  ["WebXR", "Em HTTPS/headset compatível, a sessão immersive-vr deve abrir; em desktop sem WebXR, o simulador deve permanecer funcional."],
];

export default function DocumentationPage() {
  return (
    <main className="docsPage">
      <div className="brandStripe" aria-hidden="true" />
      <SiteHeader />

      <section className="docsHero">
        <div>
          <span className="docsKicker">DOCUMENTAÇÃO TÉCNICA • FORTIFY</span>
          <h1>Arquitetura, autenticação e operação do protótipo.</h1>
          <p>
            Documento de referência para entender o problema, a proposta técnica, os fluxos de autenticação,
            as APIs, os controles de segurança, as variáveis de ambiente e os limites atuais da solução.
          </p>
        </div>
        <div className="docsHeroBadge">
          <small>STATUS</small><strong>PROTÓTIPO FUNCIONAL</strong><span>Next.js • Security Gateway • Smart Glasses</span>
        </div>
      </section>

      <div className="docsLayout">
        <aside className="docsToc">
          <strong>NESTA PÁGINA</strong>
          <a href="#contexto">01. Contexto</a>
          <a href="#requisitos">02. Requisitos do desafio</a>
          <a href="#proposta">03. Proposta Fortify</a>
          <a href="#arquitetura">04. Arquitetura</a>
          <a href="#autenticacao">05. Autenticação</a>
          <a href="#sessao">06. Sessão e tokens</a>
          <a href="#controles">07. Controles de segurança</a>
          <a href="#api">08. API</a>
          <a href="#llm">09. Integração com IA</a>
          <a href="#dados">10. Dados e retenção</a>
          <a href="#ambiente">11. Variáveis de ambiente</a>
          <a href="#testes">12. Plano de testes</a>
          <a href="#deploy">13. Deploy</a>
          <a href="#xr">14. WebXR / VR</a>
          <a href="#producao">15. Produção</a>
          <Link href="/vr" className="docsTocCta">ABRIR SIMULAÇÃO XR</Link>
        </aside>

        <article className="docsContent">
          <section id="contexto" className="docSection">
            <div className="docNumber">01</div>
            <div>
              <span className="docEyebrow">CONTEXTO</span>
              <h2>O problema que o protótipo procura resolver</h2>
              <p>
                O desafio considera o uso de Smart Glasses para acessar soluções digitais corporativas baseadas em inteligência artificial.
                Como o wearable pode capturar imagem, áudio e localização e ainda operar em redes ou serviços de terceiros, a camada de acesso precisa controlar quem está usando o dispositivo, qual equipamento está sendo utilizado e quais recursos podem ser consultados.
              </p>
              <div className="docCallout">
                <b>Princípio central</b>
                <span>O Fortify não altera o LLM. Ele funciona antes do serviço de IA, na camada de acesso do dispositivo vestível.</span>
              </div>
            </div>
          </section>

          <section id="requisitos" className="docSection">
            <div className="docNumber">02</div>
            <div>
              <span className="docEyebrow">REQUISITOS DO DESAFIO</span>
              <h2>O que precisa ser garantido</h2>
              <div className="requirementGrid">
                <div><b>R1</b><strong>Autenticação confiável</strong><p>Confirmar de forma confiável a identidade de quem está utilizando o Smart Glasses.</p></div>
                <div><b>R2</b><strong>Proteção da comunicação</strong><p>Evitar que dados corporativos sejam expostos durante a comunicação e o processamento.</p></div>
                <div><b>R3</b><strong>Prevenção de vazamento</strong><p>Reduzir o risco de exposição indevida de informações sensíveis capturadas ou consultadas pelo dispositivo.</p></div>
                <div><b>R4</b><strong>Redes e terceiros</strong><p>Manter o controle de acesso mesmo quando o wearable utiliza infraestrutura externa ao ambiente corporativo.</p></div>
                <div><b>R5</b><strong>Camada independente</strong><p>Atuar na conexão via Smart Glasses sem exigir modificações no sistema de IA existente.</p></div>
                <div><b>R6</b><strong>Controle de retenção</strong><p>Tratar com cautela os dados capturados pelo wearable e evitar retenção desnecessária no protótipo.</p></div>
              </div>
            </div>
          </section>

          <section id="proposta" className="docSection">
            <div className="docNumber">03</div>
            <div>
              <span className="docEyebrow">PROPOSTA</span>
              <h2>Fortify como camada de acesso seguro</h2>
              <p>
                A solução implementa um gateway intermediário. O Smart Glasses autentica o usuário em três estágios e somente depois recebe uma sessão de curta duração. A consulta ao assistente passa pelo backend do Fortify, onde identidade, estágio de autenticação, dispositivo e permissão são verificados antes do encaminhamento ao LLM.
              </p>
              <div className="principleStrip">
                <span><b>01</b> Verificar usuário</span>
                <span><b>02</b> Confirmar MFA</span>
                <span><b>03</b> Confiar no device</span>
                <span><b>04</b> Autorizar recurso</span>
                <span><b>05</b> Auditar evento</span>
              </div>
            </div>
          </section>

          <section id="arquitetura" className="docSection">
            <div className="docNumber">04</div>
            <div>
              <span className="docEyebrow">ARQUITETURA</span>
              <h2>Fluxo lógico da solução</h2>
              <div className="docsArchitecture">
                <div className="docsArchNode"><small>CAMADA 1</small><strong>Smart Glasses</strong><span>Interface de autenticação e consulta</span></div>
                <i>↓ HTTPS / TLS</i>
                <div className="docsArchNode gateway"><small>CAMADA 2</small><strong>Fortify Security Gateway</strong><span>Identidade • MFA • Device Trust • JWT • RBAC • Auditoria</span></div>
                <i>↓ somente se autorizado</i>
                <div className="docsArchNode"><small>CAMADA 3</small><strong>Serviço de IA / LLM</strong><span>Serviço de destino permanece independente do wearable</span></div>
              </div>
              <div className="docTwoCols">
                <div><h3>Cliente</h3><p>Executa as telas de login, MFA, validação do equipamento e assistente. Tokens intermediários ficam apenas no sessionStorage durante o fluxo.</p></div>
                <div><h3>Servidor Next.js</h3><p>Assina e verifica tokens, controla cookies, aplica regras de autorização, audita eventos e mantém as credenciais do LLM fora do navegador.</p></div>
              </div>
            </div>
          </section>

          <section id="autenticacao" className="docSection">
            <div className="docNumber">05</div>
            <div>
              <span className="docEyebrow">AUTENTICAÇÃO</span>
              <h2>Três etapas antes da sessão final</h2>
              <ol className="flowList">
                <li><b>Identidade e credencial.</b><span>O endpoint de login valida usuário, senha/PIN e registra o Device ID usado no início da jornada.</span></li>
                <li><b>Segundo fator.</b><span>O código MFA só é aceito se existir um token de pré-autenticação válido no estágio password.</span></li>
                <li><b>Confiança do Smart Glasses.</b><span>O Device ID precisa coincidir com o usado no login e também pertencer à lista de equipamentos autorizados.</span></li>
                <li><b>Sessão autenticada.</b><span>Somente depois das três validações é emitido o cookie fortify_session com permissões de acesso.</span></li>
              </ol>
              <div className="docCallout warning">
                <b>Protótipo x produção</b>
                <span>O código MFA fixo e a lista de dispositivos em variável de ambiente existem para demonstração. Em produção, devem ser substituídos por IdP/MFA corporativo e inventário de dispositivos gerenciados.</span>
              </div>
            </div>
          </section>

          <section id="sessao" className="docSection">
            <div className="docNumber">06</div>
            <div>
              <span className="docEyebrow">SESSÃO E TOKENS</span>
              <h2>Modelo de tokens do protótipo</h2>
              <div className="tokenTimeline">
                <div><strong>PRE-AUTH</strong><span>stage=password</span><b>180 s</b></div>
                <i>→</i>
                <div><strong>MFA TOKEN</strong><span>stage=mfa</span><b>180 s</b></div>
                <i>→</i>
                <div><strong>SESSION</strong><span>stage=authenticated</span><b>900 s</b></div>
              </div>
              <p>
                Os tokens são assinados com HMAC-SHA256 usando <code>FORTIFY_JWT_SECRET</code>. A sessão final é armazenada em cookie <code>httpOnly</code>, com <code>SameSite=Strict</code> e flag <code>Secure</code> em produção. O cliente não recebe a chave de assinatura.
              </p>
              <pre className="docCode">{`{
  "sub": "colaborador@fortify.local",
  "stage": "authenticated",
  "deviceId": "FORTIFY-GLASS-001",
  "permissions": ["ai.query", "documents.read"],
  "iat": 1787580000,
  "exp": 1787580900
}`}</pre>
            </div>
          </section>

          <section id="controles" className="docSection">
            <div className="docNumber">07</div>
            <div>
              <span className="docEyebrow">CONTROLES DE SEGURANÇA</span>
              <h2>Controles implementados atualmente</h2>
              <div className="securityMatrix">
                <div><b>Identidade</b><span>Credencial primária antes de qualquer sessão.</span></div>
                <div><b>MFA</b><span>Segundo estágio independente do login inicial.</span></div>
                <div><b>Device Binding</b><span>Vínculo entre a jornada de autenticação e o Device ID.</span></div>
                <div><b>Allowlist</b><span>Somente IDs configurados podem concluir o fluxo.</span></div>
                <div><b>JWT assinado</b><span>Integridade dos estados de autenticação e expiração.</span></div>
                <div><b>Cookie httpOnly</b><span>Reduz exposição do token final ao JavaScript do navegador.</span></div>
                <div><b>RBAC simples</b><span>A permissão ai.query é verificada antes de cada consulta.</span></div>
                <div><b>Auditoria</b><span>Eventos relevantes são emitidos em JSON no log do backend.</span></div>
                <div><b>Security headers</b><span>Nosniff, frame deny, referrer policy, permissions policy e COOP.</span></div>
              </div>
            </div>
          </section>

          <section id="api" className="docSection">
            <div className="docNumber">08</div>
            <div>
              <span className="docEyebrow">API</span>
              <h2>Endpoints do Security Gateway</h2>
              <div className="apiTable" role="table" aria-label="Endpoints do Fortify">
                {endpointRows.map(([method,path,desc]) => (
                  <div className="apiRow" key={path} role="row">
                    <b>{method}</b><code>{path}</code><span>{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="llm" className="docSection">
            <div className="docNumber">09</div>
            <div>
              <span className="docEyebrow">INTEGRAÇÃO COM IA</span>
              <h2>Por que o Smart Glasses não chama o LLM diretamente</h2>
              <p>
                A rota <code>/api/fortify/ai/query</code> é o único ponto do protótipo responsável por acessar o serviço de IA. Antes do encaminhamento ela valida a sessão, exige o estágio <code>authenticated</code>, confirma a existência do Device ID e verifica a permissão <code>ai.query</code>.
              </p>
              <div className="compareGrid">
                <div className="compareBad"><small>EVITAR</small><strong>Smart Glasses → chave de API → LLM</strong><p>Expõe segredo no cliente e elimina um ponto central de autorização.</p></div>
                <div className="compareGood"><small>FORTIFY</small><strong>Smart Glasses → Gateway → LLM</strong><p>Mantém segredo no servidor e permite autenticação, autorização e auditoria antes do acesso.</p></div>
              </div>
              <p>
                Quando <code>LLM_ENDPOINT</code> não está configurado, a rota devolve uma resposta simulada que confirma as verificações feitas. Quando configurado, o backend envia a mensagem ao endpoint externo e adiciona contexto de identidade, dispositivo e permissões.
              </p>
            </div>
          </section>

          <section id="dados" className="docSection">
            <div className="docNumber">10</div>
            <div>
              <span className="docEyebrow">DADOS E RETENÇÃO</span>
              <h2>O que o protótipo armazena — e o que não armazena</h2>
              <div className="docTwoCols">
                <div><h3>Armazenamento temporário</h3><p>Device ID em localStorage; tokens intermediários em sessionStorage; sessão final em cookie httpOnly; eventos de auditoria nos logs do backend.</p></div>
                <div><h3>Não implementado</h3><p>O protótipo não grava imagem, áudio, geolocalização, biometria ou conversas em banco de dados. Também não implementa retenção corporativa real.</p></div>
              </div>
              <div className="docCallout">
                <b>Diretriz para evolução</b>
                <span>Qualquer captura sensível do Smart Glasses deve seguir minimização de dados, propósito explícito, tempo de retenção definido e controles de acesso compatíveis com a política corporativa aplicável.</span>
              </div>
            </div>
          </section>

          <section id="ambiente" className="docSection">
            <div className="docNumber">11</div>
            <div>
              <span className="docEyebrow">CONFIGURAÇÃO</span>
              <h2>Variáveis de ambiente</h2>
              <div className="envTable">
                {envRows.map(([name,desc]) => <div key={name}><code>{name}</code><span>{desc}</span></div>)}
              </div>
              <pre className="docCode">{`FORTIFY_DEMO_USER=colaborador@fortify.local
FORTIFY_DEMO_PASSWORD=Fortify@123
FORTIFY_DEMO_MFA_CODE=246810
FORTIFY_ALLOWED_DEVICE_IDS=FORTIFY-GLASS-001,FORTIFY-GLASS-002
FORTIFY_JWT_SECRET=<segredo-com-32-ou-mais-caracteres>
LLM_ENDPOINT=
LLM_API_KEY=`}</pre>
            </div>
          </section>

          <section id="testes" className="docSection">
            <div className="docNumber">12</div>
            <div>
              <span className="docEyebrow">VALIDAÇÃO</span>
              <h2>Plano mínimo de testes</h2>
              <div className="testGrid">
                {tests.map(([title,desc]) => <div key={title}><b>{title}</b><span>{desc}</span></div>)}
              </div>
            </div>
          </section>

          <section id="deploy" className="docSection">
            <div className="docNumber">13</div>
            <div>
              <span className="docEyebrow">DEPLOY</span>
              <h2>Execução local e Vercel</h2>
              <h3>Local</h3>
              <pre className="docCode">{`npm install
copy .env.example .env.local
npm run dev`}</pre>
              <h3>Vercel</h3>
              <p>Use o preset <b>Next.js</b>, deixe Build Command e Output Directory em detecção automática e cadastre todas as variáveis de ambiente antes de realizar o deployment de produção.</p>
              <div className="docCallout warning"><b>Importante</b><span>Não configure <code>public</code> como Output Directory. Em um app Next.js com rotas de API, a Vercel deve usar o output nativo do framework.</span></div>
            </div>
          </section>

          <section id="xr" className="docSection">
            <div className="docNumber">14</div>
            <div>
              <span className="docEyebrow">WEBXR / VR</span>
              <h2>Como o VR simula os Smart Glasses</h2>
              <p>
                A rota <code>/vr</code> adiciona uma camada de demonstração imersiva. O headset VR não é apresentado como substituto do Smart Glasses final; ele funciona como um emulador da experiência do wearable durante a prototipação, permitindo demonstrar o fluxo de segurança em um ambiente tridimensional sem depender de hardware óptico específico.
              </p>
              <div className="docsArchitecture">
                <div className="docsArchNode"><small>CLIENTE XR</small><strong>Headset VR / WebXR</strong><span>Simula a interface do dispositivo vestível</span></div>
                <i>↓ HTTPS</i>
                <div className="docsArchNode gateway"><small>SEGURANÇA</small><strong>Fortify Security Gateway</strong><span>Identity • MFA • Device Trust • JWT • RBAC • Audit</span></div>
                <i>↓ autorização</i>
                <div className="docsArchNode"><small>RECURSOS</small><strong>IA + dados simulados</strong><span>LLM e ativo industrial P-101</span></div>
              </div>
              <div className="docTwoCols">
                <div><h3>Modo desktop</h3><p>Funciona em qualquer navegador moderno como simulador 2D/3D, permitindo autenticar, consultar o equipamento P-101 e usar o assistente sem headset.</p></div>
                <div><h3>Modo imersivo</h3><p>Em HTTPS e navegador compatível com WebXR, o botão de modo imersivo inicia uma sessão <code>immersive-vr</code> com configuração mínima para maximizar a compatibilidade. Depois, o Fortify tenta <code>local-floor</code>, <code>local</code> e por fim <code>viewer</code> como espaços de referência, renderiza o ativo em WebGL e apresenta o HUD de autorização.</p></div>
              </div>
              <h3>Interação da demonstração</h3>
              <ol className="flowList">
                <li><b>Autenticar.</b><span>O operador conclui identidade, MFA e Device Trust na própria rota XR.</span></li>
                <li><b>Entrar no ambiente.</b><span>O navegador solicita uma sessão WebXR somente depois da sessão Fortify estar autenticada.</span></li>
                <li><b>Selecionar o ativo.</b><span>O controlador do headset ou o simulador solicita o ativo P-101.</span></li>
                <li><b>Autorizar os dados.</b><span>O endpoint XR exige o cookie de sessão e a permissão <code>documents.read</code>.</span></li>
                <li><b>Consultar IA.</b><span>A análise é enviada ao endpoint <code>/api/fortify/ai/query</code>, que exige <code>ai.query</code> e mantém a credencial do LLM no servidor.</span></li>
              </ol>
              <div className="docCallout warning"><b>Limite da simulação</b><span>O cenário industrial e os valores do ativo P-101 são dados fictícios para demonstração. Não representam informação operacional da Petrobras. A marca é usada no contexto acadêmico do desafio e o protótipo não deve ser apresentado como sistema oficial ou homologado.</span></div>
              <h3>Requisitos para testar em headset</h3>
              <pre className="docCode">{`1. Fazer deploy HTTPS (ex.: Vercel)
2. Abrir /vr no navegador do headset
3. Concluir Login → MFA → Device Trust
4. Clicar em "Entrar no modo imersivo"
5. Pressionar o gatilho do controle para alternar os dados do P-101`}</pre>
            </div>
          </section>

          <section id="producao" className="docSection">
            <div className="docNumber">15</div>
            <div>
              <span className="docEyebrow">EVOLUÇÃO PARA PRODUÇÃO</span>
              <h2>O que ainda precisaria ser substituído ou integrado</h2>
              <div className="productionList">
                <div><b>IdP corporativo</b><span>Substituir credenciais de demonstração por OIDC/SAML/SSO aprovado.</span></div>
                <div><b>MFA real</b><span>Integrar WebAuthn/FIDO2, push corporativo ou biometria homologada.</span></div>
                <div><b>MDM / inventário</b><span>Validar certificados e postura do dispositivo em vez de uma allowlist estática.</span></div>
                <div><b>Chaves gerenciadas</b><span>Usar secret manager/KMS e rotação periódica.</span></div>
                <div><b>Políticas granulares</b><span>Expandir RBAC/ABAC por usuário, função, local, risco e tipo de informação.</span></div>
                <div><b>Observabilidade</b><span>Enviar auditoria para SIEM, definir alertas e trilhas de investigação.</span></div>
                <div><b>DLP e classificação</b><span>Adicionar políticas de prevenção de vazamento no conteúdo enviado e devolvido pela IA.</span></div>
                <div><b>Privacidade</b><span>Definir tratamento e retenção de imagem, áudio, localização e eventuais dados biométricos.</span></div>
              </div>
              <div className="finalDocPanel">
                <span>RESUMO</span>
                <h3>O protótipo prova a camada de acesso, não substitui uma arquitetura corporativa completa.</h3>
                <p>Seu valor é demonstrar de forma concreta como identidade, MFA, confiança do dispositivo e autorização podem ser aplicados antes de um Smart Glasses consultar um LLM sem modificar o sistema de IA existente.</p>
                <Link href="/vr" className="heroPrimary">Executar simulação XR</Link>
              </div>
            </div>
          </section>
        </article>
      </div>

      <SiteFooter />
    </main>
  );
}
