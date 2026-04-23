# Cycle 7 Release Readiness Review

## Escopo e base efetiva

Os seguintes arquivos mandatórios do prompt não existem com esses nomes no workspace:

- `audit/source_of_truth.md`
- `audit/master_backlog_revalidated.md`
- `audit/readiness_matrix.md`
- `audit/reconciliation_report.md`
- `audit/phase1_execution_summary.md`
- `audit/cycle2_execution_summary.md`
- `audit/cycle3_execution_summary.md`
- `audit/cycle4_execution_summary.md`
- `audit/cycle5_execution_summary.md`
- `audit/cycle6_execution_summary.md`

Além disso, durante a execução apareceram evidências reais para parte dos ciclos finais:

- `audit/cycle4_execution_summary.md`
- `audit/cycle5_execution_summary.md`
- `audit/cycle6_execution_summary.md`

Ainda permanecem sem correspondente local rastreável:

- `audit/source_of_truth.md`
- `audit/master_backlog_revalidated.md`
- `audit/readiness_matrix.md`
- `audit/reconciliation_report.md`
- `audit/phase1_execution_summary.md`
- `audit/cycle2_execution_summary.md`
- `audit/cycle3_execution_summary.md`

Para não inventar uma base inexistente, esta revisão usou os equivalentes materiais encontrados no repositório:

- `audit/README.md`
- `audit/STATUS_FINAL_PRONTIDAO.md`
- `audit/reproduction_matrix.md`
- `audit/auditor-prime-latest.backlog.md`
- `audit/td-catalog-reconciliation.md`
- `audit/final_governance_report.md`
- `audit/final_validation_report.md`
- `audit/cycle4_execution_summary.md`
- `audit/cycle5_execution_summary.md`
- `audit/cycle6_execution_summary.md`
- `docs/release/release-process.md`
- `docs/operational/runbooks/production-release-runbook.md`
- `.github/workflows/cd.yml`
- `artifacts/release/*`
- `artifacts/sbom/*`

## Resultado executivo

Status final de release readiness: **REPROVADO**

O repositório consegue materializar parte do pacote de release (`pnpm release:bundle` passou), mas o lançamento ainda não é comprovadamente seguro nem rastreável o suficiente para go-live.

## Achados principais

### 1. Fluxo declarado de release diverge do fluxo realmente executável

Evidência:

- `docs/release/release-process.md:11-20` declara a sequência `smoke -> e2e -> backup-health -> rollback evidence -> dr-readiness -> deploy-production`.
- `docs/operational/runbooks/production-release-runbook.md:18-24` manda rodar `preflight`, `smoke`, `test:e2e:release` e registrar rollback **antes** de disparar o CD.
- `.github/workflows/cd.yml:613-749` executa `release-smoke-gate`, `release-e2e-gate` e `rollback-rehearsal-evidence-gate` **depois** de `deploy-production`.
- `.github/workflows/cd.yml:751-823` mostra que `deploy-production` depende apenas de `release-sbom` e `production-preflight`.

Implicação:

- O deploy de produção pode acontecer antes dos gates que deveriam bloqueá-lo.
- Os jobs `backup-health-gate` e `dr-readiness-gate`, descritos em `docs/release/release-process.md:17-20`, não existem no workflow atual.

Classificação: **blocker real**

### 2. Versionamento e release declarado não estão totalmente ancorados em artefato Git comprovável

Evidência:

- `package.json:2-8` declara `version: 1.0.0`, `pnpm@9.1.0` e `node >=24 <25`.
- `releases/notes/v1.0.0.md` foi regenerado em `2026-04-11T16:45:35.768Z` e continua afirmando apenas "Tag preparada: v1.0.0".
- `git tag --list` retornou somente `baseline-f0`.

Implicação:

- Existe narrativa de release `v1.0.0`, mas não existe tag Git `v1.0.0` no repositório local auditado.
- O pacote local também não contém `artifacts/release/source-manifest.json`; esse manifesto só é criado dentro do workflow (`.github/workflows/cd.yml:280-313`).

Classificação: **blocker de rastreabilidade**

### 3. Integridade do pacote de release é parcial

Evidência:

- `pnpm release:bundle` passou em `2026-04-11`.
- O manifesto `artifacts/release/checksums-manifest.sha256` falhou quando revalidado contra os arquivos atuais.
- A única divergência encontrada após a rematerialização foi o próprio `artifacts/release/checksums-manifest.sha256`.
- O comportamento é coerente com `scripts/release/materialize-release.ts:76-150`, que lê artefatos já existentes de `artifacts/release`, inclui o checksum anterior na lista e depois sobrescreve o manifesto.

Implicação:

- O pacote de release não fecha a própria integridade.
- O manifesto de checksums serve como índice parcial, não como prova forense autoconsistente.

Classificação: **blocker real**

### 4. Gates operacionais críticos seguem vermelhos

Evidência fresca:

- `pnpm release:scorecard` executado em `2026-04-11` falhou com score `70/100`.
- Falhas reportadas:
  - `Dead code regression`: `Current=21, regressions=21`
  - `Backup health`: nenhum backup real encontrado em `artifacts/backups`
  - `Disaster recovery drill`: artefato insuficiente para auditoria
  - `Score threshold`: `70 < 100`

Artefatos correspondentes:

- `artifacts/release/scorecard.json`
- `artifacts/backups/backup-health.json`
- `artifacts/dr/readiness-report.json`
- `artifacts/dr/latest-drill.json`

Classificação: **blocker real**

### 5. O verificador de evidência de release é superficial demais para suportar decisão de go-live

Evidência:

- `node --import tsx scripts/release/verify-release-evidence.ts --target=production --stage=all` passou.
- O script só verifica presença de arquivo e, para JSON, `ok === true` (`scripts/release/verify-release-evidence.ts:42-125`).
- O script não valida:
  - ordem do workflow
  - frescor do artefato
  - integridade por checksum
  - presença do `source-manifest`
  - scorecard mínimo
  - prova de backup material

Implicação:

- O repositório possui um verificador que pode dizer "release evidence ok" enquanto o scorecard e o desenho do CD ainda estão reprovados.

Classificação: **falha de controle**

### 6. Os ciclos anteriores reforçam que o produto ainda não fechou o endurecimento do core operacional

Evidência:

- `audit/cycle4_execution_summary.md` registra:
  - `pnpm --filter @birthub/web lint` = FAIL
  - web com grande volume remanescente de `@ts-nocheck`
  - ausência de suíte E2E auth/tenant completa
- `audit/cycle5_execution_summary.md` registra:
  - 15/15 agentes executivos ainda classificados como `estrutural`
  - 15/15 com `console.*`
  - 14/15 `agent.ts` ainda com `@ts-nocheck`
- `audit/cycle6_execution_summary.md` registra:
  - prontidão comercial apenas `operacional limitada`
  - ausência de base confiável para billing por uso

Implicação:

- Mesmo fora dos blockers centrais de pipeline, os ciclos recentes não descrevem um produto estabilizado; descrevem uma plataforma ainda em endurecimento.

Classificação: **risco sistêmico adicional**

## Pontos positivos reais

- `pnpm release:bundle` passou sob Node `24.14.0`.
- `scripts/release/preflight-env.ts` passou para staging e production usando:
  - `ops/release/sealed/.env.staging.sealed`
  - `ops/release/sealed/.env.production.sealed`
- `pnpm workspace:audit` passou.
- `pnpm monorepo:doctor` passou sem achados críticos.
- SBOM foi regenerado com sucesso em CycloneDX e SPDX.
- Os ciclos 4, 5 e 6 mostram progresso real em auth web, governança de agentes e billing, ainda que insuficiente para fechar prontidão total.

## Conclusão

O projeto possui **estrutura de release**, mas não possui **release comprovavelmente pronta para produção**. O bloqueio não é documental; ele está em:

- ordem insegura do fluxo de produção
- falha do scorecard operacional
- ausência de tag semântica real
- ausência de `source-manifest` local
- manifesto de checksums estruturalmente inconsistente

Parecer deste bloco: **release não pronta para go-live**.

