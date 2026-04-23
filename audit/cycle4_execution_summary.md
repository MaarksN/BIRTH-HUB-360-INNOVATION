# Cycle 4 - Execution Summary

Date: 2026-04-11

## Executive summary

Cycle 4 materially hardened the critical web surface in four areas:

1. auth and route protection
2. multi-tenant propagation
3. shared runtime/store boundaries
4. operational UX truthfulness

The work did not attempt cosmetic redesign. It focused on making the web behave like a real authenticated multi-tenant SaaS edge.

## Documentation baseline gap

The prompt-required baseline files were not present with the requested names:

- `audit/source_of_truth.md`
- `audit/master_backlog_revalidated.md`
- `audit/readiness_matrix.md`
- `audit/reconciliation_report.md`
- `audit/phase1_execution_summary.md`
- `audit/cycle2_execution_summary.md`
- `audit/cycle3_execution_summary.md`

Used instead:

- `audit/README.md`
- `audit/target_architecture.md`
- `audit/validation_log.md`
- `audit/auditor-prime-latest.backlog.md`

## Main delivered changes

### Auth and permissions

- added SSR auth/role guards for dashboard, admin and settings areas
- introduced `apps/web/lib/web-session.ts` as the canonical session/role parser
- removed browser bearer-token use from the session-aware client
- completed the MFA challenge flow in the login UI
- moved login to same-origin auth proxying
- expanded `/api/v1/me` so the web can reason about role and organization
- added missing backend session-revocation routes used by the web

### Multi-tenant

- standardized browser session context with tenant/user cookies
- added browser-side rewrite of allowlisted `/api/v1/*` calls to same-origin BFF
- forwarded tenant context through SSR product API calls
- forwarded tenant context through BFF/auth proxy handlers
- aligned admin impersonation with the shared browser session contract

### Runtime hardening

- reduced `@ts-nocheck` in the hardened auth/runtime slice
- updated critical settings/admin pages to use BFF paths
- pulled `profile/security` and `developers/apikeys` into the same hardened session path
- validated notification/preferences/privacy/workflow helper behavior against the new auth model
- repaired the workflow inventory helper export discovered during validation

## Files changed in the Cycle 4 hardening slice

### Web foundation and guards

- `apps/web/lib/session-context.ts`
- `apps/web/lib/bff-policy.ts`
- `apps/web/lib/auth-client.ts`
- `apps/web/lib/product-api.server.ts`
- `apps/web/lib/web-session.ts`
- `apps/web/lib/workflows.ts`
- `apps/web/app/(dashboard)/layout.tsx`
- `apps/web/app/admin/layout.tsx`
- `apps/web/app/admin/dashboard/layout.tsx`
- `apps/web/app/(dashboard)/settings/users/layout.tsx`
- `apps/web/app/(dashboard)/settings/team/layout.tsx`
- `apps/web/app/(dashboard)/settings/members/layout.tsx`

### Web auth/BFF/runtime routes

- `apps/web/app/api/bff/policy.ts`
- `apps/web/app/api/bff/[...path]/route.ts`
- `apps/web/app/api/auth/[...session]/route.ts`
- `apps/web/app/api/auth/session-actions.ts`
- `apps/web/proxy.ts`
- `apps/web/app/page.tsx`
- `apps/web/components/login-form.tsx`
- `apps/web/app/login/page.tsx`

### Web operational pages

- `apps/web/app/admin/dashboard/page.tsx`
- `apps/web/app/admin/analytics/page.tsx`
- `apps/web/app/admin/cs/page.tsx`
- `apps/web/components/dashboard-billing-gate.tsx`
- `apps/web/app/(dashboard)/settings/privacy/privacy-settings-page.data.ts`
- `apps/web/app/(dashboard)/settings/security/page.tsx`
- `apps/web/app/(dashboard)/settings/users/page.tsx`
- `apps/web/app/(dashboard)/settings/team/page.tsx`
- `apps/web/app/(dashboard)/profile/security/page.tsx`
- `apps/web/app/(dashboard)/developers/apikeys/page.tsx`

### API contract support

- `apps/api/src/app/core-business-routes.ts`
- `apps/api/src/app/auth-routes.ts`

### Updated tests

- `apps/web/tests/auth-client.test.ts`
- `apps/web/tests/auth-session-route.test.ts`
- `apps/web/tests/product-api.test.ts`
- `apps/web/tests/bff-route.test.ts`
- `apps/web/tests/bff-allowlist.test.ts`
- `apps/web/tests/login.smoke.test.ts`
- `apps/web/tests/developer-webhooks-page.test.ts`
- `apps/web/tests/notification-store.test.ts`
- `apps/web/tests/privacy-settings-page.test.ts`
- `apps/web/tests/user-preferences-store.test.ts`
- `apps/web/tests/workflows-list.test.ts`

## Metrics requested by the prompt

- `any` reduced: 0 explicit `any` removals
- `@ts-nocheck` reduced in scoped web directories (`app/components/lib/providers/stores/tests`): 156 -> 122
- net reduction of `@ts-nocheck` in scoped web directories during Cycle 4: 34 files
- remaining `@ts-nocheck` in `apps/web/{app,components,lib,providers,stores,tests}`: 122

## Critical auth gaps after Cycle 4

### Closed

- missing SSR auth guard for dashboard shell
- weak privileged-route protection
- browser bearer-token storage
- nonexistent backend routes behind session management UI
- missing role in `/api/v1/me`
- incomplete MFA login branch

### Still open

- not all privileged affordances are derived from a canonical server capability model
- no end-to-end auth regression suite

## Critical multi-tenant gaps after Cycle 4

### Closed

- inconsistent tenant propagation in hardened browser calls
- missing tenant propagation in SSR product API calls
- missing tenant propagation in BFF/auth proxying for hardened paths

### Still open

- incomplete BFF coverage for all operational pages
- several pages still use direct `${NEXT_PUBLIC_API_URL}` flows
- no e2e proof for tenant switch, impersonation and stale-tab behavior

## Top 10 remaining frontend risks

1. Broad legacy `@ts-nocheck` debt still hides compile-time regressions across the web app.
2. Not all operational pages use same-origin BFF transport yet.
3. Several privileged UI affordances still depend on local page logic instead of server-derived capabilities.
4. Session/security screens still lack action-level pending, retry and confirmation discipline.
5. Admin impersonation lacks an explicit audited return-to-original-session flow.
6. Workflow editor and other legacy pages still call direct API-base paths.
7. Web lint is still far from green.
8. API auth tests are blocked by an environment/package export issue, leaving a gap in automated backend auth evidence.
9. The requested audit baseline files do not exist with stable names, weakening traceability.
10. MFA/auth and tenant-switch flows still lack e2e proof.

## Validation status

| Command | Status |
| --- | --- |
| `pnpm --filter @birthub/web typecheck` | PASS |
| `pnpm --filter @birthub/web lint` | FAIL |
| `pnpm --filter @birthub/web build` | PASS |
| `pnpm --filter @birthub/web test` | PASS (42/42) |
| `pnpm --filter @birthub/api typecheck` | PASS |
| `pnpm --filter @birthub/api test:auth` | FAIL before test logic due `SessionAccessMode` export mismatch |

## Honest current-state assessment

The web is in a better place than it was at the start of Cycle 4. Critical auth and tenant boundaries now have real server-side enforcement and the browser no longer carries bearer state as a primary mechanism. That said, the frontend is not yet "finished" or "production-clean". It is now a partially hardened product surface sitting beside a still-large legacy surface with lint debt, `@ts-nocheck`, mixed transport patterns and missing e2e proof.

The honest label is:

- auth boundary: materially improved
- multi-tenant boundary: improved but not uniform
- runtime trustworthiness: improved
- operational UX: functional in critical paths, closer to operator-grade but not yet mature
- overall web readiness: moving from fragile to controlled, but not ready to be called fully hardened

