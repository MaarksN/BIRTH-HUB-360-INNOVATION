# Seed Profiles

## Profiles
- `safe`: non-destructive baseline for local development. Internally this reuses the `development` seed profile.
- `smoke`: minimal tenant, users, workflow, billing, and support artifacts for release checks.
- `ci`: same minimal footprint as `smoke`, used automatically in `test:core` and `test:isolation`.
- `staging`: anonymized tenants derived from the development baseline.
- `destructive`: legacy full baseline that wipes the database before seeding. This mode is blocked unless you pass both `--mode=destructive` and `ALLOW_DESTRUCTIVE_SEED=true`.

## Commands
- `pnpm --filter @birthub/database db:seed`
- `pnpm --filter @birthub/database db:seed:safe`
- `pnpm --filter @birthub/database db:seed:smoke`
- `pnpm --filter @birthub/database db:seed:ci`
- `pnpm --filter @birthub/database db:seed:staging`
- `ALLOW_DESTRUCTIVE_SEED=true pnpm --filter @birthub/database db:seed:destructive`

PowerShell destructive example:
- ``$env:ALLOW_DESTRUCTIVE_SEED='true'; pnpm --filter @birthub/database db:seed:destructive``

Behavior summary:
- `db:seed` defaults to the `safe` profile and does not wipe the database.
- `db:seed:safe`, `db:seed:ci`, `db:seed:smoke`, and `db:seed:staging` use the non-destructive runtime.
- `db:seed:destructive` only runs when both the destructive mode flag and `ALLOW_DESTRUCTIVE_SEED=true` are present.

## Required data by environment
- Safe/Development: plans, organizations, memberships, sessions, agents, workflows, customers, billing, quota, invites, notifications, and signing secrets without an implicit wipe.
- CI/Smoke: one tenant with owner/member, one agent, two workflows, one subscription, and support artifacts.
- Staging: anonymized tenants, anonymized users, billing catalog, support artifacts, and the same tenant-isolation guarantees as development.
- Destructive: the legacy full baseline, intended only for controlled local resets.

## Runtime contract
- `packages/database/prisma/seed.ts` owns the seed lifecycle.
- The seed runtime creates exactly one `PrismaClient`, injects it into the selected seed path, and always disconnects it on success or failure.
- Legacy destructive helpers under `prisma/seed/*` are only used by the destructive runtime path.

## Non-destructive contract
- Seeds must use `upsert`, deterministic identifiers, or existence checks.
- Seeds must not require `db:reset` to be safe.
- Each domain seed (`seed-tenants`, `seed-users`, `seed-agents`, `seed-workflows`, `seed-billing`, `seed-support`) can run independently because it recreates its own prerequisites.

## Destructive contract
- The destructive runtime is intentionally separate from the safe runtime.
- It is not the default entrypoint.
- It requires both:
  - `--profile=destructive --mode=destructive`
  - `ALLOW_DESTRUCTIVE_SEED=true`
