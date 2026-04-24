# Privacy, Data Retention, and PII Management (LGPD/CCPA)

This document describes the existing capabilities for data retention and PII management within BirthHub 360 to support LGPD and CCPA compliance.

## Existing Capabilities

1. **Automated Retention Sweep:**
   The API includes a privacy retention scheduler (`apps/api/src/modules/privacy/retention-scheduler.ts`) that periodically evaluates and executes data retention policies across tenants. The retention limits are configurable by data category (e.g. Activity, Diagnostics) and execution actions include anonymization or deletion.

2. **Self-Service Export and Deletion:**
   The workspace exposes endpoints for generating data exports (`/export`) and removing data (`/retention/run` in `DRY_RUN` or destructive mode) accessible by workspace Owners (`RequireRole(Role.OWNER)`).

3. **PII Masking & Scoping (Worker):**
   Within worker tasks (e.g., `apps/worker/src/jobs/userCleanup.ts`), there is support for anonymizing stale suspended users. This removes PII identifiers from users that have been inactive and suspended past the grace period.

## Supported Data Categories

- System Activity
- Diagnostics
- Billing
- Conversation
- Clinical (Protected optionally, requiring strict controls)

## Gaps & Recommendations

- The framework for running privacy sweeps exists and is executed securely within the tenant boundary (`tenantContextMiddleware`), however, relying heavily on `schema-dependent` configuration limits adoption if a particular deployment removes those tables.
- While exports are functional, there is a risk of synchronous generation timing out for extremely large tenants. It's recommended to eventually move PII export generation to a queue-based background job.
- Full "Right to be Forgotten" cascading deletes should be carefully audited to ensure CRM integrations do not re-hydrate deleted user records.
