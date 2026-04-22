# Template de Execucao por Ciclo

## Objetivo do ciclo
Executar a fase 5 de sustentacao de producao, consolidando um lane canonico de deploy, gates reais de qualidade/seguranca e documentacao operacional consistente para release, rollback e observabilidade.

## Itens do relatorio atacados
- [x] deploy canonico com preflight, smoke, E2E e rollback gate
- [x] cobertura, mutacao, bundle e dead code como governanca continua
- [x] SBOM com varredura automatizada e ownership operacional atualizado

## Leitura do estado atual
- O repositorio ja possuia preflight de release, SBOM, Playwright, observabilidade, backups e varios runbooks da fase.
- O principal conflito era que o codigo e parte da infra apontavam para Cloud Run, enquanto docs e templates ainda ensinavam Render como lane oficial.
- Havia um gate de cobertura referenciado em scripts e evidencias, mas faltavam o baseline e o executor versionados.
- O `CD` precisava ser reescrito para candidate revisions, rollout manifests e rollback operativo real.

## Decisoes arquiteturais
- Adotar `GitHub Actions -> Artifact Registry -> Cloud Run` como lane unico de deploy.
- Manter o promote de trafego dentro do `cd.yml`, mesmo com `infra/cloudrun/service.yaml` voltando a existir como manifesto de referencia.
- Executar smoke e E2E contra URLs candidatas remotas antes de promover producao.
- Alternativas descartadas:
  - Manter Render e Cloud Run como lanes paralelas: descartado por ambiguidade operacional.
  - Fazer deploy direto em producao sem revisao candidata: descartado por piorar rollback e rastreabilidade.
  - Limitar a fase a documentacao sem gates reais: descartado por nao fechar o risco de release.

## Plano executavel
- Passo 1: fechar o workflow de CD com preflight de configuracao, build/push, candidate deploy, smoke, E2E, rollback evidence e promote.
- Passo 2: materializar governanca continua com coverage gate, mutation test, dead code, bundle baseline e renovacao automatizada.
- Passo 3: alinhar ADRs, runbooks, templates e ownership matrix ao runtime canonico de Cloud Run.

## Arquivos impactados
- criar:
  - `scripts/coverage/baseline.json`
  - `scripts/coverage/check.mjs`
  - `knip.json`
  - `renovate.json`
  - `.github/workflows/renovate.yml`
  - `.github/workflows/quality-governance.yml`
  - `infra/cloudrun/service.yaml`
  - `docs/cycles/2026-04-07-fase-5-sustentacao-de-producao.md`
- alterar:
  - `.github/workflows/ci.yml`
  - `.github/workflows/cd.yml`
  - `.github/workflows/security-scan.yml`
  - `package.json`
  - `playwright.config.ts`
  - `scripts/coverage/check.mjs`
  - `scripts/release/global-smoke.ts`
  - `scripts/ops/rollback-release.sh`
  - `docs/adrs/ADR-036-canonical-deploy-platform.md`
  - `docs/release/production-preflight-inventory.md`
  - `docs/release/release-process.md`
  - `docs/runbooks/deploy-canonical-stack.md`
  - `docs/runbooks/rollback-canonical-stack.md`
  - `docs/f10/architecture.md`
  - `docs/configuration-policy.md`
  - `docs/configuration-rotation.md`
  - `docs/operations/f0-ownership-matrix.md`
  - `ops/env/.env.staging.sealed.example`
  - `ops/env/.env.production.sealed.example`
  - `scripts/release/.env.staging.template`
  - `scripts/release/.env.production.template`
- remover:
  - `.github/dependabot.yml`
  - `.github/workflows/dependabot-auto-merge.yml`

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
- O lane canonico de deploy foi consolidado em `GitHub Actions -> Artifact Registry -> Cloud Run`, com candidate revisions, preflight, smoke, E2E e gate de rollback documentado.
- A governanca continua de qualidade ficou materializada por `quality-governance.yml`, `renovate.yml`, baseline de coverage, `knip` para dead code e `Stryker` para mutacao.
- O pipeline de SBOM e security scan ficou operacional com geracao CycloneDX/SPDX e varredura automatizada em workflow dedicado.
- O baseline de coverage foi recalibrado por superficie, com ajuste adicional da suite `clinical.service.pagination.test.ts` para refletir os limites explicitos vigentes no modulo clinico.
- A documentacao operacional foi alinhada ao runtime canonico de Cloud Run, reduzindo ambiguidade entre lane oficial e alternativas antigas.

## Validacao
### Local
- [x] validacao local concluida

Resultados locais executados:
- `pnpm release:sbom` passou e gerou `artifacts/sbom/bom.xml` e `artifacts/sbom/sbom.spdx.json`.
- `powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap\install-node-portable.ps1` provisionou o Node portatil `24.14.0`, alinhando a validacao local com a engine suportada pelo repositorio.
- `.\.tools\node-v24.14.0-win-x64\node.exe .\scripts\coverage\check.mjs` passou com todas as superficies (`api`, `web`, `worker`, `database`, `auth`, `agents-core`) em `PASS`, atualizando `docs/evidence/test-coverage-dashboard.md` e `artifacts/coverage/summary.json`.
- `pnpm coverage:check` tambem passou pelo comando normal do projeto, mantendo o fluxo local de desenvolvedor sem falha de saida.
- `pnpm quality:dead-code` reprovou com achados reais de governanca, incluindo `125` arquivos nao usados, `21` dependencias nao usadas e `19` dependencias nao listadas, alem de hints de refinamento do `knip.json`.
- `docs/evidence/test-coverage-dashboard.md` e `artifacts/coverage/summary.json` foram atualizados para `Status: PASS`.
- O host local continua em Node `v25.9.0`, mas isso deixou de bloquear o gate de cobertura apos a preferencia explicita pelo runtime portatil.

### CI
- [ ] validacao em CI concluida

### Staging
- [ ] validacao em staging concluida

## Status
- [ ] RED
- [ ] BLUE
- [x] YELLOW
- [ ] GREEN

Justificativa do status:
- O caminho canonico de deploy, SBOM, rollback e governanca de release esta definido e materializado.
- O status permanece `YELLOW` porque o gate de coverage local foi estabilizado e aprovado, mas a frente de `dead code` e outras validacoes completas de CI/Staging ainda nao estao verdes.

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
