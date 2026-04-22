# Ciclo - 10 Planos Logicos (2026-04-09)

## Objetivo do ciclo

Executar em lote os proximos 10 planos logicos do backlog residual com foco em endurecimento de configuracao, tipagem/runtime, parser interno e governanca operacional de CD/seguranca.

## Itens do relatorio atacados

- [x] `TD-018`
- [x] `TD-020`
- [x] `TD-021`
- [x] `TD-022`
- [x] `TD-024`
- [x] `TD-031`
- [x] `TD-032`
- [x] `TD-033`
- [x] `TD-037`
- [x] `TD-038`

## Leitura do estado atual

- `packages/database/scripts/check-schema-drift.ts` ainda lia `DATABASE_URL` e `SHADOW_DATABASE_URL` diretamente de `process.env`.
- `apps/worker/src/engine/runner.db-integration.harness.ts` ainda montava o harness de integracao a partir de `WORKFLOW_TEST_*` sem camada dedicada de parse/validacao.
- `packages/integrations/src/clients/fiscal.ts` e `packages/integrations/src/clients/payments-br.ts` ainda dependiam de `postJson<any>` em superficie de runtime.
- `packages/llm-client/src/index.ts` ainda mantinha `any` no fluxo de fallback/erro do cliente.
- `packages/database/scripts/lib/prisma-schema.ts` ainda usava regex dinamica para escolher parser de campos em nivel de modelo.
- `.github/workflows/cd.yml` fazia checkout e tagging de imagem a partir de contexto disperso do evento, sem manifesto unico da origem imutavel do release.
- `.github/workflows/security-scan.yml` so executava ZAP quando `vars.ZAP_TARGET_URL` existia, o que deixava DAST como evidencia opcional.
- `scripts/security/generate-security-report.ts` publicava apenas markdown e sem baseline JSON consolidada.

## Decisoes arquiteturais

- Centralizar parse de ambiente em helpers pequenos e testados em vez de espalhar acesso cru a `process.env`.
- Tipar a resposta dos providers externos no cliente, preservando validacao no limite da integracao em vez de propagar `any`.
- Normalizar erros de provider no `llm-client` com `unknown -> Error`, mantendo fallback observavel sem perda de tipagem.
- Substituir a regex dinamica do parser Prisma por leitura deterministica linha a linha para `@@id`, `@@index` e `@@unique`.
- Resolver uma unica vez o commit fonte do release no CD e propagar esse SHA para checkout, SBOM e tags de imagem.
- Publicar `source-manifest.json` no bundle de release para rastreabilidade de auditoria e rollback.
- Tornar ZAP autonomo via alvo local canonico (`/login` do `@birthub/web`) e publicar evidencia consolidada em `md + json`.

## Plano executavel

- passo 1: mover leituras de ambiente para helpers com testes de contrato
- passo 2: eliminar `any` em clientes externos e parser interno com cobertura pontual
- passo 3: prender o workflow de CD a um SHA imutavel e materializar manifesto de origem
- passo 4: transformar o lane de seguranca em baseline soberana com ZAP autonomo e relatorio estruturado

## Arquivos impactados

- criar:
  - `packages/database/scripts/lib/env.ts`
  - `packages/database/test/schema-drift-environment.test.ts`
  - `apps/worker/src/engine/runner.db-integration.config.ts`
  - `apps/worker/src/engine/runner.db-integration.config.test.ts`
  - `packages/integrations/src/clients/fiscal.test.ts`
  - `packages/integrations/src/clients/payments-br.test.ts`
  - `packages/database/test/prisma-schema.test.ts`
  - `scripts/security/generate-security-report.test.ts`
  - `docs/execution/CICLO_10_PLANOS_LOGICOS_2026-04-09.md`
- alterar:
  - `.github/workflows/cd.yml`
  - `.github/workflows/security-scan.yml`
  - `scripts/security/generate-security-report.ts`
  - `docs/release/reproducible-build.md`
  - `packages/database/scripts/check-schema-drift.ts`
  - `packages/database/scripts/lib/prisma-schema.ts`
  - `packages/integrations/src/clients/fiscal.ts`
  - `packages/integrations/src/clients/payments-br.ts`
  - `packages/llm-client/src/index.ts`
  - `packages/llm-client/src/index.test.ts`
  - `apps/worker/src/engine/runner.db-integration.harness.ts`
- remover:
  - job orfao `deploy-production-candidate` em `.github/workflows/cd.yml`

## Checklist de implementacao

- [ ] migrations
- [ ] rotas
- [x] servicos
- [x] validacoes
- [ ] UI
- [ ] loading/error/empty
- [x] testes
- [x] docs

## Validacao

### Local

- [x] validacao local concluida

Comandos executados:

```bash
node --import tsx --test packages/database/test/schema-drift-environment.test.ts packages/database/test/prisma-schema.test.ts
node --import tsx --test apps/worker/src/engine/runner.db-integration.config.test.ts
node --import tsx --test packages/integrations/src/clients/fiscal.test.ts packages/integrations/src/clients/payments-br.test.ts
node --import tsx --test packages/llm-client/src/index.test.ts scripts/security/generate-security-report.test.ts
node node_modules/typescript/bin/tsc -p packages/database/tsconfig.json --noEmit
node node_modules/typescript/bin/tsc -p apps/worker/tsconfig.json --noEmit
node node_modules/typescript/bin/tsc -p packages/integrations/tsconfig.json --noEmit
node node_modules/typescript/bin/tsc -p packages/llm-client/tsconfig.json --noEmit
node node_modules/prettier/bin/prettier.cjs --no-config --check .github/workflows/cd.yml .github/workflows/security-scan.yml scripts/security/generate-security-report.ts scripts/security/generate-security-report.test.ts packages/integrations/src/clients/fiscal.ts packages/integrations/src/clients/fiscal.test.ts
node --import tsx scripts/security/generate-security-report.ts
```

Resultado local:

- Todos os testes novos do lote passaram.
- Todos os typechecks segmentados do lote passaram.
- O relatorio de seguranca passou a ser gerado tambem em `artifacts/security/security-coverage-report.json`.
- O `packages/database` nao apresentou regressao de typecheck neste lote.

### CI

- [ ] validacao em CI concluida

### Staging

- [ ] validacao em staging concluida

## Status

- [ ] RED
- [ ] BLUE
- [x] YELLOW
- [ ] GREEN

## Prompt

Voce esta executando um ciclo arquitetural do plano BirthHub 360.
Ataque apenas os itens listados neste ciclo.
Entregue:
A. Leitura do estado atual
B. Decisoes arquiteturais
C. Plano executavel do ciclo atual
D. Implementacao
E. Validacao
F. Status
