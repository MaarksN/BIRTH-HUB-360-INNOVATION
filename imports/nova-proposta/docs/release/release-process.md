# Release Process

## Fonte canônica

- Workflow: `.github/workflows/cd.yml`
- Gates locais: `scripts/release/preflight-env.ts`, `scripts/release/verify-rollback-evidence.ts`, `scripts/ops/check-backup-health.ts`, `scripts/ops/generate-disaster-recovery-report.ts`
- Materialização local: `scripts/release/generate-sbom.mjs`, `scripts/release/materialize-release.ts`

## Pipeline

1. `CI` aprova o commit em `main`.
2. `staging-preflight` valida configuração de staging.
3. `release-sbom` gera o SBOM (`artifacts/sbom/bom.xml`) e materializa catálogo/checksums.
4. `production-preflight` valida configuração de produção usando `ops/release/sealed/.env.production.sealed` (execução falha se o arquivo não estiver presente ou se variáveis obrigatórias estiverem ausentes).
5. `release-smoke-gate` executa smoke do core canônico.
6. `release-e2e-gate` executa E2E de release.
7. `backup-health-gate` valida frescor e presença do backup operacional.
8. `rollback-rehearsal-evidence-gate` exige prova verificável de rollback.
9. `dr-readiness-gate` agrega backup health, rollback evidence e drill de DR.
10. `deploy-production` dispara o hook de produção.

> O preflight de produção exige um arquivo selado em `ops/release/sealed/.env.production.sealed` passado via `--env-file`. A execução falha quando o arquivo está ausente ou inacessível.

## Evidências obrigatórias

- `artifacts/release/staging-preflight-summary.json`
- `artifacts/release/production-preflight-summary.json`
- `artifacts/release/smoke-summary.json`
- `artifacts/backups/backup-health.json`
- `artifacts/release/production-rollback-evidence.json`
- `artifacts/backups/drill-rto-rpo.json`
- `artifacts/dr/readiness-report.json`
- `artifacts/release/checksums-manifest.sha256`
- `artifacts/release/release-artifact-catalog.json`

## Artefatos esperados

- `releases/manifests/release_artifact_catalog.md`
- `releases/notes/v1.0.0.md`
- `CHANGELOG.md`
- `docs/release/2026-03-20-go-live-runbook.md`
- `scripts/ops/rollback-release.sh`
- `docs/release/reproducible-build.md`
