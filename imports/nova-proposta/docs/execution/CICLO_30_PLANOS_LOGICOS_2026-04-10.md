# Ciclo - 30 Planos Logicos (2026-04-10)

## Objetivo do ciclo

Executar, em um unico lote, os proximos 10 planos logicos da Fase 5 concentrados em resiliência operacional: health de backup, drill de disaster recovery, agregação de readiness, integração ao scorecard e rastreabilidade honesta do bloco de rollback/restore.

## Itens do relatorio atacados

- [x] endurecer o health check de backups
- [x] impedir falso positivo de backup gerado pelo proprio artefato de health
- [x] endurecer o registrador de drill de DR com metadados auditaveis
- [x] preservar a atualizacao de `artifacts/dr/latest-drill.json` na trilha de DR
- [x] criar relatorio agregado de readiness de disaster recovery
- [x] separar backup health, rollback evidence e drill de DR no release scorecard
- [x] expor comandos operacionais novos no `package.json`
- [x] atualizar runbooks e processo de release scorecard
- [x] alinhar o refresh soberano de evidencias ao novo report de DR
- [x] registrar a consolidacao real de resiliência na rastreabilidade F3-F5

## Leitura do estado atual

- O repositório já tinha scorecard, mutação focal verde e gate regressivo de dead code, mas a trilha de resiliência ainda era opaca e pouco acionável.
- `scripts/ops/check-backup-health.ts` falhava por diretório ausente e podia produzir falso verde quando seus próprios artefatos eram lidos como backup.
- `scripts/ops/record-disaster-recovery-drill.ts` tinha deriva entre formatos e não garantia metadados suficientes para auditoria de owner, cenário e evidências anexas.
- O `release-scorecard` tratava disaster recovery como um gate único, o que escondia se o problema real estava em backup ausente, rollback rehearsal inexistente ou drill insuficiente.
- Havia mudanças locais em `apps/api/src/modules/dashboard`, `privacy` e `workflows`; este lote foi isolado em `scripts/`, `docs/` e `artifacts/` para não conflitar com essa outra frente.

## Decisoes arquiteturais

- Separar o bloco operacional em três sinais independentes: `backup health`, `rollback evidence` e `disaster recovery drill`.
- Publicar um relatório agregado em `artifacts/dr/readiness-report.json` e `docs/evidence/disaster-recovery-report.md`, em vez de depender só de snapshots avulsos.
- Tratar artefatos legados de drill como `insufficient for auditability`, não como sucesso e nem como ausência absoluta.
- Manter a atualização de `artifacts/dr/latest-drill.json`, mas subordinada ao relatório agregado quando ele existir.
- Não tocar a área de `apps/api` que já estava modificada no workspace, para preservar a colaboração com a outra trilha ativa.

## Plano executavel

- passo 1: refatorar `scripts/ops/check-backup-health.ts`
- passo 2: ignorar artefatos de health/drill ao procurar backups reais
- passo 3: refatorar `scripts/ops/record-disaster-recovery-drill.ts`
- passo 4: preservar a escrita de `latest-drill.json`
- passo 5: criar `scripts/ops/generate-disaster-recovery-report.ts`
- passo 6: adicionar testes de scripts operacionais
- passo 7: expor scripts novos em `package.json`
- passo 8: integrar os novos sinais ao `scripts/ci/release-scorecard.mjs`
- passo 9: atualizar runbooks e docs de release/resiliência
- passo 10: regenerar scorecard, report de DR e snapshots auxiliares

## Arquivos impactados

- criar:
  - `scripts/ops/generate-disaster-recovery-report.ts`
  - `scripts/ops/check-backup-health.test.ts`
  - `scripts/ops/record-disaster-recovery-drill.test.ts`
  - `scripts/ops/generate-disaster-recovery-report.test.ts`
  - `docs/execution/CICLO_30_PLANOS_LOGICOS_2026-04-10.md`
- alterar:
  - `scripts/ops/check-backup-health.ts`
  - `scripts/ops/record-disaster-recovery-drill.ts`
  - `scripts/ci/release-scorecard.mjs`
  - `scripts/audit/prime-refresh-evidence.mjs`
  - `package.json`
  - `docs/processes/RELEASE_SCORECARD.md`
  - `docs/release/release-process.md`
  - `docs/release/production-preflight-inventory.md`
  - `docs/runbooks/db-backup-restore.md`
  - `docs/runbooks/disaster-recovery.md`
  - `docs/README.md`
  - `docs/index.md`
  - `docs/execution/CICLO_F3_F5_RASTREABILIDADE_2026-04-08.md`
  - `artifacts/backups/backup-health.json`
  - `artifacts/backups/backup-health.txt`
  - `artifacts/dr/readiness-report.json`
  - `docs/evidence/disaster-recovery-report.md`
  - `artifacts/release/scorecard.md`
  - `artifacts/release/scorecard.json`
  - `artifacts/dr/latest-drill.json`
- remover:
  - nenhum

## Checklist de implementacao

- [ ] migrations
- [ ] rotas
- [x] servicos
- [x] validacoes
- [ ] UI
- [ ] loading/error/empty
- [x] testes
- [x] docs

## Implementacao

- `scripts/ops/check-backup-health.ts` passou a produzir relatório estruturado mesmo com diretório ausente e deixou de contar `backup-health.*` e `drill-rto-rpo.*` como backup válido.
- `scripts/ops/record-disaster-recovery-drill.ts` foi consolidado num formato auditável, com owner, cenário, objetivos opcionais de RTO/RPO, anexos de evidência e snapshot derivado para `artifacts/dr/latest-drill.json`.
- `scripts/ops/generate-disaster-recovery-report.ts` passou a agregar backup health, rollback evidence e drill em um único relatório legível por humanos e automações.
- `scripts/ci/release-scorecard.mjs` agora trata `Backup health`, `Rollback evidence` e `Disaster recovery drill` como gates distintos.
- `scripts/audit/prime-refresh-evidence.mjs` passou a priorizar o relatório agregado de DR para não promover falso verde quando existir drill legado insuficiente.
- Os runbooks e o processo de release agora apontam para os comandos `pnpm ops:backup:health`, `pnpm ops:dr:record` e `pnpm ops:dr:report`.

## Validacao

### Local

- [x] validacao local concluida

Comandos executados:

```bash
node --import tsx --test scripts/ops/check-backup-health.test.ts scripts/ops/record-disaster-recovery-drill.test.ts scripts/ops/generate-disaster-recovery-report.test.ts
node --import tsx scripts/ops/check-backup-health.ts
node --import tsx scripts/ops/generate-disaster-recovery-report.ts
node scripts/ci/release-scorecard.mjs
node scripts/audit/prime-refresh-evidence.mjs
node scripts/docs/check-doc-links.mjs
```

Resultados locais:

- Os 11 testes novos dos scripts operacionais passaram.
- `node --import tsx scripts/ops/check-backup-health.ts` gerou `artifacts/backups/backup-health.json` em `fail`, corretamente, por ausência de backup real.
- `node --import tsx scripts/ops/generate-disaster-recovery-report.ts` gerou `artifacts/dr/readiness-report.json` e `docs/evidence/disaster-recovery-report.md`, apontando dois bloqueios concretos: backup ausente e drill legado insuficiente.
- `node scripts/ci/release-scorecard.mjs` terminou em `FAIL` com score `80`, porque `Backup health` e `Disaster recovery drill` seguem vermelhos, enquanto `Rollback evidence` ficou verde.
- `node scripts/audit/prime-refresh-evidence.mjs` passou e alinhou `artifacts/dr/latest-drill.json` ao relatório agregado.
- `node scripts/docs/check-doc-links.mjs` passou com `Broken links: 0` e `Warnings: 0`.

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
