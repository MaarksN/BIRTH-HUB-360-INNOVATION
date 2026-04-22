# GitHub Actions Workflow Map

**Generated:** 2026-04-02
**Repository:** PROJETO-FINAL-BIRTHUB-360-INNOVATION
**Total Workflows:** 10

---

## 1. Overview

This document provides a complete map of all GitHub Actions workflows, their jobs, dependencies, triggers, and execution context.

### Workflow Files
Located in `.github/workflows/`:
1. ci.yml
2. cd.yml
3. security-scan.yml
4. repository-health.yml
5. reusable-node-check.yml (reusable workflow)
6. agents-conformity.yml
7. f4-script-compliance.yml
8. materialize-doc-only.yml
9. branch-cleanup.yml
10. dependabot-auto-merge.yml

---

## 2. CI Workflow (ci.yml)

**Purpose:** Main continuous integration pipeline
**File:** `.github/workflows/ci.yml`

### Triggers
- **pull_request:** branches `main`, `develop`
- **push:** branches `main`, `develop`, `codex/**`

### Permissions
- `contents: read`
- `pull-requests: read`

### Jobs (20 total)

#### 1. branch-name
- **Type:** Reusable workflow call
- **Command:** `pnpm branch:check`
- **Timeout:** 10 minutes
- **Purpose:** Validate branch naming convention

#### 2. commit-messages (commitlint)
- **Type:** Reusable workflow call
- **Command:** `pnpm ci:commitlint`
- **Fetch Depth:** 0 (full history)
- **Timeout:** 10 minutes
- **Purpose:** Validate conventional commits

#### 3. lockfile-integrity
- **Runner:** ubuntu-latest
- **Timeout:** 15 minutes
- **Steps:**
  1. Checkout (fetch-depth: 0)
  2. Setup pnpm@9.1.0
  3. Setup Node.js (cache: pnpm, node-version-file: .nvmrc)
  4. Install dependencies (frozen-lockfile)
  5. Enforce agent surface freeze
  6. Enforce legacy DB surface freeze
  7. Enforce legacy runtime surface freeze
  8. Enforce lockfile governance (`pnpm ci:lockfile`)
- **Purpose:** Validate lockfile integrity and surface freeze policies

#### 4. lockfile-corruption-simulation
- **Runner:** ubuntu-latest
- **Timeout:** 15 minutes
- **Steps:**
  1. Checkout
  2. Setup pnpm@9.1.0
  3. Setup Node.js
  4. Corrupt lockfile fixture
  5. Assert frozen install fails on corrupted lockfile
  6. Restore lockfile
- **Purpose:** Verify lockfile corruption detection

#### 5. inline-credentials
- **Type:** Reusable workflow call
- **Command:** `pnpm security:inline-credentials`
- **Timeout:** 10 minutes
- **Purpose:** Scan for hardcoded credentials

#### 6. documentation-links
- **Type:** Reusable workflow call
- **Command:** `pnpm docs:check-links`
- **Timeout:** 15 minutes
- **Purpose:** Validate documentation links

#### 7. repo-hygiene
- **Type:** Reusable workflow call
- **Command:** `pnpm hygiene:check`
- **Fetch Depth:** 0
- **Timeout:** 20 minutes
- **Purpose:** Repository hygiene checks

#### 8. gitleaks
- **Runner:** ubuntu-latest
- **Timeout:** 10 minutes
- **Steps:**
  1. Checkout (fetch-depth: 0)
  2. Run Gitleaks action
- **Purpose:** Secret scanning with Gitleaks

#### 9. security-guardrails
- **Runner:** ubuntu-latest
- **Timeout:** 25 minutes
- **Services:**
  - PostgreSQL 16-alpine (birthub_cycle1)
  - Port: 5432
- **Steps:**
  1. Checkout
  2. Setup pnpm@9.1.0
  3. Setup Node.js
  4. Install dependencies
  5. Generate Prisma client
  6. Enforce security guardrails (`pnpm ci:security-guardrails`)
- **Environment Variables:** Full test environment
- **Purpose:** Security policy enforcement

#### 10-14. platform (matrix strategy)
- **Runner:** ubuntu-latest
- **Timeout:** 25 minutes
- **Strategy:** fail-fast: false
- **Matrix Tasks:**
  1. `lint`
  2. `typecheck`
  3. `test`
  4. `test:isolation`
  5. `build`
- **Services:**
  - PostgreSQL 16-alpine (birthub_cycle1)
  - Redis 7.2-alpine
- **Turbo Cache:** `.turbo` directory cached by matrix task
- **Steps:**
  1. Checkout
  2. Setup pnpm@9.1.0
  3. Setup Node.js
  4. Cache Turbo
  5. Install dependencies
  6. Generate Prisma client
  7. Bootstrap CI database (if test/test:isolation)
  8. Run matrix task (`pnpm ci:task ${{ matrix.task }}`)
- **Purpose:** Core platform quality checks

#### 15. satellites
- **Runner:** ubuntu-latest
- **Timeout:** 25 minutes
- **Steps:**
  1. Checkout
  2. Setup pnpm@9.1.0
  3. Setup Node.js
  4. Setup Python (version from .python-version)
  5. Install Node dependencies
  6. Install Python test dependencies
  7. Run satellites lane (`pnpm ci:task satellites`)
- **Environment Variables:** Satellite-specific config
- **Purpose:** Test satellite packages (Python + Node)

#### 16. workflow-suite
- **Runner:** ubuntu-latest
- **Timeout:** 30 minutes
- **Services:**
  - PostgreSQL 16-alpine
  - Redis 7.2-alpine
- **Steps:**
  1. Checkout
  2. Setup pnpm@9.1.0
  3. Setup Node.js
  4. Setup Python
  5. Install dependencies
  6. Generate Prisma client
  7. Bootstrap CI database
  8. Run workflow suite (`pnpm ci:task workflow-suite`)
- **Purpose:** Workflow engine integration tests

#### 17. pack-tests
- **Type:** Reusable workflow call
- **Command:** `pnpm ci:task pack-tests`
- **Timeout:** 20 minutes
- **Purpose:** Agent pack tests

#### 18. governance-gates
- **Type:** Reusable workflow call
- **Command:** `pnpm monorepo:doctor && RELEASE_SCORECARD_MIN_SCORE=100 pnpm release:scorecard && pnpm audit:ownership`
- **Timeout:** 15 minutes
- **Purpose:** Repository governance checks

#### 19. e2e-release
- **Type:** Reusable workflow call
- **Command:** `pnpm test:e2e:release`
- **Timeout:** 20 minutes
- **Purpose:** Release E2E tests

#### 20. ci (final gate)
- **Runner:** ubuntu-latest
- **Timeout:** 10 minutes
- **Depends On:** All 19 previous jobs
- **Steps:** Echo "All required checks passed."
- **Purpose:** Final CI gate

---

## 3. CD Workflow (cd.yml)

**Purpose:** Continuous deployment pipeline
**File:** `.github/workflows/cd.yml`

### Triggers
- **workflow_run:** After CI workflow completes successfully on `main`
- **workflow_dispatch:** Manual with inputs (deploy_target, rollback_rehearsal_evidence)

### Permissions
- `contents: read`

### Jobs

#### 1. staging-preflight
- **Condition:** CI success on main branch
- **Runner:** ubuntu-latest
- **Timeout:** 20 minutes
- **Concurrency:** cd-staging-main (no cancel-in-progress)
- **Environment:** staging
- **Steps:**
  1. Checkout from CI run SHA
  2. Setup pnpm + Node
  3. Install dependencies
  4. Mask configured secrets
  5. Validate required staging configuration
  6. Run staging preflight (`pnpm release:preflight:staging`)
  7. Upload staging preflight evidence artifact

#### 2. release-sbom
- **Condition:** CI success on main OR manual production dispatch
- **Runner:** ubuntu-latest
- **Timeout:** 20 minutes
- **Steps:**
  1. Checkout (conditional on trigger type)
  2. Setup pnpm + Node
  3. Install dependencies
  4. Generate CycloneDX SBOM (`pnpm release:sbom`)
  5. Materialize release bundle (`pnpm release:materialize -- --tag=v1.0.0`)
  6. Upload SBOM artifact
  7. Upload release manifests

#### 3. production-preflight
- **Condition:** Manual dispatch to production
- **Runner:** ubuntu-latest
- **Timeout:** 20 minutes
- **Concurrency:** cd-production (no cancel-in-progress)
- **Environment:** production
- **Steps:**
  1. Checkout
  2. Setup pnpm + Node
  3. Install dependencies
  4. Mask configured secrets
  5. Validate required production configuration
  6. Run production preflight (`pnpm release:preflight:production`)
  7. Upload production preflight evidence

#### 4. release-smoke-gate
- **Condition:** Manual production dispatch
- **Runner:** ubuntu-latest
- **Timeout:** 40 minutes
- **Depends On:** release-sbom, production-preflight
- **Steps:**
  1. Checkout
  2. Setup pnpm + Node
  3. Install dependencies
  4. Run release smoke gate (`pnpm release:smoke`)
  5. Upload smoke evidence

#### 5. release-e2e-gate
- **Condition:** Manual production dispatch
- **Runner:** ubuntu-latest
- **Timeout:** 40 minutes
- **Depends On:** release-smoke-gate
- **Steps:**
  1. Checkout
  2. Setup pnpm + Node
  3. Install dependencies
  4. Run release E2E gate (`pnpm test:e2e:release`)
  5. Upload E2E evidence (playwright-report, test-results)

#### 6. rollback-rehearsal-evidence-gate
- **Condition:** Manual production dispatch
- **Runner:** ubuntu-latest
- **Timeout:** 10 minutes
- **Depends On:** release-e2e-gate
- **Steps:**
  1. Checkout
  2. Setup pnpm + Node
  3. Install dependencies
  4. Verify rollback rehearsal evidence (`pnpm release:rollback:evidence`)
  5. Upload rollback rehearsal evidence

#### 7. deploy-staging
- **Condition:** CI success on main
- **Runner:** ubuntu-latest
- **Timeout:** 15 minutes
- **Depends On:** staging-preflight, release-sbom
- **Concurrency:** cd-staging-main
- **Environment:** staging
- **Steps:**
  1. Mask deploy hook
  2. Trigger Render deploy hook (staging)

#### 8. deploy-production
- **Condition:** Manual production dispatch
- **Runner:** ubuntu-latest
- **Timeout:** 15 minutes
- **Depends On:** All 5 release gates
- **Concurrency:** cd-production
- **Environment:** production
- **Steps:**
  1. Guard production deployment branch (must be main)
  2. Mask deploy hook
  3. Trigger Render deploy hook (production)

---

## 4. Security Scan Workflow (security-scan.yml)

**Purpose:** Security testing and scanning
**File:** `.github/workflows/security-scan.yml`

### Triggers
- **pull_request**
- **push:** branches `main`, `develop`, `codex/**`

### Permissions
- `contents: read`

### Jobs

#### 1. semgrep
- **Runner:** ubuntu-latest
- **Timeout:** 15 minutes
- **Steps:**
  1. Checkout
  2. Run Semgrep (TypeScript + Express.js rulesets)

#### 2. dependency-audit
- **Runner:** ubuntu-latest
- **Timeout:** 20 minutes
- **Steps:**
  1. Checkout
  2. Setup pnpm + Node
  3. Install dependencies
  4. Audit dependencies (`pnpm audit --audit-level=high`)

#### 3. python-security
- **Runner:** ubuntu-latest
- **Timeout:** 25 minutes
- **Steps:**
  1. Checkout
  2. Setup pnpm + Node + Python
  3. Install Node dependencies
  4. Install Python dependencies (bandit, pip-audit, safety)
  5. Enforce Python workflow hard-fail policy
  6. Run Bandit (Python SAST)
  7. Run pip-audit
  8. Run Safety check

#### 4. rbac-suite
- **Runner:** ubuntu-latest
- **Timeout:** 25 minutes
- **Services:**
  - PostgreSQL 16-alpine (birthub_cycle3)
  - Redis 7.2-alpine
- **Steps:**
  1. Checkout
  2. Setup pnpm + Node
  3. Install dependencies
  4. Generate Prisma client
  5. Run RBAC tests (`pnpm test:rbac`)

#### 5. zap-baseline
- **Runner:** ubuntu-latest
- **Timeout:** 20 minutes
- **Condition:** `${{ vars.ZAP_TARGET_URL != '' }}`
- **Steps:**
  1. ZAP baseline scan

#### 6. security-report
- **Runner:** ubuntu-latest
- **Timeout:** 15 minutes
- **Condition:** always()
- **Depends On:** All 5 previous security jobs
- **Steps:**
  1. Checkout
  2. Setup pnpm + Node
  3. Install dependencies
  4. Verify auth guards (`pnpm security:guards`)
  5. Generate security report (`pnpm security:report`)
  6. Upload security report artifact

---

## 5. Repository Health Workflow (repository-health.yml)

**Purpose:** Periodic repository health checks
**File:** `.github/workflows/repository-health.yml`

### Triggers
- **schedule:** Weekly Monday at 12:00 UTC (`0 12 * * 1`)
- **push:** branches `codex/**`
- **workflow_dispatch:** Manual

### Jobs

#### 1. repository-health
- **Runner:** ubuntu-latest
- **Timeout:** 15 minutes
- **Steps:**
  1. Checkout (fetch-depth: 0)
  2. Setup pnpm + Node
  3. Install dependencies
  4. Clean stale untracked artifacts (`pnpm artifacts:clean -- --apply`)
  5. Generate repository health report (`pnpm monorepo:doctor`)
  6. Upload doctor artifacts

---

## 6. Reusable Node Check Workflow (reusable-node-check.yml)

**Purpose:** Reusable workflow for Node.js checks
**File:** `.github/workflows/reusable-node-check.yml`

### Trigger
- **workflow_call**

### Inputs
- `command` (required, string): Command to run
- `fetch_depth` (optional, number, default: 1): Git fetch depth
- `timeout_minutes` (optional, number, default: 20): Job timeout

### Permissions
- `contents: read`

### Job: run
- **Runner:** ubuntu-latest
- **Timeout:** `${{ inputs.timeout_minutes }}`
- **Steps:**
  1. Checkout (fetch-depth: `${{ inputs.fetch_depth }}`)
  2. Setup pnpm@9.1.0
  3. Setup Node.js (cache pnpm, node-version-file: .nvmrc)
  4. Install dependencies
  5. Install Playwright browsers (if command contains `test:e2e`)
  6. Prisma diagnostics (check versions, schema hash)
  7. Run command (`${{ inputs.command }}`)

---

## 7. Other Workflows (Summary)

### agents-conformity.yml
- **Purpose:** Agent conformity validation
- **Triggers:** (To be documented if needed)

### f4-script-compliance.yml
- **Purpose:** F4 script compliance checks
- **Triggers:** (To be documented if needed)

### materialize-doc-only.yml
- **Purpose:** Documentation materialization
- **Triggers:** (To be documented if needed)

### branch-cleanup.yml
- **Purpose:** Automated branch cleanup
- **Triggers:** (To be documented if needed)

### dependabot-auto-merge.yml
- **Purpose:** Dependabot PR auto-merge
- **Triggers:** (To be documented if needed)

---

## 8. Workflow Dependency Graph

```
CI (ci.yml)
├── branch-name
├── commit-messages
├── lockfile-integrity
├── lockfile-corruption-simulation
├── inline-credentials
├── documentation-links
├── repo-hygiene
├── gitleaks
├── security-guardrails
├── platform [matrix: lint, typecheck, test, test:isolation, build]
├── satellites
├── workflow-suite
├── pack-tests
├── governance-gates
├── e2e-release
└── ci (final gate) ← depends on all above

CD (cd.yml) ← Triggered by CI success OR manual dispatch
├── staging-preflight
├── release-sbom
├── production-preflight
├── release-smoke-gate → depends on release-sbom, production-preflight
├── release-e2e-gate → depends on release-smoke-gate
├── rollback-rehearsal-evidence-gate → depends on release-e2e-gate
├── deploy-staging → depends on staging-preflight, release-sbom
└── deploy-production → depends on all production gates

Security Scan (security-scan.yml)
├── semgrep
├── dependency-audit
├── python-security
├── rbac-suite
├── zap-baseline
└── security-report ← depends on all above

Repository Health (repository-health.yml)
└── repository-health (standalone)
```

---

## 9. Critical Path Analysis

### For Pull Requests
**Longest Path:** ~30 minutes
`workflow-suite` (30 min) OR `platform (test*)` (25 min)

### For Main Branch Push
**CI Path:** ~30 minutes
**CD Path (Staging):** ~35 minutes additional
**Total:** ~65 minutes from push to staging deployment

### For Production Deployment (Manual)
**CI Path:** Already completed on main
**CD Path:** ~140 minutes
- release-sbom (20 min)
- production-preflight (20 min)
- release-smoke-gate (40 min)
- release-e2e-gate (40 min)
- rollback-rehearsal-evidence-gate (10 min)
- deploy-production (15 min)

---

## 10. Resource Requirements

### PostgreSQL Databases
- **birthub_cycle1:** CI platform tests
- **birthub_cycle3:** RBAC security tests

### Redis
- Required for all integration tests

### Artifacts
- Turbo cache (`.turbo`)
- Playwright reports
- Security reports
- Release manifests
- SBOM files
- Preflight evidence

---

## 11. Environment Secrets & Variables

### Staging Environment
**Secrets:** RENDER_STAGING_DEPLOY_HOOK_URL, DATABASE_URL, REDIS_URL, SESSION_SECRET, JOB_HMAC_GLOBAL_SECRET, AUTH_MFA_ENCRYPTION_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SENTRY_DSN
**Variables:** API_CORS_ORIGINS, WEB_BASE_URL, NEXT_PUBLIC_API_URL, NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_SENTRY_DSN, NEXT_PUBLIC_CSP_REPORT_ONLY, REQUIRE_SECURE_COOKIES, STRIPE_SUCCESS_URL, STRIPE_CANCEL_URL

### Production Environment
**Secrets:** RENDER_PRODUCTION_DEPLOY_HOOK_URL, DATABASE_URL, REDIS_URL, SESSION_SECRET, JOB_HMAC_GLOBAL_SECRET, AUTH_MFA_ENCRYPTION_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SENTRY_DSN
**Variables:** Same as staging

---

## 12. Summary

| Metric | Value |
|--------|-------|
| Total workflows | 10 |
| CI jobs | 20 |
| CD jobs | 8 |
| Security scan jobs | 6 |
| Reusable workflows | 1 |
| Maximum job timeout | 40 minutes |
| CI critical path | ~30 minutes |
| Full production deploy | ~140 minutes |
| Required services | PostgreSQL, Redis |
| Supported languages | TypeScript, Python |
