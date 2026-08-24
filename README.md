# Fortify — Secure Smart Glasses Access

Protótipo em Next.js para demonstrar uma **camada de acesso seguro** entre Smart Glasses e um sistema corporativo/LLM.

## Fluxo implementado

1. Identidade corporativa + senha/PIN
2. MFA de 6 dígitos (demonstração)
3. Validação do `device_id` do Smart Glasses
4. Emissão de JWT assinado em cookie `httpOnly`, `SameSite=Strict`, validade de 15 minutos
5. Autorização RBAC (`ai.query`, `documents.read`)
6. Acesso ao LLM somente por `/api/fortify/ai/query`
7. Auditoria estruturada via logs JSON
8. Logout e expiração automática de sessão

## Executar

```bash
cp .env.example .env.local
npm install
npm run dev
```

Abra `http://localhost:3000`.

### Credenciais de demonstração

- Usuário: `colaborador@fortify.local`
- Senha: `Fortify@123`
- MFA: `246810`
- Device ID: `FORTIFY-GLASS-001`

Altere tudo no `.env.local` antes de qualquer demonstração pública.

## Rotas

- `/glass/login` — autenticação no dispositivo
- `/glass/mfa` — segundo fator
- `/glass/device` — validação do Smart Glasses
- `/glass/assistant` — área protegida
- `/admin` — visão arquitetural do protótipo

## API

- `POST /api/fortify/auth/login`
- `POST /api/fortify/auth/mfa`
- `POST /api/fortify/device/validate`
- `GET /api/fortify/auth/session`
- `POST /api/fortify/auth/logout`
- `POST /api/fortify/ai/query`

## LLM corporativo

O Smart Glasses **não acessa diretamente o LLM**. Configure `LLM_ENDPOINT` e `LLM_API_KEY` no servidor. O endpoint `/api/fortify/ai/query` valida a sessão e então faz o encaminhamento.

## Importante para produção

Este repositório é um protótipo funcional para apresentação. Para produção, substitua as credenciais demo por IdP corporativo (OIDC/SAML), use WebAuthn/FIDO2 ou MFA homologado, certificados reais de dispositivo (mTLS), persistência de auditoria, rate limiting distribuído, secrets manager/KMS, políticas de DLP e revogação centralizada.
