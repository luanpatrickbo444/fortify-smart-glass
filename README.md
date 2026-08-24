# Fortify — Smart Glasses + WebXR | Production-ready Demo

Protótipo acadêmico em Next.js para demonstrar acesso seguro a IA e dados restritos por meio de Smart Glasses, com um módulo WebXR/VR usado como emulador da experiência vestível durante a apresentação.

> **Importante:** este repositório é um protótipo de demonstração para o desafio SENAI. Não representa sistema oficial, integração produtiva ou solução homologada pela Petrobras. Os dados industriais mostrados no cenário XR são totalmente fictícios.

## O que está pronto

- Identidade + senha/PIN
- MFA em estágio separado com TOTP (Authenticator) ou código alternativo
- Device Binding durante a autenticação
- Allowlist de Device IDs
- Pré-auth e MFA em cookies `httpOnly` de curta duração
- JWT HMAC-SHA256
- Cookie de sessão `httpOnly`, `SameSite=Strict` e `Secure` em produção
- RBAC com `ai.query` e `documents.read`
- Fortify Security Gateway
- Endpoint de IA com chave mantida no servidor
- Auditoria em logs JSON
- Simulador industrial no navegador
- WebXR `immersive-vr` sem dependência externa de engine 3D
- Ativo industrial fictício P-101 protegido por autorização
- Painel de arquitetura
- Página de documentação técnica completa
- Layout corporativo para apresentação

## Rotas

| Rota | Função |
| --- | --- |
| `/` | Home institucional |
| `/vr` | Simulador XR + modo WebXR imersivo |
| `/glass/login` | Login Smart Glasses |
| `/glass/mfa` | MFA |
| `/glass/device` | Device Trust |
| `/glass/assistant` | Assistente protegido |
| `/admin` | Arquitetura e cenários de demonstração |
| `/documentacao` | Documentação completa |

## APIs

| Método | Endpoint | Controle |
| --- | --- | --- |
| POST | `/api/fortify/auth/login` | identidade + credencial |
| POST | `/api/fortify/auth/mfa` | token pré-auth + MFA |
| POST | `/api/fortify/device/validate` | Device Binding + allowlist |
| GET | `/api/fortify/auth/session` | cookie autenticado |
| POST | `/api/fortify/auth/logout` | encerra sessão |
| POST | `/api/fortify/ai/query` | `ai.query` |
| POST | `/api/fortify/xr/equipment` | `documents.read` |

## Arquitetura

```text
SMART GLASSES / HEADSET VR (simulação)
                │
                │ HTTPS / TLS
                ▼
      FORTIFY SECURITY GATEWAY
                │
                ├── Identidade
                ├── MFA
                ├── Device Trust
                ├── JWT
                ├── RBAC
                └── Auditoria
                │
        somente se autorizado
                │
       ┌────────┴─────────┐
       ▼                  ▼
 IA / LLM          DADOS P-101
 corporativo       simulados
```

## Variáveis de ambiente

Copie `.env.example` para `.env.local`.

```env
FORTIFY_DEMO_USER=colaborador@fortify.local
FORTIFY_DEMO_PASSWORD=Fortify@123
FORTIFY_TOTP_SECRET=<segredo-base32-do-authenticator>
FORTIFY_MFA_RECOVERY_CODE=246810
FORTIFY_DEMO_MFA_CODE=246810
FORTIFY_ALLOWED_DEVICE_IDS=FORTIFY-GLASS-001,FORTIFY-GLASS-002
FORTIFY_JWT_SECRET=<segredo-com-32-ou-mais-caracteres>
LLM_ENDPOINT=
LLM_API_KEY=
```

### Gerar FORTIFY_JWT_SECRET no Windows PowerShell

```powershell
$bytes = New-Object byte[] 48
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

Ou com Node.js:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```


## MFA da versão de produção

O Fortify agora aceita dois métodos na segunda etapa:

- **TOTP**: código de 6 dígitos de Google Authenticator, Microsoft Authenticator, 1Password, Authy ou aplicativo compatível.
- **Código alternativo**: contingência configurada em `FORTIFY_MFA_RECOVERY_CODE`. Para a demonstração, pode continuar em `246810`; em operação real deve ser aleatório e rotacionado após uso.

Para gerar um segredo TOTP sem OpenSSL:

```powershell
npm run mfa:secret
```

O comando imprime `FORTIFY_TOTP_SECRET` e uma URI `otpauth://`. Cadastre o segredo no aplicativo autenticador e copie o valor para a Vercel. Se `FORTIFY_TOTP_SECRET` ficar vazio, o botão de Authenticator não é apresentado e o código alternativo continua disponível.

Os tokens de pré-autenticação e MFA não ficam mais no `sessionStorage`; são mantidos em cookies `httpOnly`, `SameSite=Strict` e `Secure` no deployment de produção.

> Manter `colaborador@fortify.local` / `Fortify@123` é adequado para a demonstração solicitada. Para uso corporativo real, substitua essa identidade fixa por IdP OIDC/SAML e política corporativa de senha/passkey.

## Executar localmente

```powershell
npm install
copy .env.example .env.local
npm run dev
```

Abra:

```text
http://localhost:3000
```

O modo desktop da rota `/vr` funciona localmente. O modo WebXR imersivo depende do navegador/headset e normalmente deve ser testado em contexto seguro HTTPS.

## Deploy na Vercel

Configure:

```text
Framework Preset: Next.js
Build Command: Automatic
Output Directory: Automatic
Install Command: Automatic
```

**Não configure `public` como Output Directory.**

Cadastre as variáveis de ambiente e faça um novo redeploy após qualquer alteração nelas.

## Teste do fluxo

Credenciais de demonstração, se mantidos os valores do `.env.example`:

```text
Usuário: colaborador@fortify.local
Senha: Fortify@123
MFA alternativo: 246810
Device ID: FORTIFY-GLASS-001
```

Fluxo:

```text
Login
  ↓
MFA
  ↓
Device Trust
  ↓
Sessão autenticada
  ↓
/vr
  ↓
Consultar P-101
  ↓
Fortify verifica documents.read
  ↓
Dados liberados
  ↓
Consulta à IA
  ↓
Fortify verifica ai.query
```

## Teste com VR / WebXR

1. Faça deploy em HTTPS.
2. Abra `https://SEU-DOMINIO/vr` no navegador do headset.
3. Conclua Login → MFA → Device Trust.
4. Clique em **ENTRAR NO MODO IMERSIVO**.
5. O ambiente WebXR renderiza o equipamento P-101 e o HUD Fortify.
6. Pressione o gatilho do controlador para carregar/alternar os dados autorizados do equipamento.

Se o headset ou navegador não disponibilizar `navigator.xr`, a página informa que o modo imersivo não está disponível e continua funcionando como simulador desktop.

## Demonstrações de segurança para a banca

### Cenário 1 — acesso autorizado

Usuário correto + MFA correto + Device ID permitido → sessão emitida → dados e IA liberados.

### Cenário 2 — dispositivo bloqueado

Use outro Device ID, por exemplo:

```text
VR-NAO-AUTORIZADO
```

Mesmo com usuário e MFA corretos, o Fortify bloqueia a sessão na etapa Device Trust.

### Cenário 3 — endpoint protegido

Sem sessão autenticada, `/api/fortify/xr/equipment` retorna `401` e não libera os valores do P-101.

### Cenário 4 — acesso à IA mediado

O navegador não recebe `LLM_API_KEY`. A rota do Gateway valida a sessão e a permissão antes de encaminhar qualquer solicitação.

## Limites do protótipo

A solução implementa a prova de conceito da camada de acesso. Para produção, seriam necessárias integrações como:

- IdP corporativo OIDC/SAML
- WebAuthn/FIDO2 ou MFA homologado
- certificados por dispositivo e MDM/UEM
- RBAC/ABAC corporativo
- SIEM
- DLP
- KMS/secret manager
- retenção e classificação formal de dados
- hardening do dispositivo vestível
- integração real com LLM e APIs corporativas aprovadas

## Estrutura principal

```text
app/
├── api/fortify/
│   ├── auth/
│   ├── device/
│   ├── ai/query/
│   └── xr/equipment/
├── admin/
├── documentacao/
├── glass/
└── vr/

components/
├── VRExperience.tsx
├── Logo.tsx
├── PetrobrasLogo.tsx
├── SiteHeader.tsx
└── SiteFooter.tsx

lib/
├── audit.ts
├── config.ts
└── crypto.ts
```
