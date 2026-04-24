# Cycle 7 Go-Live Decision

## Decisão final

Classificação final: **NÃO APTO**

## Fundamentação objetiva

O parecer de go-live não pode ser positivo porque, no estado auditado em `2026-04-11`, coexistem blockers reais de:

- build
- typecheck
- lint
- backup/DR
- integridade do pacote de release
- ordem do workflow de produção
- rastreabilidade de versão/tag

Isso excede amplamente o nível aceitável para `apto com ressalvas`.

## Blockers finais

### 1. O lane obrigatório de validação não está verde

Evidência:

- `pnpm typecheck` falhou.
- `pnpm lint` falhou.
- `pnpm build` falhou.

Detalhe:

- `typecheck` caiu no guard de `@ts-nocheck`.
- `lint` caiu no `lint-policy` por `EPERM` em `.pytest_cache`.
- `build` caiu em `packages/agents-core` com erros TypeScript.

Motivo para bloquear:

- não existe release honesta quando os gates básicos de código ainda estão vermelhos.

### 2. O workflow de produção pode fazer deploy antes dos gates críticos

Evidência:

- `.github/workflows/cd.yml:613-749`
- `.github/workflows/cd.yml:751-823`
- `docs/release/release-process.md:11-20`
- `docs/operational/runbooks/production-release-runbook.md:18-24`

Motivo para bloquear:

- smoke, E2E e rollback evidence deveriam bloquear o deploy;
- no workflow atual eles são executados depois do deploy;
- `backup-health-gate` e `dr-readiness-gate`, prometidos na documentação, não existem no pipeline real.

### 3. Não há prova material de backup operacional e o drill de DR é insuficiente

Evidência:

- `artifacts/backups/backup-health.json` -> `ok: false`
- `artifacts/dr/readiness-report.json` -> `overallStatus: fail`
- `artifacts/dr/latest-drill.json` -> `status: blocked`
- `artifacts/release/scorecard.json` -> falha nesses gates

Motivo para bloquear:

- sem backup material e com drill insuficiente, o risco de go-live não é aceitável.

### 4. O manifesto de checksums do pacote de release não é autoconsistente

Evidência:

- revalidação local do `artifacts/release/checksums-manifest.sha256` falhou para o próprio manifesto;
- `scripts/release/materialize-release.ts` gera o problema de forma estrutural ao partir de arquivos já presentes em `artifacts/release`.

Motivo para bloquear:

- um pacote de release com checksum inconsistente perde valor forense justamente no artefato de integridade.

### 5. A release `v1.0.0` não está ancorada em tag Git local comprovável

Evidência:

- `package.json` e `releases/notes/v1.0.0.md` falam em `1.0.0` / `v1.0.0`;
- `git tag --list` retornou apenas `baseline-f0`.

Motivo para bloquear:

- a versão declarada da release não está fechada com a referência Git correspondente.

### 6. O bundle local não inclui `source-manifest.json`

Evidência:

- `Test-Path artifacts/release/source-manifest.json` -> `False`
- o manifesto só é criado no workflow de CD (`.github/workflows/cd.yml:280-313`)

Motivo para bloquear:

- o pacote local não fica preso a um SHA imutável, reduzindo rastreabilidade e reprodutibilidade do release.

### 7. A leitura consolidada dos ciclos 4, 5 e 6 ainda aponta maturidade incompleta do produto

Evidência:

- `audit/cycle4_execution_summary.md` ainda deixa frontend com lint vermelho, dívida ampla de `@ts-nocheck` e ausência de prova E2E auth/tenant completa.
- `audit/cycle5_execution_summary.md` conclui que nenhum dos 15 agentes executivos atingiu maturidade `operacional`.
- `audit/cycle6_execution_summary.md` conclui que a prontidão comercial é apenas `operacional limitada`.

Motivo para bloquear:

- mesmo que o pipeline de release estivesse perfeito, a leitura consolidada do produto continua abaixo do nível esperado para um go-live amplo e honesto.

## Riscos finais toleráveis

Os itens abaixo reduzem excelência e maturidade, mas não são a principal razão do parecer `não apto`:

- versões `0.0.0` e `0.1.0` em pacotes fora do núcleo direto da release, desde que o escopo oficial continue explícito;
- SBOM limitado a inventário de dependências, sem proveniência completa de build e imagens;
- descompasso entre os nomes de arquivos-base pedidos no prompt e os nomes reais da área `audit/`, com parte dos ciclos reais existindo sob nomenclatura diferente;
- preservação de artefatos históricos antigos, desde que não sejam usados como prova única de pronto.

## O que impede lançamento agora

- typecheck vermelho
- lint vermelho
- build vermelho
- scorecard de release vermelho
- backup/DR vermelhos
- fluxo de produção inseguro
- checksums inconsistentes
- tag semântica ausente
- source manifest ausente no bundle local

## O que apenas reduz excelência

- SBOM sem proveniência forte
- versionamento heterogêneo em pacotes satélite/internos
- organização documental inconsistente entre prompt e workspace

## Condição mínima para reavaliar o parecer

Reabrir avaliação de go-live somente quando houver, no mesmo HEAD:

- `pnpm typecheck` verde
- `pnpm lint` verde
- `pnpm build` verde
- `pnpm release:scorecard` verde com backup e DR reais
- workflow de CD reordenado para bloquear deploy antes de smoke/E2E/rollback
- `v1.0.0` materializada em tag Git real
- `source-manifest.json` incluído no pacote local ou gerado por etapa equivalente verificável
- correção do `checksums-manifest.sha256`

## Parecer honesto

O repositório mostra esforço sério de governança, evidência e release engineering, mas isso ainda não se traduz em um go-live tecnicamente defensável. O estado atual é de **não apto**.

