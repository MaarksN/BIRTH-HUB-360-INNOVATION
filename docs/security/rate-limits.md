# Rate Limits e Controle de Abuso

Fase 2 usa rate limiting distribuido por Redis em runtime e store em memoria apenas em `NODE_ENV=test`. O objetivo e reduzir abuso sem bloquear rotas internas criticas.

## Grupos

- `api`: limite global para API autenticada, chaveado por tenant e grupo de rota.
- `login`: limite dedicado para login, chaveado por tenant informado, email e IP, com liberacao quando a tentativa termina com sucesso.
- `webhook`: limite dedicado para ingress de webhooks, chaveado por tenant quando conhecido, rota, assinatura e IP.

## Grupos de rota da API

- `admin`: `/api/v1/admin`, `/api/v1/break-glass`.
- `auth`: `/api/v1/auth`, `/api/v1/sessions`, `/api/v1/profile`, `/api/v1/apikeys`.
- `automation`: `/api/v1/agents`, `/api/v1/packs`, `/api/v1/tasks`, `/api/v1/workflows`.
- `billing`: `/api/v1/billing`, `/api/v1/budgets`.
- `connectors`: `/api/v1/connectors`.
- `data`: dashboard, analytics, conversations, feedback, invites, notifications, organizations, outputs, privacy, search e users.
- `marketplace`: `/api/v1/marketplace`.

## Rotas operacionais

Rotas de health, readiness, metrics, OpenAPI e docs sao ignoradas pelo limiter global para nao quebrar probes, scraping e diagnostico operacional. Elas continuam protegidas por rede, autenticacao quando aplicavel e configuracao de exposicao por ambiente.

## Headers e erros

Respostas limitadas retornam `429 Too Many Requests`, `Retry-After`, `RateLimit-Limit`, `RateLimit-Remaining` e `RateLimit-Reset` com corpo Problem Details.

## Testes

- `apps/api/tests/security.test.ts` valida bypass operacional para health.
- `apps/api/tests/security.test.ts` valida isolamento por tenant e grupo de rota para API.
- `apps/api/tests/security.test.ts` valida limite de webhook por tenant antes do processamento do provider.
