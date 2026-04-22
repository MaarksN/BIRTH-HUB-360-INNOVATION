# Environment Inventory

This inventory captures the supported BirthHub360 environments as of 2026-04-09.

It is documentation-backed and reflects the canonical release lane already versioned in the repository. It does not replace live smoke checks or operator sign-off.

## Canonical environments

| Environment | Purpose | Runtime lane | Configuration baseline | Evidence |
| --- | --- | --- | --- | --- |
| `local` | Developer topology for the canonical stack | `pnpm stack:canonical` with `apps/web`, `apps/api`, `apps/worker`, Postgres and Redis | `.env.example` | `docker-compose.yml`, `docs/runbooks/deploy-canonical-stack.md`, `docs/operations/environment-parity.md` |
| `staging` | Candidate validation before promotion | `GitHub Actions -> Artifact Registry -> Cloud Run` | `ops/env/.env.staging.sealed.example` plus release preflight validation | `artifacts/release/staging-preflight-summary.json`, `docs/release/release-process.md`, `docs/release/production-preflight-inventory.md` |
| `production` | Public runtime receiving promoted traffic | `GitHub Actions -> Artifact Registry -> Cloud Run` | `ops/env/.env.production.sealed.example` plus release preflight validation | `artifacts/release/production-preflight-summary.json`, `artifacts/release/smoke-summary.json`, `artifacts/release/production-rollback-evidence.json`, `docs/runbooks/deploy-canonical-stack.md` |

## Shared runtime surfaces

The same canonical application surfaces are expected across `local`, `staging` and `production`:

- `apps/web`
- `apps/api`
- `apps/worker`
- `packages/database`
- PostgreSQL and Redis as external stateful dependencies

Reference snapshot: [environment parity](environment-parity.md).

## Configuration sources

- Variable and secret catalog: [environment variables inventory](../environment-variables-inventory.md)
- Release-critical ownership and gating: [production preflight inventory](../release/production-preflight-inventory.md)
- Deploy procedure: [deploy canonical stack](../runbooks/deploy-canonical-stack.md)

## Non-canonical profile

The repository also keeps a VPS-oriented profile for controlled manual operations:

- `.env.vps.example`
- [VPS launch pack](../release/2026-03-17-vps-launch-pack.md)

This profile is useful for standalone VPS exercises, but it is not the canonical release evidence path for staging and production. The canonical lane remains `GitHub Actions -> Artifact Registry -> Cloud Run`.
