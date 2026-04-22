# Cycle 2 - Integrations Hardening

## Overview
Hardening executed for `packages/integrations` focusing on traceability, typing optional params natively, and timeouts/retries.

## Modifications
- Fixed `exactOptionalPropertyTypes` inside `packages/integrations/src/clients/fiscal.ts` and `packages/integrations/src/clients/payments-br.ts` using `...(condition ? { field: value } : {})` correctly.
- Added `idempotencyKey` and `providerName` to the global `postJson` boundary in `packages/integrations/src/clients/http.ts`.
- Enhanced tracing via `@birthub/logger` mapping requests per vendor.
- Removed `// @ts-nocheck` recursively from all active adapters.

## Status
- Typecheck: PASS
- Lint: PASS
- Build: PASS
- Test: PASS

## Remaining Risks
1. Pagar.me integration makes assumptions about `last_transaction`.
2. ENotas integration has a basic timeout and might require robust backoffs under massive batching.

