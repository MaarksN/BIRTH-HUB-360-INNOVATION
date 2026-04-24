# Dividas de Seguranca

Escopo: seguranca, RBAC, autorizacao, autenticacao, multi-tenancy, secrets, webhooks, cookies, CORS, CSP, rate limit, dependencias vulneraveis, uploads, headers e criptografia.

## Achados confirmados

- `TD-001` - `.env` rastreado e arquivos sealed/env com material sensivel exigindo verificacao. Severidade critica.
- `TD-003` - tokens em query string em clientes de integracao: `social-ads.ts`, `signatures.ts`, `crm.ts`, `crm-extended.ts`, `analytics.ts`. Severidade critica.
- `TD-013` - regra ESLint customizada anti-query sem tenant cobre apenas 10 arquivos. Severidade alta.
- `TD-022`/`TD-023` - supply-chain do CI/scanners sem pin por SHA/digest/checksum. Severidade alta.
- `TD-024` - `pnpm audit` encontrou vulnerabilidade moderada em `uuid` via `bullmq`.

## Suspeitas e verificacoes manuais necessarias

- `TD-014` - webhook Zenvia deve provar isolamento por tenant no lookup e no segredo.
- `TD-015` - `trustedContext` pula assinatura externa; revisar todas as rotas internas que chamam esse caminho.
- Cookies, CORS, CSP e headers existem em codigo/config, mas nao foram exercitados com um servidor real nesta auditoria.
- Uploads nao foram encontrados como area dominante, mas validacao de tamanho/tipo deve ser verificada por fluxo.
- Criptografia de segredos de integracao foi parcialmente inferida por nomes e testes, nao validada ponta a ponta.

## Evidencias principais

- `.env:1` contem `DATABASE_URL` mascarado neste relatorio.
- `k8s/deployment.yaml:25` contem `DATABASE_URL` em `Secret.stringData`.
- `packages/integrations/src/clients/social-ads.ts:31` usa `access_token` em URL.
- `packages/integrations/src/clients/analytics.ts:37` usa `api_secret` em URL.
- `apps/api/src/modules/connectors/service.ts:1338-1341` busca Zenvia por id/provider.
- `apps/api/src/modules/connectors/service.ts:1530-1539` pula assinatura se houver `trustedContext`.
- `eslint.config.mjs:42-52` limita regra anti-tenant a poucos arquivos.

## Comandos usados

- `git ls-files .env .env.local .env.example .env.vps.example ops/release/sealed/...`
- `rg -n "access_token=|api_token=|api_secret|token=\\$\\{|password=|Authorization|Bearer|console\\.(log|error|warn|info)"`
- `pnpm audit --audit-level low`
- `pnpm exec eslint .`
- testes manuais: `node --import tsx --test --test-concurrency=1 apps/api/tests/auth.test.ts apps/api/tests/security.test.ts apps/api/tests/billing.webhook.test.ts`

## Ferramentas recomendadas

Semgrep, gitleaks, trufflehog, OWASP Dependency Check, Snyk/OSV, ZAP/DAST, actionlint/zizmor, policy-as-code para Kubernetes e um teste automatizado de redacao de logs.

## Proximos passos

1. Rotacionar qualquer segredo real que possa ter sido versionado.
2. Remover tokens de query string e impor cliente HTTP central.
3. Revisar webhooks Zenvia/Stripe/HubSpot com testes negativos cross-tenant.
4. Ampliar regra de tenant para todo backend/worker.
5. Pinning de GitHub Actions e scanners.
