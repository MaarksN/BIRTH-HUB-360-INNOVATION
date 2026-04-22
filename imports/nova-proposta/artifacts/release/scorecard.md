# Release Scorecard
Generated at: 2026-04-19T16:11:43.746Z
Minimum score threshold: 100
Score: 50

Canonical go-live scope: `apps/web`, `apps/api`, `apps/worker`, `packages/database`.
Legacy and satellite surfaces stay outside the 2026-03-20 launch gate unless promoted explicitly.

| Gate | Status | Detail | Evidence |
| --- | --- | --- | --- |
| Workspace audit | PASS | Workspace contract matches the canonical core lane | `scripts/ci/workspace-audit.mjs` |
| Monorepo doctor | PASS | No critical findings in the canonical go-live scope | `scripts/ci/monorepo-doctor.mjs` |
| Security baseline report | PASS | Report present | `docs/security/security-coverage-report.md` |
| Schema migration lock | PASS | Prisma lock present | `packages/database/prisma/migrations/migration_lock.toml` |
| SLO baseline | PASS | SLO documentation present | `docs/OBSERVABILIDADE_E_SLOS.md` |
| Mutation lane | FAIL | Score 60.85% vs threshold 60 on 470 mutants | `artifacts/quality/mutation-summary.json`, `docs/evidence/mutation-report.md`, `artifacts/stryker/mutation.json` |
| Dead code regression | FAIL | Current=223, regressions=223 | `artifacts/quality/dead-code/knip-report.json`, `docs/evidence/dead-code-report.md`, `artifacts/quality/knip-baseline.json` |
| Backup health | FAIL | No backup files found in /app/artifacts/backups. | `artifacts/backups/backup-health.json`, `artifacts/dr/readiness-report.json` |
| Rollback evidence | FAIL | Missing or invalid artifacts/release/production-rollback-evidence.json. | `artifacts/release/production-rollback-evidence.json`, `artifacts/dr/readiness-report.json` |
| Disaster recovery drill | FAIL | DR drill artifact exists but is insufficient for auditability (scenario=scheduled release rehearsal, backupArtifact=artifacts/backups/backup-health.json, RTO=0m, RPO=27423m). | `artifacts/backups/drill-rto-rpo.json`, `artifacts/dr/readiness-report.json`, `docs/evidence/disaster-recovery-report.md` |
| Score threshold | FAIL | Score 50 is below minimum 100 | - |