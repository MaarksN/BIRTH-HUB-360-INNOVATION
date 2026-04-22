# Relatorio Executivo de Divida Tecnica

- Data da analise: 2026-04-02
- Escopo: core canonico (`apps/web`, `apps/api`, `apps/worker`, `packages/database`), documentacao operacional e gates de CI
- Metodo: leitura estrutural do monorepo, validacao de hotspots no codigo, revisao dos artefatos `artifacts/quality/*`, `artifacts/doctor/monorepo-doctor-report.md`, `docs/technical-debt/tracker.json` e `.github/workflows/ci.yml`

## Resumo executivo

O repositorio tem boa maturidade de governanca e higiene automatizada: o `monorepo:doctor` atual nao aponta findings criticos nem warnings. A divida tecnica relevante esta concentrada em contratos de API, deriva operacional do legado, duplicacao no front-end, hotspots de modulo com multiplas responsabilidades, fragilidade de tipos compartilhados e ausencia de gate de cobertura para TypeScript.

O tracker atual captura parte da situacao, mas sub-representa a divida observada no codigo. O maior risco de curto prazo esta na diferenca entre a superficie real da API e a documentacao OpenAPI publicada. Em seguida aparecem o custo operacional de referencias legadas ainda espalhadas pela documentacao e o custo de manutencao do front-end, hoje bastante duplicado em paginas administrativas.

## Achados priorizados

| Prioridade | Tema | Evidencia objetiva | Impacto |
| --- | --- | --- | --- |
| P1 | Contrato de API parcial | `apps/api/src/docs/openapi.ts` publica apenas 3 paths, enquanto `apps/api/src/app/module-routes.ts` monta 22 routers; o item `TD-005` ja permanece aberto no tracker | Integracoes externas, QA e onboarding consomem uma visao incompleta da API real |
| P1 | Deriva operacional do legado | Ha 132 referencias a `apps/api-gateway`, `apps/agent-orchestrator`, `packages/db` e `apps/legacy/dashboard` em `docs/`, `README.md` e `package.json`; `docs/runbooks/db-backup-restore.md` ainda instrui uso de `packages/db`; `docs/slo.md` ainda define SLO para `api-gateway` e `agent-orchestrator` | Runbook incorreto em incidente, onboarding confuso e custo continuo de manter superficies em sunset como se fossem ativas |
| P2 | Duplicacao alta no front-end | `artifacts/quality/jscpd/jscpd-report.json` aponta `apps/web/components/agents/PolicyManager.tsx` com 87.5% de duplicacao, `apps/web/app/(dashboard)/settings/users/page.tsx` com 137.5%, `apps/web/app/(dashboard)/settings/team/page.tsx` com 135.29%, `apps/web/components/agents/agent-detail-tabs.tsx` com 54.84% e `apps/web/app/(dashboard)/workflows/[id]/runs/page.tsx` com 45.88% | Correcao de bug lenta, inconsistencia visual/comportamental e maior chance de regressao por alteracoes manuais em paralelo |
| P2 | Hotspots com responsabilidades misturadas | `apps/api/src/modules/connectors/router.ts` concentra validacao, parsing, auth context, callback GET/POST e sync em 327 linhas; `apps/web/app/(dashboard)/workflows/[id]/runs/page.tsx` mistura fetch, agregacao de metricas, decoracao de grafo, retry e debugger visual em um unico componente | Testabilidade menor, onboarding mais caro e tendencia a novos acoplamentos |
| P2 | Tipos compartilhados fracos | `packages/shared-types/src/index.ts` contem 17 ocorrencias de `any` em entidades centrais (`Lead`, `Deal`, `Activity`, `Customer`, `Contract`, `AgentLog`) | Perde-se seguranca entre pacotes, aumenta o risco de divergencia entre schema, API e front-end |
| P2 | Gate de cobertura incompleto para TypeScript | `package.json` define testes, mas nao ha threshold de cobertura para TS/JS; o unico piso explicito encontrado e `test:python:coverage` com `--cov-fail-under=80`; `.github/workflows/ci.yml` executa `lint`, `typecheck`, `test`, `test:isolation` e `build`, sem etapa dedicada a cobertura TS | Areas criticas podem ficar sem protecao quantitativa sem quebrar o CI |
| P3 | Sinal de metricas de qualidade com ruído | `artifacts/quality/complexity/cyclomatic-baseline.md` ainda inclui apps ausentes do `HEAD` e arquivos gerados como `packages/agents-core/docs/assets/main.js` entre hotspots | Priorizacao de refatoracao perde qualidade porque o ranking mistura codigo fonte com artefatos gerados e superficies ja descontinuadas |

## Evidencias-chave

### 1. OpenAPI abaixo da superficie real

- `apps/api/src/docs/openapi.ts`: 3 endpoints publicados
- `apps/api/src/app/module-routes.ts`: 22 montagens de router
- `docs/technical-debt/tracker.json`: `TD-005` aberto com risco residual `high`

### 2. Drift legado ainda ativo

- `README.md`: define `apps/api-gateway`, `apps/agent-orchestrator` e `packages/db` como legado/quarentena
- `package.json`: mantem `dev:legacy`, `stack:hybrid`, `ci:legacy-db-surface-freeze` e `ci:legacy-runtime-surface-freeze`
- `docs/runbooks/db-backup-restore.md`: ainda orienta `./packages/db/scripts/backup.sh` e `restore.sh`
- `docs/slo.md`: mantem SLOs para `api-gateway` e `agent-orchestrator`
- `docs/service-catalog.md`: afirma que essas superficies nao estao presentes no `HEAD` atual

### 3. Front-end com custo alto de manutencao

- `apps/web/components/agents/PolicyManager.tsx`: repeticao de blocos de card, handlers e estados de erro
- `apps/web/app/(dashboard)/settings/users/page.tsx` e `apps/web/app/(dashboard)/settings/team/page.tsx`: tabelas administrativas muito parecidas, com variacao pequena de regras
- `apps/web/app/(dashboard)/workflows/[id]/runs/page.tsx`: componente unico com varias responsabilidades e muito estilo inline

### 4. Contratos internos frouxos

- `packages/shared-types/src/index.ts`: varios campos JSON expostos como `any`
- Isso reduz o valor do compilador exatamente onde o monorepo mais depende de contratos entre pacotes

## Leitura de risco

- Alto: contrato incompleto da API e documentacao operacional ainda ancorada no legado
- Medio: duplicacao de UI, hotspots de modulo e tipos fracos
- Baixo a medio: gates de cobertura TS ausentes e metricas de complexidade com ruido

## Recomendacao de ataque

### Sprint 1

1. Expandir o OpenAPI para cobrir os routers montados em `apps/api/src/app/module-routes.ts`
2. Limpar documentacao operacional que ainda aponta para `packages/db`, `api-gateway` e `agent-orchestrator`
3. Reabrir ou complementar o tracker com os eixos de duplicacao de front-end, type-safety e coverage gate

### Sprint 2

1. Extrair hooks e componentes compartilhados das telas administrativas de `apps/web`
2. Quebrar `connectors/router.ts` em handlers por caso de uso
3. Separar em `WorkflowRunsPage` a camada de fetch, calculo de metricas e renderer visual

### Sprint 3

1. Substituir `any` em `packages/shared-types` por tipos estruturados ou `JsonValue` controlado
2. Adicionar cobertura minima para pacotes TS criticos no CI
3. Ajustar os artefatos de qualidade para ignorar arquivos gerados e superficies ausentes do `HEAD`

## Conclusao

O repositorio esta bem controlado em governanca, mas ainda carrega debitos importantes na camada de contratos, manutencao de UI e consolidacao do sunset legado. O melhor retorno imediato vem de alinhar a documentacao da API com a superficie real, remover referencias operacionais legadas e atacar os hotspots de duplicacao no `apps/web`.
# Relatório Executivo Mensal de Saúde Técnica

## Resumo e Matriz de Dívida (Debt Matrix)
- **Domínio Crítico:** Billing e RLS Authentication (Fechado).
- **Risco Residual:** Baixo, devido a migrations idempotentes e RLS no banco PostgreSQL (ver `12 CICLOS/F8.html`).
- **Agents:** Alto acoplamento em testes foi atenuado. Necessidade de maior cobertura em integração real vs LLMs (Risco Médio).
- **Performance:** PgBouncer configurado nas guidelines.

## Debt-to-Feature Ratio
- **Sprint Atual**: 30% Feature, 70% Debt (Foco total nos "12 Ciclos" / Remediação Forense).
- **Alvo Próxima Sprint**: 70% Feature, 30% Debt.

## Velocidade de Encerramento (Burn Rate)
A dívida histórica do monorepo tem sido agressivamente resolvida pelas execuções em série de `Codex` e `Jules` (F1 até F11). 100% dos pacotes agora possuem scripts padronizados (lint, typecheck, test, build).
