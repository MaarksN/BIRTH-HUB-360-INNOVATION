# Fase 0 — Diagnóstico Operacional e Baseline

## Objetivo do ciclo
Reconciliar o baseline da Fase 0 com o worktree atual de 2026-04-07, distinguindo bloqueios já fechados no core canônico dos riscos que continuam abertos para governança, segurança operacional e evidência de release.

## Itens do relatório atacados
- [x] `TD-001` do relatório master: refresh token store em memória
- [x] `TD-002` do relatório master: prova de isolamento/RLS
- [x] `TD-003` do relatório master: schema drift check
- [x] `TD-004` a `TD-008`: auditados com tratamento explícito de ambiguidade de catálogo
- [x] `TD-018`, `TD-020`, `TD-021`, `TD-022`, `TD-024`
- [x] `TD-031`, `TD-032`, `TD-033`, `TD-035`, `TD-037`, `TD-038`

## Leitura do estado atual
- O monorepo continua real e operacional, com `apps/web`, `apps/api`, `apps/worker` e `packages/database` como core canônico segundo `docs/service-catalog.md`.
- O frontend principal em `apps/web` agora comprova navegação canônica para `/dashboard` e `/workflows`, além de superfícies clínicas para `/patients` e `/appointments`.
- `apps/web/app/page.tsx` redireciona para `/dashboard` quando há sessão local e para `/login` quando não há.
- A API mantém superfícies reais para workflows, dashboard, sessões e também para o domínio clínico em `/patients`, `/appointments` e `/clinical-notes`.
- O schema Prisma materializa tanto o domínio operacional quanto o domínio clínico materno-infantil (`Patient`, `PregnancyRecord`, `Appointment`, `ClinicalNote`, `NeonatalRecord`).
- A lacuna anterior de RLS em `workflow_revisions` foi fechada e a prova runtime atual de tenant isolation está suficiente.
- A autenticação do runtime canônico da API é persistida em banco via `prisma.session`, com hash de access token e refresh token; o `Map` em `packages/auth` permanece como dívida localizada de pacote, sem evidência de wiring no core.
- Segurança, LGPD e postura PT-BR continuam presentes; a maior abertura remanescente está em governança de dívida, endurecimento de CD e evidência de segurança menos condicional.

## Decisões arquiteturais
- Tratar `docs/service-catalog.md` como fonte canônica de fronteiras operacionais.
- Tratar o runtime canônico apenas por `apps/web`, `apps/api`, `apps/worker` e `packages/database`; código isolado fora desse fluxo não fecha finding de produção por si só.
- Reclassificar `TD-001` do relatório master como:
  - refutado no runtime principal
  - confirmado apenas como dívida localizada em `packages/auth`
- Reclassificar `TD-002` do relatório master como refutado no worktree atual, porque a prova estática e runtime agora fecha com `sufficient: true`.
- Manter dois catálogos de dívida até renumeração formal:
  - bloqueadores históricos/go-live: `audit/RELATORIO_DIVIDA_TECNICA_MASTER.md`
  - backlog estrutural atual: `audit/.auditor-prime/2026-04-07/03-scored-report.json`
- Mover o status global de `RED` para `YELLOW`, porque os bloqueios de tenancy, navegação canônica e auth durável no core já não sustentam mais um baseline vermelho.

Alternativas descartadas:
- Continuar tratando ausência de dashboard home e workflow list como fato atual.
- Continuar tratando ausência de domínio clínico como fato atual.
- Continuar tratando `packages/auth/index.ts` como prova suficiente de falha do runtime principal sem evidência de dependência ou import no core.

Justificativa:
- Essas três leituras ficaram desatualizadas em relação ao estado atual do repositório e distorciam a priorização do próximo ciclo.

## Plano executável
- Passo 1: congelar o baseline reconciliado da Fase 0 com status `YELLOW`.
- Passo 2: abrir ciclo de governança para tabela oficial de mapeamento entre relatório master e auditor-prime.
- Passo 3: abrir ciclo de segurança de release para endurecer `cd.yml`, reduzir condicionalidade de DAST e publicar evidência fresca do ciclo.
- Passo 4: abrir ciclo de limpeza arquitetural para remover, deprecar ou reimplementar `packages/auth` de forma coerente com a estratégia DB-backed do runtime.
- Passo 5: abrir ciclo de consolidação clínica para validar ponta a ponta schema, API, UI e testes das superfícies de pacientes, consultas, gestação e notas clínicas.

## Arquivos impactados
- criar:
  - nenhum
- alterar:
  - `docs/F0/diagnostico-operacional-baseline-2026-04-07.md`
- remover:
  - nenhum

## Checklist de implementação
- [ ] migrations
- [ ] rotas
- [ ] serviços
- [ ] validações
- [ ] UI
- [ ] loading/error/empty
- [ ] testes
- [x] docs

## A. Leitura do estado atual

### 1. Estrutura real do monorepo

| Área | Estado observado | Evidência |
|---|---|---|
| `apps/` | existe com `api`, `dashboard`, `legacy`, `voice-engine`, `web`, `webhook-receiver`, `worker` | árvore real do repositório |
| `packages/` | existe com `auth`, `database`, `integrations`, `llm-client`, `workflows-core` e outros | `package.json`, `pnpm-workspace.yaml` |
| `infra/` | existe com `cloudrun`, `docker`, `k8s`, `monitoring`, `terraform` | árvore real do repositório |
| `docs/` | existe com áreas operacionais, arquitetura, release, security, workflows e `F0` | árvore real do repositório |
| `apps/legacy/dashboard` | ainda presente | `docs/service-catalog.md`, diretório `apps/legacy/dashboard` |
| `apps/dashboard` | segue sem papel de app principal de runtime | `apps/dashboard/lib/*` |

### 2. Rotas reais do frontend

Superfícies canônicas confirmadas em `apps/web/app`:
- `/dashboard`
- `/workflows`
- `/patients`
- `/patients/[id]`
- `/appointments`
- `/reports`
- `/analytics`
- `/notifications`
- `/settings/privacy`
- `/settings/security`
- `/settings/team`
- `/settings/users`
- `/workflows/[id]/edit`
- `/workflows/[id]/revisions`
- `/workflows/[id]/runs`

Comportamento de entrada confirmado:
- `apps/web/app/page.tsx` redireciona para `/dashboard` quando existe sessão persistida no cliente.
- `apps/web/app/page.tsx` redireciona para `/login` quando não existe sessão.

Leitura operacional:
- A ausência anterior de dashboard home no frontend principal está refutada.
- A ausência anterior de workflow list canônica no frontend principal está refutada.
- O frontend principal já expõe também superfícies clínicas iniciais, o que refuta a tese de “produto apenas operacional/SaaS” em termos absolutos.

### 3. Rotas reais da API

Mounts principais confirmados em `apps/api/src/app/module-routes.ts`:
- `/api/v1/auth`
- `/api/v1/apikeys`
- `/api/v1/agents`
- `/api/v1/analytics`
- `/api/v1/dashboard`
- `/api/v1/connectors`
- `/api/v1/marketplace`
- `/api/v1/billing`
- `/api/v1/budgets`
- `/api/v1/packs`
- `/api/v1/outputs`
- `/api/v1/privacy`
- `/api/v1/workflows`
- `/api/v1/patients`
- `/api/v1/appointments`
- `/api/v1/clinical-notes`

Rotas clínicas confirmadas em `apps/api/src/modules/clinical/router.ts`:
- `GET /api/v1/patients`
- `POST /api/v1/patients`
- `GET /api/v1/patients/:id`
- `PATCH /api/v1/patients/:id`
- `DELETE /api/v1/patients/:id`
- `POST /api/v1/patients/:id/pregnancy-records`
- `POST /api/v1/patients/:id/neonatal-records`
- `GET /api/v1/appointments`
- `POST /api/v1/appointments`
- `GET /api/v1/appointments/:id`
- `PATCH /api/v1/appointments/:id`
- `DELETE /api/v1/appointments/:id`
- `GET /api/v1/clinical-notes`
- `POST /api/v1/clinical-notes`
- `PATCH /api/v1/clinical-notes/:noteGroupId`
- `DELETE /api/v1/clinical-notes/:noteGroupId`

Conclusão:
- O core de API hoje já atende tanto o domínio operacional quanto o domínio clínico inicial.
- O gap atual não é ausência de rotas, e sim governança, evidência e cobertura de maturidade.

### 4. Banco, schema e migrations

- `packages/database/prisma/schema.prisma` existe, segue grande e central, e materializa o domínio operacional.
- O mesmo schema agora também materializa entidades clínicas explícitas:
  - `Patient`
  - `PregnancyRecord`
  - `Appointment`
  - `ClinicalNote`
  - `NeonatalRecord`
- Existe migration dedicada para alinhar RLS de `workflow_revisions`.
- O artefato `artifacts/tenancy/rls-proof-head.json` registra:
  - `PASS workflow_revisions`
  - `runtimeProof.status = passed`
  - `sufficient = true`

Leitura:
- A lacuna de isolamento multi-tenant anteriormente aberta em `workflow_revisions` não permanece como bloqueio atual.
- O domínio materno-infantil já entrou no schema; o próximo debate deixa de ser “existe ou não existe” e passa a ser “qual a profundidade e a cobertura operacional real”.

### 5. Segurança, auth, LGPD, i18n e testes

- API com Helmet e CSP em `apps/api/src/app/core.ts`.
- Web com CSP/HSTS/X-Frame-Options/Referrer-Policy em `apps/web/next.config.mjs`.
- Privacidade/LGPD visível em UI e API:
  - `/settings/privacy`
  - `/api/v1/privacy`
  - banner de consentimento de analytics
- PT-BR segue explícito em layout, manifest e formatações.
- Não foi localizada camada formal de i18n como `next-intl`, `react-intl` ou `i18next`.
- O runtime canônico de sessão é DB-backed:
  - `apps/api/src/modules/auth/auth.service.sessions.ts` cria sessão em `prisma.session`
  - persiste `token` com hash
  - persiste `refreshTokenHash`
  - faz rotação de refresh token por nova sessão
- `packages/auth/index.ts` ainda contém `Map` local para refresh tokens, mas:
  - `apps/api/package.json` não declara dependência de `@birthub/auth`
  - `apps/web/package.json` não declara dependência de `@birthub/auth`
  - `apps/worker/package.json` não declara dependência de `@birthub/auth`
  - a busca por imports em `apps/api`, `apps/web` e `apps/worker` não retornou uso de `@birthub/auth` ou `createAuthService`
- CI real continua robusta, mas ainda há pontos de fragilidade:
  - testes que fazem `skip` sem banco/contexto externo
  - DAST condicional a `ZAP_TARGET_URL`
  - hardening de CD ainda pendente

### 6. Contradições relevantes entre baseline anterior e código real

- A leitura anterior de “`workflow_revisions` sem RLS” está superada.
- A leitura anterior de “runtime proof não fechada” está superada.
- A leitura anterior de “dashboard home ausente” está superada.
- A leitura anterior de “workflow list ausente” está superada.
- A leitura anterior de “domínio materno-infantil ausente do schema” está superada.
- A leitura anterior de “refresh token em memória bloqueando o runtime principal” não se sustenta com a arquitetura atualmente ligada no core.
- A colisão histórica de IDs `TD-001` a `TD-010` entre catálogos permanece real no legado, mas agora está explicitamente mapeada por namespace.

### 7. O que bloqueia avanço imediato

- A colisão histórica de IDs entre catálogos já está mapeada, mas a disciplina de uso do namespace ainda precisa ser absorvida pelos próximos ciclos.
- `cd.yml` continua com pontos de endurecimento pendentes.
- O baseline de DAST ainda depende de configuração opcional e não fecha evidência invariável do ciclo.
- Parte da evidência de maturidade continua dispersa entre artefatos, docs e workflows.
- `packages/auth` permanece como dívida arquitetural residual e fonte provável de falso positivo em auditorias futuras se não for saneado.

### 8. Confirmação/refutação do relatório master (`audit/RELATORIO_DIVIDA_TECNICA_MASTER.md`)

| ID | Status | Evidência principal | Leitura |
|---|---|---|---|
| TD-001 | REFUTADO NO CORE / CONFIRMADO EM PACOTE ISOLADO | `apps/api/src/modules/auth/auth.service.sessions.ts`, `apps/api/package.json`, `packages/auth/index.ts` | O runtime principal persiste sessão e refresh token em banco; o `Map` em memória existe, mas sem evidência de wiring no core canônico. |
| TD-002 | REFUTADO NO WORKTREE ATUAL | `packages/database/prisma/migrations/20260407000100_workflow_revisions_rls_alignment/migration.sql`, `artifacts/tenancy/rls-proof-head.json` | O risco tratado pelo item foi fechado na fotografia atual: `workflow_revisions` está em `PASS` e a prova runtime está suficiente. |
| TD-003 | REFUTADO NO HEAD ATUAL | `artifacts/database/f8/schema-drift-report.txt:1`, `packages/database/scripts/check-schema-drift.ts` | O artefato fresco atual está em `PASS`; o risco remanescente é mais de governança operacional que de drift confirmado. |
| TD-004 | AMBÍGUO | ausência de definição estável no relatório master + reutilização no auditor-prime | Não há definição estável do item neste catálogo. |
| TD-005 | AMBÍGUO | ausência de definição estável no relatório master + reutilização no auditor-prime | Não há definição estável do item neste catálogo. |
| TD-006 | AMBÍGUO | ausência de definição estável no relatório master + reutilização no auditor-prime | Não há definição estável do item neste catálogo. |
| TD-007 | AMBÍGUO | ausência de definição estável no relatório master + reutilização no auditor-prime | Não há definição estável do item neste catálogo. |
| TD-008 | AMBÍGUO | ausência de definição estável no relatório master + reutilização no auditor-prime | Não há definição estável do item neste catálogo. |

### 9. Confirmação do backlog estrutural atual (`audit/.auditor-prime/2026-04-07/03-scored-report.json`)

| ID | Status | Evidência principal | Leitura |
|---|---|---|---|
| TD-001 | CONFIRMADO | `apps/api/src/modules/workflows/router.ts:61` | hotspot arquitetural real no router de workflows |
| TD-002 | CONFIRMADO | `packages/database/scripts/check-migration-governance.ts` | backlog estrutural atual, separado do master |
| TD-003 | CONFIRMADO | `apps/web/app/(dashboard)/workflows/[id]/edit/page.tsx` | página de edição complexa |
| TD-004 | CONFIRMADO | `apps/web/app/(dashboard)/workflows/[id]/revisions/page.tsx:19` | página de revisões complexa |
| TD-005 | CONFIRMADO | `apps/web/app/(dashboard)/workflows/[id]/runs/page.tsx:17` | página de runs complexa |
| TD-006 | CONFIRMADO | `apps/worker/src/agents/conversations.ts:57` | função de conversa complexa |
| TD-007 | CONFIRMADO | `docs/service-catalog.md`, `apps/legacy/dashboard` | legado ainda convive com o core |
| TD-008 | CONFIRMADO | `packages/database/prisma/schema.prisma` | schema central segue grande e concentrado |
| TD-018 | CONFIRMADO | `packages/database/scripts/check-schema-drift.ts:9` | `process.env` fora de camada única de config |
| TD-020 | CONFIRMADO | `apps/worker/src/engine/runner.db-integration.harness.ts:4` | harness lê `WORKFLOW_TEST_*` diretamente de `process.env` |
| TD-021 | CONFIRMADO | `packages/integrations/src/clients/fiscal.ts:63` | uso de `postJson<any>` em runtime |
| TD-022 | CONFIRMADO | `packages/llm-client/src/index.ts:58` | uso de `any` em erro/fallback |
| TD-024 | CONFIRMADO | `packages/integrations/src/clients/payments-br.ts:87` | uso de `postJson<any>` em runtime |
| TD-031 | CONFIRMADO | `.github/workflows/cd.yml:4`, `.github/workflows/cd.yml:68` | workflow usa `workflow_run` e checkout do SHA vindo do run anterior |
| TD-032 | CONFIRMADO | `.github/workflows/cd.yml:181`, `.github/workflows/cd.yml:195` | mesmo padrão reaparece na etapa de SBOM/release |
| TD-033 | CONFIRMADO | `packages/database/scripts/lib/prisma-schema.ts:40` | regex construída dinamicamente |
| TD-035 | CONFIRMADO COM CONTEXTO | `apps/worker/src/worker.job-validation.test.ts:47` | finding existe, mas está em arquivo de teste; não tem o mesmo peso de um secret runtime |
| TD-037 | CONFIRMADO COMO GAP DE EVIDÊNCIA | `.github/workflows/security-scan.yml` | existe esqueleto de ZAP, mas roda só se `ZAP_TARGET_URL` estiver configurada |
| TD-038 | PARCIAL | `.github/workflows/security-scan.yml` | Semgrep roda no pipeline, mas o pacote soberano do ciclo ainda não publica baseline única e fresca de segurança em F0 |

## B. Decisões arquiteturais

### Caminhos canônicos consolidados

- Frontend de produto: `apps/web`
- Backend de negócio: `apps/api`
- Worker assíncrono: `apps/worker`
- Banco/schema/migrations: `packages/database`
- Legado: `apps/legacy/dashboard`
- Fonte canônica de fronteiras: `docs/service-catalog.md`
- Fonte canônica de bloqueadores históricos: `audit/RELATORIO_DIVIDA_TECNICA_MASTER.md`
- Fonte canônica de backlog estrutural atual: `audit/.auditor-prime/2026-04-07/03-scored-report.json`

### Definição clara do que impede sair de YELLOW para GREEN

Para sair de `YELLOW`, o repositório precisa fechar simultaneamente:
- endurecimento de `cd.yml`
- baseline de segurança menos condicional, com evidência fresca de ciclo
- saneamento ou depreciação explícita de `packages/auth`
- validação fresca de CI e staging para o recorte canônico do produto

## C. Plano executável do ciclo atual

1. Congelar este baseline reconciliado como documento canônico de Fase 0.
2. Abrir ciclo curto de governança:
   - mapear IDs do relatório master contra auditor-prime
   - publicar tabela oficial de equivalência ou renumerar
3. Abrir ciclo curto de segurança de release:
   - revisar `cd.yml`
   - tornar DAST menos condicional
   - consolidar artefato canônico de segurança do ciclo
4. Abrir ciclo curto de auth package hygiene:
   - remover ou deprecar `packages/auth`
   - alinhar auditorias para o fluxo DB-backed real
5. Abrir ciclo curto de consolidação clínica:
   - validar ponta a ponta API/UI/testes para pacientes, gestação, consultas e notas

Sequência exata recomendada:
1. segurança de release/CD
2. saneamento de `packages/auth`
3. consolidação clínica ponta a ponta
4. backlog estrutural de complexidade e `any`

## D. Implementação

- Este ciclo atualizou o baseline documental da Fase 0 para refletir o runtime real do worktree atual.
- Os achados de tenancy, dashboard home, workflow list, auth durável e domínio clínico foram reclassificados com evidência fresca.
- Nenhum arquivo de runtime foi alterado nesta rodada.

## E. Validação

### Local
- [x] Rotas reais do frontend revalidadas
- [x] Rotas reais da API revalidadas
- [x] `schema.prisma` e migrations revalidados
- [x] Prova de tenancy/RLS revalidada como suficiente
- [x] Sessões DB-backed revalidadas no runtime da API
- [x] Ausência de dependência/import de `@birthub/auth` no core canônico revalidada
- [x] Superfícies clínicas em schema, API e frontend confirmadas
- [x] Catálogo canônico de serviços revisitado

### CI
- [ ] validação em CI concluída

Observação:
- O pipeline versionado continua presente, mas não foi reexecutado integralmente nesta rodada documental.

### Staging
- [ ] validação em staging concluída

Observação:
- Não houve execução em staging nesta rodada.

### Baseline de risco

| Dimensão | Status | Justificativa |
|---|---|---|
| Risco de produção | MÉDIO | core canônico já tem home, workflow list, tenancy proof e auth durável; faltam evidência fresca e governança de release |
| Risco de segurança | MÉDIO | RLS fechou no runtime atual, mas CD/DAST e baseline canônica de segurança ainda precisam endurecimento |
| Risco regulatório | MÉDIO | LGPD e isolamento multi-tenant estão melhor posicionados, porém sem fechamento fresco de staging |
| Risco de produto | MÉDIO | domínio clínico, dashboard e workflows já existem; o gap agora é profundidade, cobertura e maturidade |
| Risco operacional | MÉDIO | a colisão de IDs agora está mapeada, mas ainda há evidência dispersa e necessidade de adoção do namespace oficial |

## F. Status
- [ ] RED
- [ ] BLUE
- [x] YELLOW
- [ ] GREEN

Resumo final:
- O monorepo continua grande, real e operacional.
- O core canônico está mais maduro do que a leitura anterior indicava.
- Tenancy, auth durável do runtime principal, dashboard home, workflow list e domínio clínico inicial já não sustentam status `RED`.
- O gargalo atual saiu de governança de IDs e ficou concentrado em evidência de segurança/release e consolidação do que já entrou no produto.
