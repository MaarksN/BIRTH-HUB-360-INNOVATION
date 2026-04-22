# Template de Execucao por Ciclo

## Objetivo do ciclo
Fechar em um unico lote o endurecimento dos contratos HTTP mais adjacentes do `apps/api`: onboarding do dashboard, retention/privacy e reversao de revisoes de workflow, com validacao automatizada e rastreabilidade atualizada.

## Itens do relatorio atacados
- [x] extrair schema dedicado para `PATCH /api/v1/dashboard/onboarding`
- [x] substituir validacao manual por `validateBody(...)` no dashboard
- [x] cobrir onboarding com teste de sucesso e payload invalido
- [x] extrair schemas de privacy para um modulo dedicado
- [x] validar `POST /retention/run` com default de `DRY_RUN`
- [x] cobrir `privacy` com cenario de organizacao inexistente
- [x] cobrir `privacy` com cenario de enum invalido
- [x] refatorar `revertWorkflow` para reutilizar o escopo ja resolvido
- [x] garantir que o revert repersista `canvas` e volte em `DRAFT`
- [x] destravar a validacao local complementar de typecheck alinhando helper compartilhado e `RequestContext`

## Leitura do estado atual
- O lote atual ja estava parcialmente aberto no worktree, com extracao de schemas e testes novos ainda sem consolidacao documental do ciclo.
- O dashboard ainda aceitava um contrato validado manualmente, o que mantinha o comportamento correto, mas espalhava regra de payload dentro da rota.
- `privacy/router.ts` tinha schemas inline e o fluxo de retention precisava ficar mais facil de testar e rastrear como contrato de API, nao apenas como regra de servico.
- O revert de workflow ja tinha cobertura de rota, mas a persistencia do `canvas` e a reutilizacao do escopo autenticado precisavam ficar explicitas para evitar regressao silenciosa.
- A validacao complementar de `@birthub/api` ainda parava em `apps/api/tests/http-test-helpers.ts` por ausencia de anotacao explicita de retorno e por drift entre o helper de testes e o contrato oficial de `RequestContext`.

## Decisoes arquiteturais
- Centralizar os contratos Zod em arquivos `schemas.ts` por modulo, preservando as rotas como orquestradoras finas.
- Usar `validateBody(...)` antes do handler e manter `schema.parse(...)` no ponto de uso para clareza do payload consumido.
- Tratar `dashboard`, `privacy` e `workflows/revert` como um unico lote logico de confiabilidade de API, porque compartilham o mesmo eixo de risco: drift entre contrato HTTP, persistencia e tenant scope.
- Reaproveitar o escopo resolvido no revert de workflow, em vez de reconsultar tenant/organizacao desnecessariamente, para reduzir ambiguidade e custo de regressao.
- Corrigir o bloqueio de typecheck no helper compartilhado por anotacao explicita e realinhar `RequestContext` com o uso real de break-glass, sem transformar este ciclo em uma limpeza ampla de tipagem do pacote inteiro.

## Plano executavel
- passo 1: consolidar o schema do onboarding do dashboard
- passo 2: validar onboarding com middleware padrao de body
- passo 3: fechar testes de sucesso e rejeicao do dashboard
- passo 4: mover schemas de privacy para modulo dedicado
- passo 5: revalidar retention com `DRY_RUN` default
- passo 6: fechar rejeicoes de privacy para `404` e enum invalido
- passo 7: refatorar o revert de workflow para reaproveitar escopo autenticado
- passo 8: revalidar a repersistencia de steps/transitions no revert
- passo 9: corrigir o helper compartilhado e realinhar `RequestContext` para liberar o typecheck local
- passo 10: atualizar a rastreabilidade e registrar o ciclo

## Arquivos impactados
- criar:
  - `docs/cycles/2026-04-10-hardening-contratos-api-dashboard-privacy-workflows.md`
- alterar:
  - `apps/api/src/modules/dashboard/router.ts`
  - `apps/api/src/modules/dashboard/schemas.ts`
  - `apps/api/src/modules/privacy/router.ts`
  - `apps/api/src/modules/privacy/schemas.ts`
  - `apps/api/src/middleware/request-context.ts`
  - `apps/api/src/modules/workflows/service.ts`
  - `apps/api/tests/dashboard-router.test.ts`
  - `apps/api/tests/http-test-helpers.ts`
  - `apps/api/tests/privacy-router.test.ts`
  - `apps/api/tests/workflows-router.test.ts`
  - `docs/testing/F5_TRACEABILITY.md`
- remover:
  - nenhum

## Checklist de implementacao
- [ ] migrations
- [x] rotas
- [x] servicos
- [x] validacoes
- [ ] UI
- [ ] loading/error/empty
- [x] testes
- [x] docs

## Implementacao
- `apps/api/src/modules/dashboard/router.ts` passou a consumir `dashboardOnboardingUpdateSchema` via `validateBody(...)`, retirando a validacao manual inline do payload.
- `apps/api/src/modules/dashboard/schemas.ts` materializou o contrato estrito do onboarding, agora sem `@ts-nocheck`.
- `apps/api/src/modules/privacy/router.ts` passou a importar schemas dedicados de `apps/api/src/modules/privacy/schemas.ts`, isolando contratos de consentimento, retention e delete-account.
- `apps/api/src/modules/privacy/schemas.ts` concentrou os enums e contratos reutilizaveis do modulo de privacy, tambem sem `@ts-nocheck`.
- `apps/api/src/modules/workflows/service.ts` passou a reaproveitar `ScopedIdentity` e o workflow ja carregado no fluxo de revert, garantindo update em `DRAFT` com repersistencia do `canvas`.
- `apps/api/tests/dashboard-router.test.ts` ganhou cobertura adicional para rejeitar payload com propriedades inesperadas.
- `apps/api/tests/privacy-router.test.ts` ganhou cobertura adicional para rejeitar `mode` invalido na execucao de retention.
- `apps/api/tests/http-test-helpers.ts` recebeu retorno explicito `Express`, eliminando o primeiro bloqueio de typecheck detectado localmente.
- `apps/api/src/middleware/request-context.ts` voltou a declarar os campos de break-glass efetivamente usados pelo middleware e pelos helpers de teste, fechando o drift do contrato central de request.
- `docs/testing/F5_TRACEABILITY.md` recebeu uma secao propria para contratos de API de dashboard/privacy/workflows.

## Validacao
### Local
- [x] validacao local concluida

Resultados locais:
- `node --import tsx --test apps/api/tests/dashboard-router.test.ts apps/api/tests/privacy-router.test.ts apps/api/tests/workflows-router.test.ts`
  - passou com `12` testes verdes
- `node scripts/ci/run-pnpm.mjs --filter @birthub/api typecheck`
  - passou apos a anotacao explicita de retorno em `apps/api/tests/http-test-helpers.ts` e o realinhamento de `apps/api/src/middleware/request-context.ts`

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

