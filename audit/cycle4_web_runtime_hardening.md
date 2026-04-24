# Cycle 4 - Web Runtime Hardening

Date: 2026-04-11

## Runtime changes completed

### Session and request boundary

- `apps/web/lib/auth-client.ts`
  - removed browser bearer-token injection
  - now sends `x-csrf-token` and `x-active-tenant`
  - rewrites allowlisted browser `/api/v1/*` calls to same-origin `/api/bff/api/v1/*`
  - preserves internal auth/BFF paths
  - is now resilient to partial/malformed `localStorage` objects

- `apps/web/lib/bff-policy.ts`
  - shared BFF allowlist for browser routing and route policy enforcement

- `apps/web/lib/product-api.server.ts`
  - forwards cookie-backed tenant context for SSR calls
  - exposes `ProductApiError`

- `apps/web/lib/web-session.ts`
  - canonical parser for `/api/v1/me`
  - minimum role enforcement for SSR layouts

### BFF and route protection

- `apps/web/app/api/bff/policy.ts`
  - allowlist expanded for critical operational routes

- `apps/web/app/api/bff/[...path]/route.ts`
  - forwards `cookie`, `authorization`, `x-active-tenant`, `x-csrf-token`, request ids
  - preserves `set-cookie` and `content-type`

- `apps/web/app/api/auth/[...session]/route.ts`
  - same-origin auth proxy hardened with header/cookie forwarding
  - covers login, logout, refresh and MFA verification

### Critical screens and stores

- `apps/web/app/(dashboard)/settings/security/page.tsx`
  - real session list + revoke + logout-all through BFF

- `apps/web/app/(dashboard)/profile/security/page.tsx`
  - MFA setup/enable now use the same session-aware, same-origin path

- `apps/web/app/(dashboard)/developers/apikeys/page.tsx`
  - API key CRUD/rotate/revoke now use the same session-aware, same-origin path
  - destructive revoke now has explicit confirmation

- `apps/web/app/(dashboard)/settings/users/page.tsx`
  - user administration moved to BFF

- `apps/web/app/(dashboard)/settings/team/page.tsx`
  - role management moved to BFF

- `apps/web/app/admin/dashboard/page.tsx`
  - analytics/admin calls moved to BFF
  - impersonation now uses shared session persistence

- `apps/web/stores/notification-store.ts`
- `apps/web/stores/user-preferences-store.ts`
  - validated against the new cookie-first session model
  - `@ts-nocheck` removed

### Functional repair discovered during validation

- `apps/web/lib/workflows.ts`
  - restored exported workflow inventory helper used by `tests/workflows-list.test.ts`

## Type/runtime debt movement

- explicit `any` removed in Cycle 4: 0
  - the dominant debt here was not explicit `any`
  - it was hidden typing debt under `@ts-nocheck` and untyped payload boundaries
- `@ts-nocheck` reduced in scoped web directories (`app/components/lib/providers/stores/tests`): 156 -> 122
- effective reduction in scoped web directories during Cycle 4: 34 files
- remaining `@ts-nocheck` count in `apps/web/{app,components,lib,providers,stores,tests}`: 122

## Validation results

| Command | Status | Notes |
| --- | --- | --- |
| `pnpm --filter @birthub/web typecheck` | PASS | No TS regressions in the hardened web package. |
| `pnpm --filter @birthub/web build` | PASS | Next build completed and emitted the guarded routes. |
| `pnpm --filter @birthub/web test` | PASS | 42/42 tests passing after updating auth/BFF expectations and MFA auth proxy coverage. |
| `pnpm --filter @birthub/web lint` | FAIL | 151 errors, 139 warnings. Most errors are still pre-existing `@ts-nocheck` and unsafe/complex legacy files outside the narrowed Cycle 4 write scope. |
| `pnpm --filter @birthub/api typecheck` | PASS | API contract changes compile cleanly. |
| `pnpm --filter @birthub/api test:auth` | FAIL | Blocked by `SessionAccessMode` export mismatch in `@birthub/database` under the current environment. |

## Environment caveat

All commands emitted the same engine warning:

- expected Node: `>=24 <25`
- actual Node: `v25.9.0`

This did not block web typecheck/build/tests, but it does reduce trust in any failing API auth test result.

## Runtime verdict

Cycle 4 clearly hardened the runtime boundary. The web now behaves like a sessioned SaaS frontend in the critical auth paths instead of a thin client carrying bearer state in browser storage. The remaining blocker to calling this runtime mature is not correctness of the new pieces; it is the amount of untouched legacy surface still hidden behind `@ts-nocheck` and inconsistent transport patterns.

