# Phase 1 Foundation Migration

Date: 2026-04-20

## Scope Migrated

Apps:

- `apps/web`
- `apps/api`
- `apps/worker`
- `apps/webhook-receiver`

Packages:

- `packages/auth`
- `packages/config`
- `packages/database`
- `packages/integrations`
- `packages/logger`
- `packages/queue`
- `packages/security`
- `packages/shared-types`
- `packages/utils`
- `packages/workflows-core`

Monorepo base:

- `.env.example`
- `eslint.config.mjs`
- `package.json`
- `pnpm-workspace.yaml`
- `prettier.config.cjs`
- `tsconfig.base.json`
- `tsconfig.json`
- `turbo.json`

## Migration Rules Applied

- Copied only source, tests, runtime configs and package manifests for the authorized Phase 1 paths.
- Kept only explicit declaration files required by source tooling:
  - `apps/web/next-env.d.ts`
  - `apps/api/src/types/redlock.d.ts`
- Excluded generated `.d.ts` and `.d.ts.map` files that mirror `.ts` sources.
- Migrated `apps/webhook-receiver` as the canonical Python runtime only:
  - `main.py`
  - `requirements.txt`
  - `tests/test_main.py`
- Excluded the legacy TypeScript webhook receiver stub.
- Reduced root package scripts to commands that do not depend on legacy `scripts/**` files that were not migrated in this phase.
- Removed workspace dependency references to packages intentionally left out of Phase 1 so installation can proceed without requiring unauthorized workspaces.

## Explicitly Ignored

- `apps/voice-engine`
- `apps/legacy`
- `packages/agents-core`
- `packages/agent-runtime`
- `packages/agents-registry`
- `packages/agent-packs`
- `packages/billing`
- `audit/**`
- `artifacts/**`
- `.ops/**`
- `releases/**`
- Generated declaration mirrors and declaration maps
- Heavy reports, logs, SBOMs, audit outputs and forensic snapshots

The existing empty placeholder directories for future areas were left untouched.

## Known Refactor Points

- `apps/api` and `apps/worker` still contain source imports from packages intentionally not migrated in Phase 1:
  - `@birthub/agents-core`
  - `@birthub/contracts`
  - `@birthub/testing`
- Build and typecheck are expected to fail until the agent/runtime contract boundary is either migrated in a later phase or isolated behind Phase 1-safe adapters.
- Multi-tenant database hardening remains incomplete until RLS validation and schema drift checks pass against a real PostgreSQL runtime.
- Refresh session durability still needs refactoring away from in-memory state.
- Auth guardrail scripts were not migrated in Phase 1, so API auth route policy checks need to be reintroduced deliberately later.
- Webhook receiver coverage and strict runtime behavior need validation with Redis, API URL and Svix secret configuration.

## Next Phase Guardrail

Do not start Phase 2 by copying all remaining packages. First decide whether the agent surface should be migrated as source packages or split behind a smaller stable contract for `apps/api` and `apps/worker`.
