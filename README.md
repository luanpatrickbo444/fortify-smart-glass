# Fortify — Smart Glasses Security Gateway

Protótipo acadêmico em Next.js para o desafio de inovação Petrobras / SENAI sobre **acesso seguro à IA por Smart Glasses**.

## O que esta versão contém

- Redesign institucional inspirado nas cores públicas da marca Petrobras.
- Uso da logomarca horizontal da Petrobras no lockup visual do protótipo.
- Landing page executiva em `/`.
- Documentação técnica completa em `/documentacao`.
- Visão de arquitetura em `/admin`.
- Jornada do Smart Glasses em `/glass/login` → `/glass/mfa` → `/glass/device` → `/glass/assistant`.
- Security Gateway com autenticação em estágios, Device ID, JWT HMAC-SHA256, cookie httpOnly, autorização e auditoria.
- Integração opcional com LLM externo via `LLM_ENDPOINT` e `LLM_API_KEY`.

> Este repositório é um protótipo acadêmico. Não representa produto oficial, sistema produtivo ou arquitetura homologada da Petrobras.

## Rotas

- `/` — apresentação executiva
- `/documentacao` — documentação completa
- `/admin` — arquitetura e controles
- `/glass/login` — identidade
- `/glass/mfa` — segundo fator
- `/glass/device` — confiança do dispositivo
- `/glass/assistant` — assistente protegido

## Variáveis de ambiente

Copie `.env.example` para `.env.local` em desenvolvimento.

```env
FORTIFY_DEMO_USER=colaborador@fortify.local
FORTIFY_DEMO_PASSWORD=Fortify@123
FORTIFY_DEMO_MFA_CODE=246810
FORTIFY_ALLOWED_DEVICE_IDS=FORTIFY-GLASS-001,FORTIFY-GLASS-002
FORTIFY_JWT_SECRET=troque-por-um-segredo-com-32-ou-mais-caracteres
LLM_ENDPOINT=
LLM_API_KEY=
```

Em produção, `FORTIFY_JWT_SECRET` precisa ter pelo menos 32 caracteres.

## Executar localmente

```bash
npm install
npm run dev
```

## Deploy na Vercel

Use:

- Framework Preset: `Next.js`
- Build Command: automático
- Output Directory: automático
- Install Command: automático

**Não configure `public` como Output Directory.**

Cadastre as variáveis de ambiente antes do redeploy de produção.

## Logomarca Petrobras

A interface utiliza a logomarca horizontal da Petrobras por URL pública do Wikimedia Commons, cuja página de origem referencia a Petrobras como autora. O uso neste projeto é apenas para apresentação acadêmica do desafio; direitos marcários e diretrizes de marca continuam aplicáveis.
