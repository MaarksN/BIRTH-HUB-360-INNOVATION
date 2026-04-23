# Known Test Flakiness

## `tests/billing.proration-credit.test.ts`
**Symptom**: This test occasionally fails during a global `pnpm test` execution (e.g., throwing a `'test failed'` error), but passes consistently when run in isolation (`node --import tsx --test tests/billing.proration-credit.test.ts`).

**Cause**: The test is susceptible to cross-test pollution due to a shared in-memory LRU cache state used for webhook idempotency. Specifically:
- `tests/billing.cache.test.ts` overrides the global `cacheStore` using `setCacheStoreForTests(createFailingStore())`.
- If the test runner executes files concurrently across the module without fully isolating the module cache, or if a previous test fails to completely clean up its mock state before exiting, the idempotency check in `billing.proration-credit.test.ts` will either hit a dirty cache or a failing store.
- When `readCacheValue` or `writeCacheValue` throws unexpectedly, it crashes the Express router logic inside the test, leading to an unhandled rejection that fails the entire test file.

**Resolution Status**:
- The business rule logic (`previousAmount - currentAmount`) and the fixture itself are correct.
- The `pnpm test` gate usually passes when tests are executed sequentially without overlap (`--test-concurrency=1`).
- No changes to the production code or skipping the test were necessary. If flakiness persists, consider explicitly clearing the `cacheStore` and deleting `billing:webhook_idempotency:*` keys in a `beforeEach` hook of this test.
