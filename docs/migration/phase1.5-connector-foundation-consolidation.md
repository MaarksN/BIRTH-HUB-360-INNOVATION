# Phase 1.5 Connector Foundation Consolidation

Date: 2026-04-21

## Goal

Conclude the connector foundation hardening pass before Phase 2 by removing structural ambiguity from OAuth, tenancy, provider cataloging, runtime ownership and webhook ingestion.

This phase was executed after the Phase 1 and Phase 1.1 foundation work and is intended to leave the monorepo in a functional, consistent and testable state for Security and Compliance hardening.

## What Was Consolidated

### OAuth contract

- Standardized connector credentials to `accessToken` and `refreshToken`.
- Removed mixed handling of `access_token` and `accessToken` across API, worker, runtime and integration paths.
- Implemented real OAuth authorization code exchange in the callback flow.
- Prevented connectors from being marked active without a valid persisted token.
- Aligned connector account lookup and persistence behavior to the same tenant-aware contract.

### Multi-tenancy baseline

- Introduced tenant scoping helpers for Prisma access.
- Added a Prisma extension path that scopes supported operations using the active tenant context.
- Added targeted ESLint protection for unscoped tenant-sensitive connector queries.
- Audited and corrected insecure connector-related reads and writes.
- Added isolation coverage for tenant scoping behavior.

### Provider catalog truthfulness

- Reconciled the provider catalog against the runtime that actually exists in `connectors-core`.
- Restricted `implemented` to providers with a real runtime execution path.
- Reclassified non-runtime entries to `client_only` or `planned`.
- Updated dashboard behavior so non-runtime providers do not show misleading health or execution state.

### Runtime ownership

- Consolidated connector runtime ownership around `packages/connectors-core`.
- Removed the legacy worker connector runtime file and replaced it with a workflow adapter that delegates to the shared runtime.
- Moved missing HubSpot company upsert behavior into `connectors-core`.
- Kept API and worker imports aligned to the shared runtime source of truth.

### Webhook ingestion

- Unified webhook ingestion on Node/TypeScript.
- Removed the duplicate Python receiver stack.
- Added local signature validation for Stripe and Svix-compatible deliveries.
- Added idempotency handling and safe retry behavior in the Node receiver.
- Preserved forward compatibility for internal API delegation with explicit idempotency keys and service token forwarding.

## What Was Removed

- Legacy worker runtime entrypoint:
  - `apps/worker/src/integrations/connectors.runtime.ts`
- Python webhook receiver stack:
  - `apps/webhook-receiver/main.py`
  - `apps/webhook-receiver/requirements.txt`
  - `apps/webhook-receiver/tests/test_main.py`
- Connector activation behavior that promoted accounts to active state without a valid OAuth credential.
- Catalog states that implied runtime support for providers without a real runtime pipeline.

## Remaining Risks

- Multi-tenancy enforcement is now materially stronger in the connector surface, but the custom ESLint rule is still targeted rather than monorepo-wide. Expanding it safely across the whole codebase remains future work.
- The Prisma tenant extension covers the current supported operations, but any future raw SQL or newly introduced models still require the same discipline and review.
- The webhook receiver now validates signatures and idempotency in Node, but production rollout still depends on correct runtime secrets and internal API token configuration in each environment.
- Provider status is now aligned with runtime reality, but planned and client-only providers still need explicit rollout rules to avoid premature UI exposure in future product surfaces.
- Test stability on Windows required serializing the heaviest Node test runners. That is safe, but it signals that memory pressure should still be watched as the suites grow.

## Impact On Real Connectors

### Slack

- Remains on the shared runtime path.
- No regression introduced in runtime ownership or provider catalog exposure.
- Validation kept worker and integration tests green.

### Stripe

- Remains implemented and visible as a real runtime provider.
- Webhook ingestion is now stricter: local signature validation, idempotency keys and retry-safe handling are part of the Node receiver.
- Validation kept runtime and webhook tests green.

### Zenvia

- Remains implemented and visible as a real runtime provider.
- Runtime consolidation did not remove its execution path.
- Validation kept worker and integration tests green.

### HubSpot

- Now reflects real runtime support in both catalog and execution paths.
- OAuth activation depends on a real exchanged token.
- Company upsert runtime behavior was moved into `connectors-core` so worker execution no longer depends on the removed legacy runtime.

### Omie

- Remains implemented in the catalog and in the shared runtime path.
- Runtime consolidation preserved existing worker behavior and tests.
- No regression was introduced by the runtime unification work.

## Validation

Final phase validation completed successfully with:

- `pnpm typecheck`
- `pnpm test`
- `pnpm lint`

## Phase 2 Readiness

The monorepo now has a single connector runtime authority, a truthful provider catalog, a unified webhook receiver and a materially safer OAuth and tenant baseline.

Phase 2 can now focus on Security and Compliance work without carrying the structural ambiguity that previously made those controls unreliable.
