# Environment Parity

- Refreshed at: 2026-04-10T13:36:49.661Z
- Source of truth: `auditor-prime-2026-04-10` evidence refresh over the current HEAD.

## Runtime Surfaces

- Dockerfiles present: 3/3 (`apps/api/Dockerfile`, `apps/web/Dockerfile`, `apps/worker/Dockerfile`)
- Compose surfaces present: 2/2 (`docker-compose.yml`, `docker-compose.prod.yml`)
- Cloud Run manifest: present (`infra/cloudrun/service.yaml`)
- Monitoring stack refs: `infra/monitoring/prometheus.yml`, `infra/monitoring/alert.rules.yml`, `infra/monitoring/grafana-dashboard.json`

## Release Preflight Evidence

- Staging preflight: PASS (`artifacts/release/staging-preflight-summary.json`)
- Production preflight: PASS (`artifacts/release/production-preflight-summary.json`)
- Sealed env files: 2/2 (`ops/release/sealed/.env.staging.sealed`, `ops/release/sealed/.env.production.sealed`)

## Parity Snapshot

| Surface | Dev | Staging | Production | Evidence |
| --- | --- | --- | --- | --- |
| API | containerized | preflight ok | preflight ok | `apps/api/Dockerfile`, `artifacts/release/staging-preflight-summary.json`, `artifacts/release/production-preflight-summary.json` |
| Web | containerized | preflight ok | preflight ok | `apps/web/Dockerfile`, `artifacts/release/staging-preflight-summary.json`, `artifacts/release/production-preflight-summary.json` |
| Worker | containerized | preflight ok | preflight ok | `apps/worker/Dockerfile`, `artifacts/release/staging-preflight-summary.json`, `artifacts/release/production-preflight-summary.json` |

## Known Gaps

- Kubernetes manifests: present.
- Runtime parity is documented, but local proof still depends on machine-specific inputs because `DATABASE_URL is not configured on this runner`.
- This snapshot is documentation-backed; it does not replace live staging/prod smoke execution beyond the recorded preflight summaries.

