# Template de Execucao por Ciclo

## Objetivo do ciclo
Estabilizar o gate de governanca de qualidade da Fase 5, separando o lane core do lane satelite no `knip`, removendo ruido de dependencias/declaracoes e registrando o backlog residual real.

## Itens do relatorio atacados
- [x] refinar `knip` por workspace para o core canonico
- [x] separar um lane satelite de dead code para nao contaminar o gate do core
- [x] corrigir declaracoes de dependencia que estavam gerando ruido falso
- [x] revalidar o estado atual de coverage e dead code com evidencia atualizada

## Leitura do estado atual
- O `quality:dead-code` do monorepo misturava core, satelites, authoring de agentes e scripts operacionais, produzindo muito ruido e pouco backlog acionavel.
- O dashboard de coverage local voltou a `PASS`, mas `scripts/coverage/check.mjs` ainda roda em `static-coverage-proxy` e deixa um `WARN` de suficiencia que impede tratar o resultado como fechamento definitivo de release.
- O core do produto ja nao precisa de mais feature work para este ciclo; o gargalo principal passou a ser governanca operacional e higiene de codigo.
- Havia tambem declaracoes inconsistentes de dependencia em `package.json`, `apps/api/package.json`, `packages/agents-core/package.json` e `packages/emails/package.json`, o que inflava o sinal de `knip`.

## Decisoes arquiteturais
- Tratar o `knip` do core como gate principal do go-live e criar uma configuracao satelite separada para authoring/servicos nao canonicos.
- Reduzir o escopo do lane core para o que de fato conversa com o catalogo operacional canonico, sem esconder o backlog satelite.
- Corrigir dependencias declaradas no nivel do workspace quando o problema era semantico e nao apenas aplicar `ignore`.
- Manter os orfaos restantes visiveis no lane core, porque agora eles representam majoritariamente backlog real e nao mais ruido estrutural.

## Plano executavel
- passo 1: reconfigurar `knip.json` com workspaces explicitos do core e `knip.satellites.json` para o resto da trilha.
- passo 2: ajustar declaracoes de dependencia e scripts para eliminar falsos positivos basicos.
- passo 3: reexecutar os dois lanes de dead code e o gate de coverage para registrar o novo baseline real.
- passo 4: materializar o backlog residual do core e dos satelites com contagens objetivas.

## Arquivos impactados
- criar:
  - `docs/cycles/2026-04-08-governanca-de-qualidade-core-vs-satelites.md`
  - `knip.satellites.json`
- alterar:
  - `knip.json`
  - `package.json`
  - `apps/api/package.json`
  - `packages/agents-core/package.json`
  - `packages/emails/package.json`
  - `docs/execution/CICLO_F3_F5_RASTREABILIDADE_2026-04-08.md`
- remover:
  - nenhum

## Checklist de implementacao
- [ ] migrations
- [ ] rotas
- [ ] servicos
- [ ] validacoes
- [ ] UI
- [ ] loading/error/empty
- [ ] testes
- [x] docs

## Implementacao
- O lane principal de dead code ficou segmentado em `knip.json`, agora focado no core canonico e nas trilhas de script/configuracao relevantes para release.
- Foi criado `knip.satellites.json` para manter rastreabilidade separada de `apps/voice-engine`, `apps/webhook-receiver`, `packages/agent-packs` e `packages/agents`.
- O root `package.json` deixou de carregar dependencias claramente ociosas no nivel da raiz e passou a declarar workspace/devDependencies usadas por scripts de governanca.
- `apps/api/package.json` e `packages/agents-core/package.json` deixaram de declarar dependencias que o `knip` comprovou nao estarem em uso.
- `packages/emails/package.json` passou a declarar `react`, eliminando o ruido de `unlisted dependency` nas templates.

## Validacao
### Local
- [x] validacao local concluida

Resultados locais:
- `node scripts/ci/run-pnpm.mjs exec knip --config knip.json`
  - lane core agora falha com `34` arquivos nao usados, `68` exports nao usados, `1` duplicate export e `4` hints de configuracao.
- `node scripts/ci/run-pnpm.mjs exec knip --config knip.satellites.json`
  - lane satelite agora falha isoladamente com `29` arquivos nao usados, `5` dependencias nao usadas, `4` devDependencies nao usadas, `32` unlisted dependencies, `86` exports nao usados e `8` duplicate exports.
- `node scripts/coverage/check.mjs`
  - concluiu com dashboard local em `PASS`, mas ainda reportando `module coverage sufficiency: WARN` em `static-coverage-proxy`.
- `node scripts/ci/run-pnpm.mjs --filter @birthub/agents-core typecheck`
  - passou.
- `node scripts/ci/run-pnpm.mjs --filter @birthub/api typecheck`
  - falhou por erros preexistentes em `apps/api/src/modules/clinical/service.ts` e `apps/api/tests/clinical.service.test.ts`, fora do escopo deste ciclo.
- `node scripts/ci/run-pnpm.mjs --filter @birthub/emails typecheck`
  - falhou por configuracao JSX/tipos React ainda incompleta no pacote de emails, tambem fora do objetivo principal deste ciclo.

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
