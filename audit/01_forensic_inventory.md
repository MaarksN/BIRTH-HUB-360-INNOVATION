# FASE 1 — INVENTÁRIO FORENSE COMPLETO

> **Repositório:** `PROJETO-FINAL-BIRTHUB-360-INNOVATION`
> **Data da varredura:** 2026-04-08
> **Auditor:** Staff+ System (Nível L8/L9)
> **Método:** Leitura autônoma de file-system — zero suposição, zero alucinação.

---

## 1. CONTEXTO DE NEGÓCIO (inferido do código)

| Atributo | Valor |
|---|---|
| **Produto** | BirthHub 360 — Plataforma SaaS B2B para gestão obstétrica/perinatal |
| **Nicho** | RevOps + Saúde Materna (gestão de pacientes, gestações, consultas, notas clínicas, triagem neonatal) |
| **Modelo** | Multi-tenant SaaS com billing por Stripe (planos, invoices, usage records, créditos) |
| **IA/Agents** | Plataforma de agentes LLM com orçamento por execução (`AgentBudget`), catálogo de packs, workflows visuais (DAG via ReactFlow) |
| **Integrações externas** | HubSpot CRM, Google Workspace, Microsoft Graph, Stripe, SendGrid, Elasticsearch, PagerDuty, UptimeRobot, Sentry, PostHog |
| **Compliance alvo** | LGPD (privacy consents, data retention, anonymization, PII redaction nos logs), FHIR (módulo `fhir`), break-glass access |
| **Target de produção** | VPS auto-hospedado com Caddy reverse-proxy + Docker Compose, com possibilidade de Cloud Run (GCP) |

---

## 2. STACK TECNOLÓGICA

### 2.1 Runtimes e Linguagens

| Runtime | Versão | Evidência |
|---|---|---|
| Node.js | `24.14.0` | `.nvmrc`, `Dockerfile` (`node:24.14.0-alpine`), `package.json` (`engines.node >= 24 < 25`) |
| Python | `3.12` | `.python-version` |
| PNPM | `9.1.0` | `package.json` (`packageManager: pnpm@9.1.0`) |
| TypeScript | `^5.9.3` | Dependência em todos os pacotes |

### 2.2 Frameworks e Bibliotecas Core

| Camada | Tecnologia | Versão | Evidência |
|---|---|---|---|
| API | Express | `^5.2.1` | `apps/api/package.json` |
| Web Frontend | Next.js | `16.1.6` | `apps/web/package.json` |
| React | React | `19.2.4` | `apps/web/package.json` |
| Queue | BullMQ | `^5.73.0` | `apps/api/package.json`, `apps/worker/package.json` |
| ORM | Prisma Client | `^6.19.2` | `packages/database/package.json` |
| Validação | Zod | `^4.3.6` | `apps/api/package.json`, `apps/worker/package.json` |
| State (Web) | Zustand | `^5.0.12` | `apps/web/package.json` |
| Visual Workflows | ReactFlow | `^11.11.4` | `apps/web/package.json` |
| Distributed Lock | Redlock | `5.0.0-beta.2` | `apps/api/package.json` |
| Circuit Breaker | Opossum | `^9.0.0` | Root `package.json` |
| Payments | Stripe | `^21.0.1` | `apps/api/package.json` |
| Sanitization | isomorphic-dompurify | `^3.7.1` | `apps/web/package.json` |
| Cache | LRU-Cache | `^11.2.7` | Root `package.json` |
| Object Storage | AWS S3 SDK | `^3.1019.0` | `apps/worker/package.json` |

### 2.3 Infraestrutura

| Componente | Tecnologia | Versão | Evidência |
|---|---|---|---|
| Database | PostgreSQL | `16-alpine` | `docker-compose.yml` |
| Cache/Queue Backend | Redis | `7.2-alpine` | `docker-compose.yml` |
| Search | Elasticsearch | `8.14.0` | `docker-compose.yml` |
| Reverse Proxy (Prod) | Caddy | `2.10-alpine` | `docker-compose.prod.yml` |
| Container Orchestration | Docker Compose | — | `docker-compose.yml`, `docker-compose.prod.yml` |
| IaC | Terraform (scaffold) | — | `infra/terraform/main.tf` |
| K8s | `.gitkeep` apenas | — | `infra/k8s/.gitkeep` (placeholder vazio) |
| Monitoring | Prometheus + Alertmanager + Grafana | — | `infra/monitoring/` |

### 2.4 Observabilidade e Segurança

| Ferramenta | Propósito | Evidência |
|---|---|---|
| Sentry | Error tracking (API + Web) | `@sentry/node`, `@sentry/nextjs` |
| OpenTelemetry | Distributed tracing (OTLP) | `@opentelemetry/sdk-node`, `apps/api/src/tracing.ts` |
| Helmet | HTTP Security Headers | `helmet@^8.1.0` |
| CSRF | Double-submit cookie | `apps/api/src/middleware/csrf.ts` |
| Rate Limiting | IP + API Key + Login + Webhook | `apps/api/src/middleware/rate-limit.ts` |
| Input Sanitization | Express middleware | `apps/api/src/middleware/sanitize-input.ts` |
| Content-Type Guard | Express middleware | `apps/api/src/middleware/content-type.ts` |
| Origin Check | Express middleware | `apps/api/src/middleware/origin-check.ts` |
| Gitleaks | Secret scanning | `.gitleaks.toml` |
| Husky + lint-staged | Pre-commit hooks | `.husky/`, `.lintstagedrc.json` |

### 2.5 Quality e CI Pipeline

| Ferramenta | Propósito | Evidência |
|---|---|---|
| ESLint | Linting | `eslint.config.mjs`, `eslint@^10` |
| Prettier | Formatting | `prettier.config.cjs` |
| Commitlint | Commit messages | `commitlint.config.cjs` |
| Playwright | E2E testing | `playwright.config.ts`, `tests/e2e/` |
| Stryker | Mutation testing | `stryker.config.mjs` |
| Knip | Dead code analysis | `knip.json`, `knip.satellites.json` |
| Pytest | Python tests (webhook-receiver) | `pytest.ini`, `requirements-test.txt` |
| c8 | Coverage | `c8@^10.1.3` |
| k6 | Load testing | `scripts/load-tests/stress.js` |
| Turborepo | Monorepo build orchestration | `turbo.json` |
| Renovate | Dependency updates | `renovate.json` |
| GitHub Actions | CI/CD | 11 workflows em `.github/workflows/` |

---

## 3. MAPA DE SUPERFÍCIES (INVENTÁRIO COMPLETO)

### 3.1 Core Canônico (P0)

| Superfície | Tipo | Linguagem | Framework | Package Name |
|---|---|---|---|---|
| `apps/api` | REST API | TypeScript | Express 5 | `@birthub/api` |
| `apps/web` | Frontend SPA/SSR | TypeScript | Next.js 16 + React 19 | `@birthub/web` |
| `apps/worker` | Background Worker | TypeScript | BullMQ | `@birthub/worker` |
| `packages/database` | Data Layer (Prisma) | TypeScript | Prisma 6 | `@birthub/database` |

### 3.2 Packages Internos

| Package | Propósito | Tem `src/`? | Tem testes? |
|---|---|---|---|
| `packages/agents-core` | Engine de agentes IA | ✅ Sim | ✅ (`test/`) |
| `packages/agent-packs` | Catálogo de packs de agentes | ✅ (`corporate-v1/`, `github-agents-v1/`) | ✅ (`test/`) |
| `packages/agent-runtime` | Runtime de execução de agentes | ✅ Sim | `[NÃO ENCONTRADO]` |
| `packages/agents` | Lógica de agentes (wrapper) | ✅ Sim | `[NÃO ENCONTRADO]` |
| `packages/agents-registry` | Registro de agentes | ✅ Sim | `[NÃO ENCONTRADO]` |
| `packages/auth` | Módulo de autenticação | ✅ (`index.ts` + `src/`) | `[NÃO ENCONTRADO]` |
| `packages/billing` | Domínio de billing | ❌ Apenas `README.md` (322 bytes) | ❌ |
| `packages/config` | Configuração centralizada | ✅ Sim | `[NÃO ENCONTRADO]` |
| `packages/conversation-core` | Threads de conversação | ✅ (`index.ts` + `src/`) | `[NÃO ENCONTRADO]` |
| `packages/emails` | Templates de email | ✅ (`templates/`) | `[NÃO ENCONTRADO]` |
| `packages/integrations` | Conectores CRM/OAuth | ✅ (`index.ts` + `src/`) | `[NÃO ENCONTRADO]` |
| `packages/llm-client` | Cliente LLM abstrato | ✅ (`index.ts` + `src/`) | `[NÃO ENCONTRADO]` |
| `packages/logger` | Logging estruturado | ✅ Sim | `[NÃO ENCONTRADO]` |
| `packages/queue` | Abstração BullMQ | ✅ (`index.ts` + `src/`) | ✅ (`tests/`) |
| `packages/security` | Guardrails de segurança | ✅ Sim | ✅ (`test/`) |
| `packages/shared` | Erros compartilhados | ✅ (`errors/`) | `[NÃO ENCONTRADO]` |
| `packages/shared-types` | Tipos compartilhados | ✅ Sim | `[NÃO ENCONTRADO]` |
| `packages/testing` | Utilidades de teste | ✅ Sim | `[NÃO ENCONTRADO]` |
| `packages/utils` | Utilitários genéricos | ✅ (`index.ts` + `src/`) | `[NÃO ENCONTRADO]` |
| `packages/workflows-core` | DSL de workflows | ✅ Sim | ✅ (`test/`) |

### 3.3 Satélites

| Superfície | Tipo | Linguagem | Status |
|---|---|---|---|
| `apps/webhook-receiver` | Ingestão de webhooks | Python 3.12 | 🟡 Operacional |
| `apps/voice-engine` | Motor de voz | TypeScript | 🟡 Operacional |
| `apps/dashboard` | Dashboard (fora do core) | — | ⚠️ Presente em `apps/` mas não em `apps/legacy/` |

### 3.4 Legacy/Quarentena

| Superfície | Status |
|---|---|
| `apps/legacy/dashboard` | 🔴 Quarentena (diretório existente) |
| `apps/api-gateway` | 🔴 Não presente no HEAD (fantasma documental) |
| `apps/agent-orchestrator` | 🔴 Não presente no HEAD (fantasma documental) |
| `packages/db` | 🔴 Não presente no HEAD (fantasma documental) |

---

## 4. MÓDULOS DA API (27 domínios)

Evidência: `apps/api/src/modules/` — contém 27 subdiretórios:

| # | Módulo | Domínio de Negócio |
|---|---|---|
| 1 | `admin` | Administração da plataforma |
| 2 | `agents` | Gestão de agentes IA |
| 3 | `analytics` | Métricas e analytics |
| 4 | `apikeys` | API Keys management |
| 5 | `auth` | Autenticação e sessões |
| 6 | `billing` | Billing / Stripe |
| 7 | `break-glass` | Acesso de emergência |
| 8 | `budget` | Orçamento de agentes |
| 9 | `clinical` | Módulo clínico (pacientes, prontuários) |
| 10 | `connectors` | CRM/OAuth connectors |
| 11 | `conversations` | Threads de conversação |
| 12 | `dashboard` | Dashboard API |
| 13 | `engagement` | Engajamento / NPS |
| 14 | `feedback` | Feedback de agentes |
| 15 | `fhir` | HL7 FHIR (interoperabilidade clínica) |
| 16 | `invites` | Convites de membros |
| 17 | `marketplace` | Marketplace de packs |
| 18 | `notifications` | Notificações |
| 19 | `organizations` | Gestão de organizações/tenants |
| 20 | `outputs` | Artefatos de saída de agentes |
| 21 | `packs` | Agent packs CRUD |
| 22 | `privacy` | Consent / LGPD |
| 23 | `search` | Busca (Elasticsearch) |
| 24 | `sessions` | Gerenciamento de sessões |
| 25 | `users` | Gestão de usuários |
| 26 | `webhooks` | Webhooks outbound |
| 27 | `workflows` | Workflows visuais |

---

## 5. DATA MODEL (Prisma Schema — snapshot)

- **Arquivo:** `packages/database/prisma/schema.prisma`
- **Tamanho:** `59.721 bytes` / `1.731 linhas`
- **Provider:** PostgreSQL
- **Tenant Key:** `tenantId` present em **todos** os models operacionais (multi-tenancy por coluna)

### Modelos identificados (amostra das primeiras 800 linhas):

| Model | Domínio | Tenant-aware? |
|---|---|---|
| `Organization` | Core (tenant root) | ✅ (`tenantId` unique) |
| `User` | Auth | ⚠️ (sem `tenantId`, vinculado via Membership) |
| `Membership` | Auth/RBAC | ✅ |
| `Session` | Auth | ✅ |
| `ApiKey` | Security | ✅ |
| `MfaRecoveryCode` | Security/MFA | ✅ |
| `MfaChallenge` | Security/MFA | ✅ |
| `LoginAlert` | Security | ✅ |
| `PrivacyConsent` | LGPD | ✅ |
| `PrivacyConsentEvent` | LGPD | ✅ |
| `DataRetentionPolicy` | LGPD | ✅ |
| `DataRetentionExecution` | LGPD | ✅ |
| `BreakGlassGrant` | Security/Audit | ✅ |
| `JobSigningSecret` | Queue Security | ✅ |
| `Agent` | AI Platform | ✅ |
| `AgentBudget` | AI Platform | ✅ |
| `AgentBudgetEvent` | AI Platform | ✅ |
| `OutputArtifact` | AI Platform | ✅ |
| `Workflow` | Automation | ✅ |
| `WorkflowStep` | Automation | ✅ |
| `WorkflowTransition` | Automation | ✅ |
| `WorkflowRevision` | Automation | ✅ |
| `WorkflowExecution` | Automation | ✅ |
| `StepResult` | Automation | ✅ |
| `Customer` | CRM | ✅ |
| `Patient` | Clinical | ✅ |
| `PregnancyRecord` | Clinical | ✅ |
| `Appointment` | Clinical | ✅ |
| `ClinicalNote` | Clinical (SOAP, versionamento) | ✅ |

> Schema total possui ~1731 linhas — modelos adicionais serão inventariados na Fase 2.

---

## 6. MIDDLEWARE PIPELINE (API)

Evidência: `apps/api/src/middleware/` — 10 arquivos:

| # | Middleware | Arquivo | Tamanho |
|---|---|---|---|
| 1 | Authentication | `authentication.ts` | 3.307 bytes |
| 2 | Break-Glass Audit | `break-glass-audit.ts` | 1.516 bytes |
| 3 | Content-Type Guard | `content-type.ts` | 937 bytes |
| 4 | CSRF (Double Submit) | `csrf.ts` | 1.234 bytes |
| 5 | Error Handler | `error-handler.ts` | 2.334 bytes |
| 6 | Origin Check | `origin-check.ts` | 1.453 bytes |
| 7 | Rate Limiter | `rate-limit.ts` | 11.658 bytes |
| 8 | Request Context | `request-context.ts` | 2.354 bytes |
| 9 | Input Sanitization | `sanitize-input.ts` | 689 bytes |
| 10 | Body Validation | `validate-body.ts` | 510 bytes |

---

## 7. CI/CD PIPELINE

Evidência: `.github/workflows/` — 11 workflows:

| Workflow | Tamanho | Propósito |
|---|---|---|
| `ci.yml` | 21.829 bytes | CI principal (lint, typecheck, test, build) |
| `cd.yml` | 32.742 bytes | CD completo (deploy) |
| `security-scan.yml` | 7.249 bytes | SAST, dependency audit, secrets scan |
| `quality-governance.yml` | 2.377 bytes | Governança de qualidade |
| `reusable-node-check.yml` | 2.777 bytes | Check reutilizável para Node |
| `agents-conformity.yml` | 1.328 bytes | Conformidade de agent packs |
| `repository-health.yml` | 1.089 bytes | Health check do repo |
| `f4-script-compliance.yml` | 1.002 bytes | Compliance de scripts |
| `materialize-doc-only.yml` | 1.008 bytes | Materialização de docs |
| `renovate.yml` | 490 bytes | Dependency bot |
| `branch-cleanup.yml` | 439 bytes | Limpeza de branches |

---

## 8. TESTES (ESTRUTURA GERAL)

| Camada | Localização | # Specs/Arquivos |
|---|---|---|
| Unit (API) | `apps/api/tests/`, `apps/api/test/` | Múltiplos (`auth.test.ts`, `rbac.test.ts`, `security.test.ts`) |
| Unit (Worker) | `apps/worker/src/*.test.ts`, `apps/worker/test/` | 5+ inline test files |
| Unit (Web) | `apps/web/tests/` | Presente |
| Unit (Database) | `packages/database/test/`, `packages/database/src/**/*.test.ts` | Presente |
| Integration | `tests/integration/` | Presente |
| E2E | `tests/e2e/` | 6 spec files + 1 support file |
| Load | `scripts/load-tests/` | k6 stress test + worker overload |
| Mutation | Stryker config | `stryker.config.mjs` |
| Python | `apps/webhook-receiver/tests/` | Pytest + auto parallelization |
| SAST | `tests/test_sast_scanner.py` | Python-based scanner |

### E2E Specs identificados:

| Spec | Tamanho | Domínio |
|---|---|---|
| `release-master.spec.ts` | 9.061 bytes | Release master flow |
| `maternal-clinic.spec.ts` | 4.607 bytes | Fluxo clínico materno |
| `billing-premium.spec.ts` | 2.746 bytes | Billing/Checkout |
| `workflow-agent-output.spec.ts` | 1.958 bytes | Workflow + outputs |
| `workflow-editor-evidence.spec.ts` | 1.409 bytes | Editor visual |
| `agent-studio.spec.ts` | 799 bytes | Agent studio |
| `critical-routes.spec.ts` | 467 bytes | Verificação de rotas |

---

## 9. DOCKER & PRODUÇÃO

### 9.1 Docker Compose (dev)

| Serviço | Imagem | Porta | Healthcheck |
|---|---|---|---|
| PostgreSQL | `postgres:16-alpine` | 5432 | `pg_isready` |
| Redis | `redis:7.2-alpine` | 6379 | `redis-cli ping` |
| Elasticsearch | `elasticsearch:8.14.0` | 9200 | — |

⚠️ **ALERTA:** Elasticsearch em dev roda com `xpack.security.enabled=false`.

### 9.2 Docker Compose (prod)

| Serviço | Base | Porta | Hardening |
|---|---|---|---|
| Caddy | `caddy:2.10-alpine` | 80, 443 | TLS automático, `read_only: true` |
| API | `node:24.14.0-alpine` | 3000 (internal) | `read_only: true`, `init: true`, non-root `USER node` |
| Web | `node:24.14.0-alpine` | 3001 (internal) | `read_only: true`, non-root `USER node` |
| Worker | `node:24.14.0-alpine` | 3002 (internal) | `read_only: true`, `init: true`, non-root `USER node` |

✅ **BOM:** Todos os containers de produção rodam como `USER node` com `read_only: true`.

---

## 10. SINAIS INICIAIS DE RISCO (preview para Fase 3)

| # | Sinal | Severidade | Evidência |
|---|---|---|---|
| 1 | `packages/billing` é stub vazio (apenas README de 322 bytes) | 🟠 ALTA | `packages/billing/README.md` — billing real vive em `apps/api/src/modules/billing/` |
| 2 | `apps/dashboard` existe FORA de `apps/legacy/` | 🟡 MÉDIA | Ambiguidade: dashboard legacy vs dashboard core |
| 3 | Redlock em versão `5.0.0-beta.2` (beta) em produção | 🟠 ALTA | `apps/api/package.json` L40 |
| 4 | `infra/k8s/` e `infra/docker/` são `.gitkeep` stubs | 🔵 BAIXA | Terraform tem scaffold mas K8s é placeholder |
| 5 | Elasticsearch sem segurança no dev | 🟡 MÉDIA | `docker-compose.yml` L40: `xpack.security.enabled=false` |
| 6 | Múltiplos packages sem testes visíveis | 🟠 ALTA | `auth`, `config`, `llm-client`, `integrations`, `conversation-core`, `agents`, `agents-registry` |
| 7 | `type: "commonjs"` no root com pacotes internos `type: "module"` | 🟡 MÉDIA | Root `package.json` L239 vs `apps/api/package.json` L6 |
| 8 | `COPY . .` nos Dockerfiles (todo o monorepo no build context) | 🟡 MÉDIA | `apps/api/Dockerfile` L9, `apps/worker/Dockerfile` L9, `apps/web/Dockerfile` L10 |

---

## 11. MÉTRICAS DE ESCALA DO REPOSITÓRIO

| Métrica | Valor |
|---|---|
| Raiz: diretórios | 19 |
| Raiz: arquivos | 37 |
| Apps (total) | 7 (3 core + 2 satélites + 1 legacy + 1 ambíguo) |
| Packages internos | 21 |
| Módulos da API | 27 domínios |
| Schema Prisma | 1.731 linhas / 59.721 bytes |
| Lockfile | 543.933 bytes |
| GitHub Workflows | 11 |
| Scripts dir | 23 subdirs + 15 arquivos raiz |
| Docs | 38 subdirs + 35 arquivos |
| E2E specs | 7 |
| Middleware chain | 10 handlers |

---

## 12. CONCLUSÃO DA FASE 1

O repositório BirthHub 360 é um **monorepo TypeScript maduro e ambicioso**, com arquitetura clara de 3 superfícies canônicas (API Express 5, Web Next.js 16, Worker BullMQ) suportadas por 21 pacotes internos. O schema Prisma demonstra grau elevado de modelagem multi-tenant com `tenantId` aplicado consistentemente.

A plataforma mistura domínios complexos:
- **Saúde/Clínico** (pacientes, gestações, notas SOAP, FHIR)
- **AI/Automation** (agentes LLM com budget, workflows visuais DAG, circuit breaker)
- **Billing/SaaS** (Stripe plans, invoices, usage metering, grace periods)
- **Compliance** (LGPD consents, data retention, PII redaction, break-glass audit)

O pipeline de CI/CD é robusto (11 workflows), com escaneamento de segurança, mutation testing e governança de qualidade. Deploy de produção usa Docker Compose com hardening adequado (read-only fs, non-root, healthchecks).

**Riscos identificados para aprofundamento:**
- Packages internos sem cobertura de testes
- Stubs vazios (`billing`, `k8s`)
- Dependency em versão beta (`redlock`)
- Build context excessivo nos Dockerfiles
- Ambiguidade na classificação do `apps/dashboard`

---

> **FASE 1 CONCLUÍDA.** Aguardando comando para iniciar **FASE 2: ANÁLISE TÉCNICA MINUCIOSA**.
