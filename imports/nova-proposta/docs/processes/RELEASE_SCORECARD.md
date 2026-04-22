# Release Scorecard

Comando: `pnpm release:scorecard`

## Escopo atual do scorecard

- gate canonico de go-live: `apps/web`, `apps/api`, `apps/worker`, `packages/database`
- superficies legadas ou satelites ficam fora do corte de `2026-03-20`, salvo promocao explicita

## Gates atuais

- workspace audit
- monorepo doctor
- baseline de seguranca
- lock de migrations Prisma
- baseline de SLO documentada
- lane focal de mutacao a partir de `artifacts/stryker/mutation.json`
- gate regressivo de dead code a partir de `artifacts/quality/dead-code/knip-report.json`
- health de backups a partir de `artifacts/backups/backup-health.json`
- evidencia de rollback a partir de `artifacts/release/production-rollback-evidence.json`
- drill de disaster recovery a partir de `artifacts/backups/drill-rto-rpo.json`

## Evidencias materializadas

- `pnpm quality:mutation:evidence` gera `artifacts/quality/mutation-summary.json` e `docs/evidence/mutation-report.md`.
- `pnpm quality:dead-code` atualiza `artifacts/quality/dead-code/knip-report.json` e `docs/evidence/dead-code-report.md`.
- `pnpm ops:backup:health` gera `artifacts/backups/backup-health.json` e `artifacts/backups/backup-health.txt`.
- `pnpm ops:dr:report` gera `artifacts/dr/readiness-report.json` e `docs/evidence/disaster-recovery-report.md`.
- `pnpm release:scorecard` agora publica `artifacts/release/scorecard.md` e `artifacts/release/scorecard.json`.

## Observacao

O scorecard nao substitui o gate completo de lancamento. Antes do go-live tambem devem ficar verdes:

- `pnpm install --frozen-lockfile`
- `pnpm lint:core`
- `pnpm typecheck:core`
- `pnpm test:core`
- `pnpm test:isolation`
- `pnpm build:core`
- `pnpm test:e2e:release`
- `pnpm release:preflight:staging`
- `pnpm release:preflight:production`

Saidas:

- `artifacts/release/scorecard.md`
- `artifacts/release/scorecard.json`
- `artifacts/dr/readiness-report.json`
- `docs/evidence/disaster-recovery-report.md`
