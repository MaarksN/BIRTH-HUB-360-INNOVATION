# Top 15 VDI Backlog

- Generated at: 2026-04-06T02:11:19.046Z
- Source report: `audit\auditor-prime-2026-04-05.json`

## Sprint 1 — Segurança + multi-tenancy

| Item | Owner | Esforço | Dependências | Critério de aceite |
| --- | --- | --- | --- | --- |
| TD-089 Prova runtime de RLS por tenant ainda não fecha no runner soberano (`artifacts/tenancy/rls-proof-head.json`) | @platform-architecture | 1-3 dias | nenhuma | Prova de isolamento atualizada em `artifacts/tenancy/rls-proof-head.json`, controles de tenancy verificados e item rebaixado/removido na próxima auditoria. |
| TD-090 Ausência de superfícies explícitas de interoperabilidade clínica padrão (`packages/integrations/src/clients/http.ts`) | @platform-architecture | 1-2 semanas | nenhuma | Capacidade operacional/multi-tenant materializada com evidência versionada, critério técnico validado e item rebaixado/removido na próxima auditoria. |

## Sprint 2 — Qualidade + observabilidade

- Sem itens de dívida adicionais alocados neste sprint.

## Sprint 3 — Performance + UX técnica

| Item | Owner | Esforço | Dependências | Critério de aceite |
| --- | --- | --- | --- | --- |
| TD-001 Complexidade acima do limiar em registerAuthRoutes (`apps/api/src/app/auth-routes.ts`) | @platform-api | 2-5 dias | nenhuma | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-002 Arquivo grande demais para o boundary atual (473 linhas) (`apps/api/src/modules/billing/service.checkout.ts`) | @platform-api | 2-5 dias | TD-001 | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-054 Consulta findMany sem paginação explícita (`apps/api/src/modules/analytics/reporting.service.ts`) | @platform-api | 0.5-2 dias | nenhuma | Hotspot segmentado sem regressão funcional, com baseline atualizada e critério de experiência/performance validado. |
| TD-055 Consulta findMany sem paginação explícita (`apps/api/src/modules/analytics/reporting.service.ts`) | @platform-api | 0.5-2 dias | TD-054 | Hotspot segmentado sem regressão funcional, com baseline atualizada e critério de experiência/performance validado. |
| TD-056 Consulta findMany sem paginação explícita (`apps/api/src/modules/analytics/usage.service.ts`) | @platform-api | 0.5-2 dias | TD-054 | Hotspot segmentado sem regressão funcional, com baseline atualizada e critério de experiência/performance validado. |
| TD-057 Consulta findMany sem paginação explícita (`apps/api/src/modules/analytics/usage.service.ts`) | @platform-api | 0.5-2 dias | TD-054 | Hotspot segmentado sem regressão funcional, com baseline atualizada e critério de experiência/performance validado. |
| TD-058 Consulta findMany sem paginação explícita (`apps/api/src/modules/analytics/usage.service.ts`) | @platform-api | 0.5-2 dias | TD-054 | Hotspot segmentado sem regressão funcional, com baseline atualizada e critério de experiência/performance validado. |
| TD-003 Complexidade acima do limiar em <anonymous> (`apps/worker/src/worker.process-job.ts`) | @platform-automation | 2-5 dias | TD-001 | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-004 Complexidade acima do limiar em createConnectorsRouter (`apps/api/src/modules/connectors/router.ts`) | @platform-api | 2-5 dias | TD-001 | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-005 Complexidade acima do limiar em createJobProcessor (`apps/worker/src/worker.process-job.ts`) | @platform-automation | 2-5 dias | TD-001 | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-006 Complexidade acima do limiar em DeveloperWebhooksPage (`apps/web/app/(dashboard)/settings/developers/webhooks/page.tsx`) | @product-frontend | 2-5 dias | TD-001 | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-007 Complexidade acima do limiar em executeStep (`packages/workflows-core/src/nodes/executeStep.ts`) | @platform-architecture | 2-5 dias | TD-001 | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-008 Complexidade acima do limiar em WorkflowRunsPage (`apps/web/app/(dashboard)/workflows/[id]/runs/page.tsx`) | @product-frontend | 2-5 dias | TD-001 | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |

## Sprint 4 — Inovação somente após estabilização do core

- Gate: Iniciar inovação apenas depois que os critérios de aceite dos sprints 1-3 estiverem fechados e os itens VDI 4.0+ tiverem sido eliminados ou rebaixados.

- Sem itens de dívida adicionais alocados neste sprint.

