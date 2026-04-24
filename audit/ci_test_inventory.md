# CI Test Inventory

**Generated:** 2026-04-02
**Repository:** PROJETO-FINAL-BIRTHUB-360-INNOVATION
**Monorepo Type:** pnpm workspace with Turbo

---

## 1. Overview

This document provides a complete inventory of all test suites, test commands, and test infrastructure in the birthub-360 monorepo.

### Workspace Structure
- **Total Packages:** 23 packages
- **Apps:** 4 (web, api, worker, voice-engine)
- **Legacy Apps:** 0
- **Shared Packages:** 19
- **Test Files:** 99 test files (.test.ts, .test.tsx, .spec.ts, .spec.tsx)

### Package Manager & Build System
- **Package Manager:** pnpm@9.1.0
- **Node Version:** 24.14.0 (from .nvmrc)
- **Build Orchestrator:** Turbo 2.8.16
- **Testing Framework:** Jest/Vitest (detected from package.json dependencies)
- **E2E Framework:** Playwright 1.58.2

---

## 2. Root-Level Test Commands

From `package.json` at repository root:

| Command | Script | Purpose |
|---------|--------|---------|
| `test` | `corepack pnpm test:core` | Run core tests |
| `test:agents:packages` | `node scripts/ci/run-pnpm.mjs -r --if-present --filter \"*-agent-worker\" run test` | Test all agent worker packages |
| `test:core` | `node scripts/ci/run-pnpm.mjs -r --if-present --filter=@birthub/web... --filter=@birthub/api... --filter=@birthub/worker... --filter=@birthub/testing... --filter=@birthub/auth... --filter=@birthub/utils... run test` | Test core packages (web, api, worker, testing, auth, utils) |
| `test:satellites` | `node scripts/ci/run-satellites.mjs test` | Test satellite packages |
| `test:workspace` | `turbo run test` | Run all tests via Turbo |
| `test:isolation` | `node scripts/ci/run-pnpm.mjs -r --if-present --filter=@birthub/api --filter=@birthub/worker run test:isolation` | Isolated integration tests for api and worker |
| `test:workflows` | `corepack pnpm --filter @birthub/workflows-core test && corepack pnpm --filter @birthub/worker test && corepack pnpm workflow:coverage` | Workflow tests + coverage |
| `test:auth` | `corepack pnpm --filter @birthub/api test:auth` | Authentication tests |
| `test:rbac` | `corepack pnpm --filter @birthub/api test:rbac` | RBAC (Role-Based Access Control) tests |
| `test:security` | `corepack pnpm --filter @birthub/api test:security` | Security tests |
| `test:e2e` | `playwright test` | E2E tests |
| `test:e2e:release` | `playwright test tests/e2e/release-master.spec.ts` | Release-specific E2E tests |
| `test:workflows:evidence` | `playwright test tests/e2e/workflow-editor-evidence.spec.ts` | Workflow editor E2E tests |
| `test:python` | `pytest apps/webhook-receiver/tests -n auto --dist loadfile` | Python webhook receiver tests |
| `test:python:integration` | `pytest apps/webhook-receiver/tests -n auto --dist loadfile` | Python integration tests |
| `test:python:coverage` | `pytest apps/webhook-receiver/tests -n auto --dist loadfile --cov=apps/webhook-receiver --cov-fail-under=80` | Python tests with coverage |
| `test:load:k6` | `k6 run scripts/load-tests/stress.js` | k6 load tests |
| `test:worker:overload` | `tsx scripts/load-tests/worker-overload.ts` | Worker overload tests |
| `test:load` | `corepack pnpm --filter @birthub/queue test:load` | Queue load tests |
| `test:db:baseline` | `node --import tsx scripts/performance/database-baseline.mjs` | Database performance baseline |
| `test:tag:unit` | `node scripts/testing/run-tagged-tests.mjs unit` | Tagged unit tests |
| `test:tag:integration` | `node scripts/testing/run-tagged-tests.mjs integration` | Tagged integration tests |
| `test:tag:slow` | `node scripts/testing/run-tagged-tests.mjs slow` | Tagged slow tests |
| `test:shard` | `node scripts/testing/run-shard.mjs` | Sharded tests |
| `test:traceability` | `node scripts/testing/generate-traceability-report.mjs` | Generate test traceability report |

---

## 3. Workspace Package Test Suites

### Apps

#### @birthub/web
- **Path:** apps/web
- **Type:** Next.js application
- **Test Command:** `test` (defined in package.json)
- **Test Framework:** Likely Jest/Vitest

#### @birthub/api
- **Path:** apps/api
- **Type:** Express.js API
- **Test Command:** `test`, `test:auth`, `test:rbac`, `test:security`, `test:isolation`
- **Special:** Multiple test suites for security/auth

#### @birthub/worker
- **Path:** apps/worker
- **Type:** Background worker
- **Test Command:** `test`, `test:isolation`
- **Special:** Workflow coverage tests

#### @birthub/voice-engine
- **Path:** apps/voice-engine
- **Type:** Voice processing service
- **Test Command:** `test` (if present)

### Core Packages

#### @birthub/database
- **Path:** packages/database
- **Type:** Prisma database layer
- **Test Command:** `test` (if present)
- **Special Commands:** `db:generate`, `db:bootstrap:ci`, `db:migrate`, `db:seed`

#### @birthub/testing
- **Path:** packages/testing
- **Type:** Shared testing utilities
- **Test Command:** `test`

#### @birthub/auth
- **Path:** packages/auth
- **Type:** Authentication library
- **Test Command:** `test`

#### @birthub/utils
- **Path:** packages/utils
- **Type:** Shared utilities
- **Test Command:** `test`

#### @birthub/agent-runtime
- **Path:** packages/agent-runtime
- **Type:** Agent execution runtime
- **Test Command:** `test`

#### @birthub/agents-core
- **Path:** packages/agents-core
- **Type:** Agent core functionality
- **Test Command:** `test`

#### @birthub/agents-registry
- **Path:** packages/agents-registry
- **Type:** Agent registry
- **Test Command:** `test`

#### @birthub/agent-packs
- **Path:** packages/agent-packs
- **Type:** Agent packs
- **Test Commands:** `test`, `smoke`, `regression`, `validate`

#### @birthub/workflows-core
- **Path:** packages/workflows-core
- **Type:** Workflow engine
- **Test Command:** `test`
- **Special:** Workflow coverage verification

#### @birthub/queue
- **Path:** packages/queue
- **Type:** Queue management
- **Test Commands:** `test`, `test:load`

#### @birthub/security
- **Path:** packages/security
- **Type:** Security utilities
- **Test Command:** `test`

#### Other Packages
- @birthub/integrations
- @birthub/conversation-core
- @birthub/config
- @birthub/shared
- @birthub/llm-client
- @birthub/logger
- @birthub/shared-types
- @birthub/emails

---

## 4. CI Test Jobs (GitHub Actions)

### From .github/workflows/ci.yml

#### Matrix Job: platform (5 tasks)
- **lint** - ESLint validation
- **typecheck** - TypeScript type checking
- **test** - Core test suite
- **test:isolation** - Isolated integration tests
- **build** - Production build

#### Standalone Jobs
- **satellites** - Satellite package tests (including Python)
- **workflow-suite** - Workflow engine tests
- **pack-tests** - Agent pack tests (`pnpm ci:task pack-tests`)
- **security-guardrails** - Security validation (`pnpm ci:security-guardrails`)
- **e2e-release** - E2E release tests (`pnpm test:e2e:release`)

### From .github/workflows/security-scan.yml
- **rbac-suite** - RBAC tests (`pnpm test:rbac`)
- **python-security** - Python security scans (Bandit, pip-audit, Safety)
- **semgrep** - Static analysis (TypeScript + Express)
- **dependency-audit** - npm audit (high+)
- **zap-baseline** - OWASP ZAP baseline scan

---

## 5. Test Infrastructure Requirements

### Services (Docker)
- **PostgreSQL:** 16-alpine
  - Database: `birthub_cycle1` (CI), `birthub_cycle3` (RBAC)
  - User: postgres
  - Port: 5432
- **Redis:** 7.2-alpine
  - Port: 6379

### Environment Variables (Test)
```
API_CORS_ORIGINS=http://localhost:3001
API_PORT=3000
DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/birthub_cycle1
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_ENVIRONMENT=ci
NODE_ENV=test
QUEUE_NAME=birthub-cycle1
REDIS_URL=redis://localhost:6379
SESSION_SECRET=ci-secret
WEB_BASE_URL=http://localhost:3001
```

### Python Requirements
- **Version:** From `.python-version`
- **Test Dependencies:** `requirements-test.txt`
- **Application Dependencies:** `apps/webhook-receiver/requirements.txt`
- **Security Tools:** bandit, pip-audit, safety>=3.7.0

---

## 6. Test Execution Flow

### Local Development
```bash
pnpm install --frozen-lockfile
pnpm db:generate
pnpm db:bootstrap:ci  # If integration tests needed
pnpm test            # Run all core tests
pnpm test:isolation  # Run isolated tests
```

### CI Pipeline Sequence
1. **Setup:** Install dependencies, generate Prisma client
2. **Bootstrap:** `db:bootstrap:ci` (for test/isolation jobs only)
3. **Parallel Execution:**
   - lint (depends on ^build)
   - typecheck (depends on ^typecheck, ^build)
   - test (depends on ^build)
   - test:isolation (depends on ^build)
   - build (depends on ^build)
4. **Satellites:** Independent Python + Node satellite tests
5. **Workflow Suite:** Workflow engine + worker tests
6. **Pack Tests:** Agent pack validation
7. **E2E:** Release master E2E tests

---

## 7. Test Dependencies (Turbo)

From `turbo.json`:
```json
{
  "test": {
    "dependsOn": ["^build"],
    "outputs": []
  },
  "test:isolation": {
    "dependsOn": ["^build"],
    "outputs": []
  }
}
```

**Implication:** All tests require dependencies to be built first (`^build`).

---

## 8. Test File Distribution

- **Total Test Files:** 99
- **Formats:** .test.ts, .test.tsx, .spec.ts, .spec.tsx
- **Estimated Distribution:**
  - Unit tests: ~70%
  - Integration tests: ~20%
  - E2E tests: ~10%

---

## 9. Key Test Scripts

### Helper Scripts
- `scripts/ci/run-pnpm.mjs` - Wrapper for running pnpm commands with filters
- `scripts/ci/run-satellites.mjs` - Execute satellite package tasks
- `scripts/testing/run-tagged-tests.mjs` - Run tests by tag
- `scripts/testing/run-shard.mjs` - Shard test execution
- `scripts/testing/generate-traceability-report.mjs` - Generate test traceability
- `scripts/testing/generate-performance-report.mjs` - Performance metrics

---

## 10. Summary Statistics

| Metric | Count |
|--------|-------|
| Total test commands (root) | 24 |
| Workspace packages with tests | ~19 |
| CI test jobs | 13 |
| Test file count | 99 |
| Test frameworks | 3 (Jest/Vitest, Playwright, pytest) |
| Required services | 2 (PostgreSQL, Redis) |
| Security test suites | 5 |

---

## 11. Notes

- **Frozen Lockfile:** All CI jobs use `pnpm install --frozen-lockfile` for reproducibility
- **Test Isolation:** Some tests run with `test:isolation` for database isolation
- **Turbo Cache:** CI uses Turbo cache with matrix-specific keys
- **Python Tests:** Parallel execution with `-n auto --dist loadfile`
- **Playwright:** Only installed when `test:e2e` commands detected
- **Database Bootstrap:** Critical step for integration tests (`db:bootstrap:ci`)
