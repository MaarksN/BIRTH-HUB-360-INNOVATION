# Top 15 VDI Backlog

- Generated at: 2026-04-09T01:16:04.625Z
- Source report: `audit\auditor-prime-2026-04-08.json`

## Sprint 1 — Segurança + multi-tenancy

| Item | Owner | Esforço | Dependências | Critério de aceite |
| --- | --- | --- | --- | --- |
| TD-089 Drill de disaster recovery não registrado no ciclo atual (`artifacts/dr/latest-drill.json`) | @platform-architecture | 0.5-2 dias | nenhuma | Capacidade operacional/multi-tenant materializada com evidência versionada, critério técnico validado e item rebaixado/removido na próxima auditoria. |

## Sprint 2 — Qualidade + observabilidade

| Item | Owner | Esforço | Dependências | Critério de aceite |
| --- | --- | --- | --- | --- |
| TD-015 Uso recorrente de any em index.ts (`packages/shared-types/src/index.ts`) | @platform-architecture | 2-5 dias | nenhuma | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |

## Sprint 3 — Performance + UX técnica

| Item | Owner | Esforço | Dependências | Critério de aceite |
| --- | --- | --- | --- | --- |
| TD-054 Consulta findMany sem paginação explícita (`apps/api/src/modules/clinical/service.ts`) | @platform-api | 0.5-2 dias | nenhuma | Hotspot segmentado sem regressão funcional, com baseline atualizada e critério de experiência/performance validado. |
| TD-055 Consulta findMany sem paginação explícita (`apps/api/src/modules/clinical/service.ts`) | @platform-api | 0.5-2 dias | TD-054 | Hotspot segmentado sem regressão funcional, com baseline atualizada e critério de experiência/performance validado. |
| TD-001 Complexidade acima do limiar em ConversationsPage (`apps/web/app/(dashboard)/conversations/page.tsx`) | @product-frontend | 2-5 dias | nenhuma | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-002 Complexidade acima do limiar em deriveClinicalAlerts (`apps/api/src/modules/clinical/service.ts`) | @platform-api | 2-5 dias | TD-001 | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-003 Complexidade acima do limiar em Navbar (`apps/web/components/layout/Navbar.tsx`) | @product-frontend | 2-5 dias | TD-001 | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-004 Complexidade acima do limiar em PatientDetailPage (`apps/web/app/(dashboard)/patients/[id]/page.tsx`) | @product-frontend | 2-5 dias | TD-001 | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-005 Complexidade acima do limiar em PatientsPage (`apps/web/app/(dashboard)/patients/page.tsx`) | @product-frontend | 2-5 dias | TD-001 | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-006 Complexidade acima do limiar em updateUserPreference (`packages/database/src/repositories/engagement.ts`) | @platform-data | 2-5 dias | TD-001 | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-007 Complexidade acima do limiar em WorkflowRevisionsPage (`apps/web/app/(dashboard)/workflows/[id]/revisions/page.tsx`) | @product-frontend | 2-5 dias | TD-001 | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-008 Complexidade acima do limiar em WorkflowRunsPage (`apps/web/app/(dashboard)/workflows/[id]/runs/page.tsx`) | @product-frontend | 2-5 dias | TD-001 | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-056 Await serial em loop de runtime (`apps/api/src/modules/billing/sync-plans.ts`) | @platform-api | 1-3 dias | nenhuma | Hotspot segmentado sem regressão funcional, com baseline atualizada e critério de experiência/performance validado. |
| TD-057 Await serial em loop de runtime (`apps/api/src/modules/packs/pack-installer.service.ts`) | @platform-api | 1-3 dias | TD-056 | Hotspot segmentado sem regressão funcional, com baseline atualizada e critério de experiência/performance validado. |
| TD-058 Await serial em loop de runtime (`apps/api/src/modules/packs/pack-installer.service.ts`) | @platform-api | 1-3 dias | TD-056 | Hotspot segmentado sem regressão funcional, com baseline atualizada e critério de experiência/performance validado. |

## Sprint 4 — Inovação somente após estabilização do core

- Gate: Iniciar inovação apenas depois que os critérios de aceite dos sprints 1-3 estiverem fechados e os itens VDI 4.0+ tiverem sido eliminados ou rebaixados.

- Sem itens de dívida adicionais alocados neste sprint.

