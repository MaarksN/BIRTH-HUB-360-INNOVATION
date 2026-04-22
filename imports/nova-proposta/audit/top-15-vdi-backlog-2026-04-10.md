# Top 15 VDI Backlog

- Generated at: 2026-04-10T13:37:52.674Z
- Source report: `audit\auditor-prime-2026-04-10.json`

## Sprint 1 — Segurança + multi-tenancy

| Item | Owner | Esforço | Dependências | Critério de aceite |
| --- | --- | --- | --- | --- |
| TD-089 Drill de disaster recovery não registrado no ciclo atual (`artifacts/dr/latest-drill.json`) | @platform-architecture | 0.5-2 dias | nenhuma | Capacidade operacional/multi-tenant materializada com evidência versionada, critério técnico validado e item rebaixado/removido na próxima auditoria. |

## Sprint 2 — Qualidade + observabilidade

| Item | Owner | Esforço | Dependências | Critério de aceite |
| --- | --- | --- | --- | --- |
| TD-042 Observabilidade inconsistente por uso de console em runtime (`packages/agents/executivos/boardprep-ai/agent.ts`) | @platform-observability | 0.5-1 dia | TD-026 | Evidência fresca anexada ao pipeline soberano, com referência versionada e consumo automático pelo `audit:prime`. |
| TD-043 Observabilidade inconsistente por uso de console em runtime (`packages/agents/executivos/brand-guardian/agent.ts`) | @platform-observability | 0.5-1 dia | TD-026 | Evidência fresca anexada ao pipeline soberano, com referência versionada e consumo automático pelo `audit:prime`. |

## Sprint 3 — Performance + UX técnica

| Item | Owner | Esforço | Dependências | Critério de aceite |
| --- | --- | --- | --- | --- |
| TD-001 Complexidade acima do limiar em ConversationsPage (`apps/web/app/(dashboard)/conversations/page.tsx`) | @product-frontend | 2-5 dias | nenhuma | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-002 Complexidade acima do limiar em DashboardHomePage (`apps/web/app/(dashboard)/dashboard/page.tsx`) | @product-frontend | 2-5 dias | TD-001 | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-003 Complexidade acima do limiar em GlobalSearch (`apps/web/components/layout/GlobalSearch.tsx`) | @product-frontend | 2-5 dias | TD-001 | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-004 Complexidade acima do limiar em main (`packages/database/scripts/check-migration-governance.ts`) | @platform-data | 2-5 dias | TD-001 | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-005 Complexidade acima do limiar em Navbar (`apps/web/components/layout/Navbar.tsx`) | @product-frontend | 2-5 dias | TD-001 | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-006 Complexidade acima do limiar em PatientDetailPage (`apps/web/app/(dashboard)/patients/[id]/page.tsx`) | @product-frontend | 2-5 dias | TD-001 | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-007 Complexidade acima do limiar em PatientsPage (`apps/web/app/(dashboard)/patients/page.tsx`) | @product-frontend | 2-5 dias | TD-001 | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-008 Complexidade acima do limiar em SalesOsShell (`apps/web/components/sales-os/SalesOsShell.tsx`) | @product-frontend | 2-5 dias | TD-001 | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-054 Await serial em loop de runtime (`apps/api/src/modules/privacy/retention.service.ts`) | @platform-api | 1-3 dias | nenhuma | Hotspot segmentado sem regressão funcional, com baseline atualizada e critério de experiência/performance validado. |
| TD-055 Await serial em loop de runtime (`apps/api/src/modules/privacy/retention.service.ts`) | @platform-api | 1-3 dias | TD-054 | Hotspot segmentado sem regressão funcional, com baseline atualizada e critério de experiência/performance validado. |
| TD-056 Await serial em loop de runtime (`apps/api/src/modules/webhooks/eventBus.ts`) | @platform-api | 1-3 dias | TD-054 | Hotspot segmentado sem regressão funcional, com baseline atualizada e critério de experiência/performance validado. |
| TD-057 Await serial em loop de runtime (`apps/api/src/modules/workflows/service.ts`) | @platform-api | 1-3 dias | TD-054 | Hotspot segmentado sem regressão funcional, com baseline atualizada e critério de experiência/performance validado. |

## Sprint 4 — Inovação somente após estabilização do core

- Gate: Iniciar inovação apenas depois que os critérios de aceite dos sprints 1-3 estiverem fechados e os itens VDI 4.0+ tiverem sido eliminados ou rebaixados.

- Sem itens de dívida adicionais alocados neste sprint.

