# Active Product Capabilities

Status date: 2026-04-15

## Objective

Provide a single operational reference for which product capabilities are actively supported in runtime and which preserved domains remain disabled by default.

## Canonical runtime sources

- Capability flags: `packages/config/src/product-capabilities.ts`
- Runtime classification and CI governance: `scripts/ci/runtime-governance-policy.json`
- Mounted API runtime:
- `apps/api/src/app.ts`
- `apps/api/src/app/core.ts`
- `apps/api/src/app/module-routes.ts`
- API capability gating inside the mounted runtime:
- `apps/api/src/modules/dashboard/router.ts`
- `apps/api/src/modules/privacy/router.ts`
- Web gating:
- `apps/web/lib/product-capabilities.ts`
- `apps/web/lib/bff-policy.ts`
- `apps/web/app/(dashboard)/settings/privacy/page.tsx`
- `apps/web/app/(dashboard)/patients/page.tsx`
- `apps/web/app/(dashboard)/patients/[id]/page.tsx`
- `apps/web/app/(dashboard)/patients/[id]/appointments/page.tsx`
- `apps/web/app/(dashboard)/appointments/page.tsx`

## Preserved runtime surfaces outside the mounted API

- `apps/api/src/modules/clinical/router.ts`
  - classified as `not-mounted/parked`
- `apps/api/src/modules/fhir/router.ts`
  - classified as `not-mounted/parked`

These preserved surfaces remain part of the repository and capability model, but they are not part of the canonical mounted API runtime unless a later cycle explicitly promotes them.

## Default capability flags

- `BIRTHUB_ENABLE_CLINICAL_WORKSPACE=false`
- `BIRTHUB_ENABLE_FHIR_FACADE=false`
- `BIRTHUB_ENABLE_PRIVACY_ADVANCED=false`
- `BIRTHUB_ENABLE_PRIVACY_SELF_SERVICE=true`
- `NEXT_PUBLIC_ENABLE_CLINICAL_WORKSPACE=false`
- `NEXT_PUBLIC_ENABLE_FHIR_FACADE=false`
- `NEXT_PUBLIC_ENABLE_PRIVACY_ADVANCED=false`
- `NEXT_PUBLIC_ENABLE_PRIVACY_SELF_SERVICE=true`

## Active and supported now

- Operational dashboard, workflows, billing, analytics, notifications and Sales OS
- Self-service privacy:
- `GET /api/v1/privacy/export`
- `POST /api/v1/privacy/delete-account`
- Web privacy page in self-service mode
- Cookie consent and legal/privacy navigation

## Preserved but disabled by default

- Clinical workspace UI and API
- FHIR facade
- Advanced privacy consent management
- Retention policy management
- Manual or automated advanced retention execution
- Clinical dashboard summary

## Operational rules

1. Do not treat preserved domains as part of the default product path unless the corresponding flags are explicitly re-enabled.
2. Do not treat `clinical` or `fhir` as mounted API surfaces while they remain classified as `not-mounted/parked` in `scripts/ci/runtime-governance-policy.json`.
3. Do not add new primary navigation, BFF allowlist entries, main dashboard fetches, smoke tests, or runbooks that assume clinical, FHIR, or advanced privacy by default.
4. If a preserved domain is reintroduced, schema support, runtime delegates, navigation, tests, documentation, and runtime classification must be restored together in the same lane.
5. Historical cycle reports, evidence, ADRs, and audit artifacts may describe older states and must not override this document for current operational decisions.

## Automated governance

- CI check: `pnpm ci:active-product-capabilities`
- CI check: `pnpm ci:default-e2e-surface-freeze`
- CI check: `pnpm ci:runtime-governance`
- Protected operational docs must reference this file before describing runtime product boundaries.
- Protected operational docs must not use clinical, FHIR, or advanced-privacy runtime examples as if they were active by default.
- Default Playwright lanes must keep preserved domains opt-in through explicit capability gating.

## Related references

- `docs/service-catalog.md`
- `docs/LGPD_OPERACIONAL.md`
- `docs/tenant-deletion-policy.md`
- `audit/cycle7_domain_alignment_disablement.md`
