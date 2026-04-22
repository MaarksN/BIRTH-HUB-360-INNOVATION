# Top 15 VDI Backlog

- Generated at: 2026-04-06T14:13:45.848Z
- Source report: `audit\auditor-prime-2026-04-06.json`

## Sprint 1 — Segurança + multi-tenancy

| Item | Owner | Esforço | Dependências | Critério de aceite |
| --- | --- | --- | --- | --- |
| TD-089 Ausência de superfícies explícitas de interoperabilidade clínica padrão (`packages/integrations/src/clients/http.ts`) | @platform-architecture | 1-2 semanas | nenhuma | Capacidade operacional/multi-tenant materializada com evidência versionada, critério técnico validado e item rebaixado/removido na próxima auditoria. |
| TD-090 Drill de disaster recovery não registrado no ciclo atual (`artifacts/dr/latest-drill.json`) | @platform-architecture | 0.5-2 dias | nenhuma | Capacidade operacional/multi-tenant materializada com evidência versionada, critério técnico validado e item rebaixado/removido na próxima auditoria. |
| TD-029 Semgrep WARNING em cd.yml (`.github/workflows/cd.yml`) | @platform-security | 0.5-2 dias | nenhuma | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-030 Semgrep WARNING em cd.yml (`.github/workflows/cd.yml`) | @platform-security | 0.5-2 dias | TD-029 | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-031 Semgrep WARNING em prisma-schema.ts (`packages/database/scripts/lib/prisma-schema.ts`) | @platform-data | 0.5-2 dias | TD-029 | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-032 Semgrep WARNING em runtime.shared.ts (`apps/worker/src/agents/runtime.shared.ts`) | @platform-automation | 0.5-2 dias | TD-029 | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-033 Semgrep WARNING em worker.job-validation.test.ts (`apps/worker/src/worker.job-validation.test.ts`) | @platform-automation | 0.5-2 dias | TD-029 | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |

## Sprint 2 — Qualidade + observabilidade

| Item | Owner | Esforço | Dependências | Critério de aceite |
| --- | --- | --- | --- | --- |
| TD-015 Uso recorrente de any em index.ts (`packages/shared-types/src/index.ts`) | @platform-architecture | 2-5 dias | nenhuma | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |

## Sprint 3 — Performance + UX técnica

| Item | Owner | Esforço | Dependências | Critério de aceite |
| --- | --- | --- | --- | --- |
| TD-001 Complexidade acima do limiar em <anonymous> (`apps/web/stores/notification-store.ts`) | @product-frontend | 2-5 dias | nenhuma | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-002 Complexidade acima do limiar em DeveloperWebhooksPage (`apps/web/app/(dashboard)/settings/developers/webhooks/page.tsx`) | @product-frontend | 2-5 dias | TD-001 | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-003 Complexidade acima do limiar em executeStep (`packages/workflows-core/src/nodes/executeStep.ts`) | @platform-architecture | 2-5 dias | TD-001 | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-004 Complexidade acima do limiar em FeedbackWidget (`apps/web/components/agents/FeedbackWidget.tsx`) | @product-frontend | 2-5 dias | TD-001 | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-005 Complexidade acima do limiar em main (`packages/database/scripts/check-migration-governance.ts`) | @platform-data | 2-5 dias | TD-001 | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-006 Complexidade acima do limiar em WorkflowRunsPage (`apps/web/app/(dashboard)/workflows/[id]/runs/page.tsx`) | @product-frontend | 2-5 dias | TD-001 | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-007 Complexidade acima do limiar em ensureConversationThread (`apps/worker/src/agents/conversations.ts`) | @platform-automation | 1-3 dias | TD-001 | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |

## Sprint 4 — Inovação somente após estabilização do core

- Gate: Iniciar inovação apenas depois que os critérios de aceite dos sprints 1-3 estiverem fechados e os itens VDI 4.0+ tiverem sido eliminados ou rebaixados.

- Sem itens de dívida adicionais alocados neste sprint.

