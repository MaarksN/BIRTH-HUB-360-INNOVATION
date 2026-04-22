# Phase 2.7: Omie ERP Connector Hardening

This document outlines the architectural stabilization and testing applied to the Omie ERP connector, ensuring it meets production-grade reliability standards alongside HubSpot, Slack, Stripe, and Zenvia.

## Architecture

The Omie connector implements a bi-directional sync strategy, primarily driven by scheduled syncs (via `triggerSync` / `crmSyncEvent`) rather than direct external webhooks for ingestion.

- **Outbound (API to Omie):**
  - **Adapter:** `OmieErpAdapter` (`@birthub/integrations`) handles API communication, credential mapping (App Key / App Secret), and rate limit/timeout errors.
  - **Runtime:** `runtime.ts` exposes `erp.customer.upsert` and `erp.sales-order.create` action handlers.
- **Inbound (Omie to API / Sync):**
  - **Sync Job Builder:** `buildOmieSyncJob` (`omie-sync.ts`) constructs internal connector events (`erp.customer.upsert` or `erp.sales-order.create`) from cursor payloads.
  - **Event Extraction:** `omie-events.ts` normalizes incoming payloads, resolving PT-BR field aliases (e.g., `razao_social` to `legalName`, `cnpj_cpf` to `taxId`) and extracting required identifiers.
  - **Worker:** Processes internal connector events, routing them to the appropriate runtime handler and managing idempotency/retries.

## Key Hardening Fixes

1. **Runtime Handler Registration:** The `erp.sales-order.create` handler was implemented but missing from the `createDefaultConnectorRuntime` registry. It is now properly registered, preventing `CONNECTOR_HANDLER_MISSING` errors.
2. **Error Serialization Precedence:** Legacy `error as any` type checks in `errors.ts` were shadowing correct `instanceof` checks, causing Omie auth failures (`OMIE_AUTH_FAILED`) to be generically masked as `OMIE_API_ERROR`. The legacy checks were removed.
3. **Module Identity (TSX testing):** Added `error.name` fallbacks alongside `instanceof` checks in `errors.ts` to prevent test failures caused by `tsx` loading multiple instances of the same error class in memory during test execution.
4. **Comprehensive Test Coverage:**
   - Unit tests added for `buildOmieSyncJob` (`omie-sync.test.ts`) covering all payload variations (customer-only, salesOrder-only, flat payloads, custom idempotency keys).
   - Unit tests added for payload extraction (`omie-events.test.ts`), validating strict PT-BR alias resolution and required field validation.
   - Core runtime tests (`runtime.test.ts`) updated and passing.

## Webhook Note

Unlike Stripe, HubSpot, Slack, and Zenvia, **Omie is not registered in the direct `ingestWebhook` router flow** (`service.ts`). Inbound data from Omie should follow the scheduled `triggerSync` workflow, utilizing the `crmSyncEvent` mechanism to enqueue jobs for the worker.

## Migration & Maintenance Checklist

- [x] Ensure `erp.sales-order.create` is registered in the runtime.
- [x] Validate PT-BR alias mappings in event extraction (`razao_social`, `cnpj_cpf`, `nome_fantasia`, `cidade`, `bairro`, `cep`, `itens`, `codigo_pedido_integracao`, etc.).
- [x] Confirm error deserialization accurately propagates `OMIE_AUTH_FAILED`, `OMIE_RATE_LIMIT`, and `OMIE_TIMEOUT`.
- [x] Unit test `buildOmieSyncJob` and `extractOmie*Payload` helpers.
- [ ] Implement OAuth/Credential refresh strategies if Omie introduces short-lived tokens in the future (currently relies on static App Key / App Secret).
