# Phase 1.1 Foundation Stabilization

Date: 2026-04-20

## Goal

Stabilize the Phase 1 monorepo foundation by resolving the smallest set of internal workspace dependencies required by the migrated apps and packages.

This phase does not start Phase 2 and does not migrate agent packs, agent runtime services, registry packages, voice services, legacy billing, audit output or generated artifacts.

## Broken Imports Found

| Package | Import count | Consumers | Decision |
| --- | ---: | --- | --- |
| `@birthub/agents-core` | 35 | `apps/api`, `apps/worker` | Migrate the runtime/core source only. |
| `@birthub/agents-core/policy` | 3 | `apps/worker` | Covered by the minimal `agents-core` migration. |
| `@birthub/agents-core/tools` | 6 | `apps/worker` | Covered by the minimal `agents-core` migration. |
| `@birthub/contracts` | 1 | `apps/worker` | Migrate the full tiny package. |
| `@birthub/testing` | 3 | Worker integration tests | Migrate only source helpers needed by existing tests. |

## Migrated

### `packages/agents-core`

Migrated:

- `package.json`
- `tsconfig.json`
- `src/**/*.ts`

Excluded:

- `src/__tests__/**`
- `*.test.ts`
- generated `*.d.ts`
- generated `*.d.ts.map`
- docs or generated outputs

Reason: `apps/api` and `apps/worker` use real manifest, catalog, policy and tool behavior from this package. A fake stub would hide core runtime problems and create more risk than migrating this small dependency. The package has no internal `@birthub/*` runtime dependencies and depends only on `zod`.

### `packages/contracts`

Migrated complete package:

- `package.json`
- `tsconfig.json`
- `src/index.ts`

Reason: package is tiny and type-only for the current migrated surface.

### `packages/testing`

Migrated:

- `package.json`
- `tsconfig.json`
- `src/agent-execution.factory.ts`
- `src/factories.ts`
- `src/index.ts`
- `src/test-db.ts`

Excluded:

- package self-tests
- generated declarations

Reason: migrated worker integration tests import its database provisioning helpers. The package depends only on `@birthub/database`, already present from Phase 1.

## Manifest And TS Config Changes

- `apps/api` now depends on `@birthub/agents-core`.
- `apps/worker` now depends on `@birthub/agents-core`, `@birthub/contracts` and `@birthub/testing`.
- `tsconfig.base.json` now maps:
  - `@birthub/agents-core`
  - `@birthub/agents-core/tools`
  - `@birthub/agents-core/policy`

## Validation

- Workspace check: `pnpm -r list --depth -1` recognizes 16 workspace packages.
- Workspace dependency check: no missing `workspace:*` or `workspace:^` references.
- Generated declaration check: only the expected explicit declarations remain:
  - `apps/web/next-env.d.ts`
  - `apps/api/src/types/redlock.d.ts`
- Partial typecheck/build graph:
  - `pnpm exec turbo run typecheck --filter=@birthub/agents-core --filter=@birthub/contracts --filter=@birthub/testing --filter=@birthub/api --filter=@birthub/worker`
  - Result: 24 successful tasks, 0 failed.

Note: dependencies were installed with `pnpm install --ignore-scripts` to enable validation without running lifecycle scripts during install. Build artifacts and generated declarations created during validation were removed afterward.

## Still Not Migrated

- `packages/agent-packs`
- `packages/agent-runtime`
- `packages/agents-registry`
- `apps/voice-engine`
- `apps/legacy`
- `packages/billing`
- `audit/**`
- `artifacts/**`
- `.ops/**`
- `releases/**`

## Known Risks

- Full build/typecheck may still expose application-level issues that predated this migration.
- Database RLS validation remains a known blocker.
- Prisma schema drift remains a known blocker.
- Refresh session durability remains a known blocker.
- Auth guardrail scripts remain outside this foundation pass.
- Webhook receiver still needs runtime validation with Redis, API URL and Svix secret configuration.

## Next Phase Guardrail

Before Phase 2, decide whether agent packs and registry should be migrated as product runtime assets or imported through a curated catalog boundary. Do not copy all agent-related directories wholesale.
