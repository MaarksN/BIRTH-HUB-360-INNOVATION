# Top 15 VDI Backlog

- Generated at: 2026-04-09T17:25:56.407Z
- Source report: `audit\auditor-prime-2026-04-09.json`

## Sprint 1 — Segurança + multi-tenancy

| Item | Owner | Esforço | Dependências | Critério de aceite |
| --- | --- | --- | --- | --- |
| TD-029 Uso de raw query insegura no acesso a dados (`apps/worker/src/agents/runtime.tools.ts`) | @platform-automation | 1-3 dias | nenhuma | Nenhum uso inseguro remanescente no escopo do item; validação direcionada executada; auditor-prime rerodado sem reincidência do achado. |
| TD-030 Chamada externa sem timeout ou abort path explícito (`apps/web/lib/sales-os/engine.ts`) | @product-frontend | 0.5-2 dias | nenhuma | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-031 Configuração sensível dispersa em módulo crítico (`packages/agents-core/src/tools/__mocks__/connectors.mock.ts`) | @platform-security | 0.5-2 dias | TD-015 | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-032 Configuração sensível dispersa em módulo crítico (`packages/auth/index.ts`) | @platform-security | 0.5-2 dias | TD-015 | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-089 Drill de disaster recovery não registrado no ciclo atual (`artifacts/dr/latest-drill.json`) | @platform-architecture | 0.5-2 dias | nenhuma | Capacidade operacional/multi-tenant materializada com evidência versionada, critério técnico validado e item rebaixado/removido na próxima auditoria. |

## Sprint 2 — Qualidade + observabilidade

- Sem itens de dívida adicionais alocados neste sprint.

## Sprint 3 — Performance + UX técnica

| Item | Owner | Esforço | Dependências | Critério de aceite |
| --- | --- | --- | --- | --- |
| TD-054 Consulta findMany sem paginação explícita (`apps/api/src/modules/workflows/service.ts`) | @platform-api | 0.5-2 dias | nenhuma | Hotspot segmentado sem regressão funcional, com baseline atualizada e critério de experiência/performance validado. |
| TD-055 Consulta findMany sem paginação explícita (`apps/api/src/modules/workflows/service.ts`) | @platform-api | 0.5-2 dias | TD-054 | Hotspot segmentado sem regressão funcional, com baseline atualizada e critério de experiência/performance validado. |
| TD-056 Consulta findMany sem paginação explícita (`apps/api/src/modules/workflows/service.ts`) | @platform-api | 0.5-2 dias | TD-054 | Hotspot segmentado sem regressão funcional, com baseline atualizada e critério de experiência/performance validado. |
| TD-057 Consulta findMany sem paginação explícita (`apps/api/src/modules/workflows/service.ts`) | @platform-api | 0.5-2 dias | TD-054 | Hotspot segmentado sem regressão funcional, com baseline atualizada e critério de experiência/performance validado. |
| TD-001 Complexidade acima do limiar em DashboardHomePage (`apps/web/app/(dashboard)/dashboard/page.tsx`) | @product-frontend | 2-5 dias | nenhuma | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-002 Complexidade acima do limiar em GlobalSearch (`apps/web/components/layout/GlobalSearch.tsx`) | @product-frontend | 2-5 dias | TD-001 | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-003 Complexidade acima do limiar em main (`packages/database/scripts/check-migration-governance.ts`) | @platform-data | 2-5 dias | TD-001 | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-004 Complexidade acima do limiar em Navbar (`apps/web/components/layout/Navbar.tsx`) | @product-frontend | 2-5 dias | TD-001 | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-005 Complexidade acima do limiar em SalesOsShell (`apps/web/components/sales-os/SalesOsShell.tsx`) | @product-frontend | 2-5 dias | TD-001 | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |
| TD-006 Complexidade acima do limiar em usePatientDetailModel (`apps/web/app/(dashboard)/patients/[id]/page.tsx`) | @product-frontend | 2-5 dias | TD-001 | Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo. |

## Sprint 4 — Inovação somente após estabilização do core

- Gate: Iniciar inovação apenas depois que os critérios de aceite dos sprints 1-3 estiverem fechados e os itens VDI 4.0+ tiverem sido eliminados ou rebaixados.

- Sem itens de dívida adicionais alocados neste sprint.

