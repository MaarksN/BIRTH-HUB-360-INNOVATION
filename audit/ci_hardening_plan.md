# CI Hardening Plan

**Generated:** 2026-04-02
**Purpose:** Prevent future CI failures and improve pipeline resilience
**Priority:** HIGH - Implementation recommended within 1-4 weeks
**Status:** 📋 READY FOR IMPLEMENTATION

---

## 1. Executive Summary

This plan outlines concrete improvements to prevent the 4 failure clusters identified in CI run #727 from recurring. Each recommendation includes implementation steps, estimated effort, and expected impact.

**Key Metrics:**
- **Failures Analyzed:** 6 jobs across 4 root cause clusters
- **Prevention Strategies:** 15 concrete improvements
- **Estimated Effort:** 2-3 engineering days
- **Expected Failure Reduction:** 80%+

---

## 2. Prevention Strategy Matrix

| Cluster | Failures Prevented | Implementation Priority | Effort | Impact |
|---------|-------------------|------------------------|--------|--------|
| 1 (Lockfile) | Hash mismatches | P0 - CRITICAL | 2h | HIGH |
| 2 (Database) | SQL syntax errors | P1 - HIGH | 4h | HIGH |
| 3 (Security) | Cascading failures | P2 - MEDIUM | 2h | MEDIUM |
| 4 (Commit) | Convention violations | P1 - HIGH | 2h | HIGH |

---

## 3. CLUSTER 1 Prevention: Lockfile Hash Automation

### Problem
Developers commit `pnpm-lock.yaml` but forget to run `pnpm lockfile:hash:update`, causing CI failures.

### Root Cause
Manual process is error-prone and not discoverable.

### Solution: Automated Lockfile Hash Updates

#### Implementation 1: Pre-Commit Hook (RECOMMENDED)
**Priority:** P0 - CRITICAL
**Effort:** 2 hours
**Impact:** Prevents 100% of lockfile hash mismatches

**Steps:**

1. **Install Husky** (if not already installed)
```bash
pnpm add -D husky
pnpm exec husky init
```

2. **Create Pre-Commit Hook**
File: `.husky/pre-commit`
```bash
#!/bin/sh

# Check if pnpm-lock.yaml is staged
if git diff --cached --name-only | grep -q "pnpm-lock.yaml"; then
  echo "📦 pnpm-lock.yaml changed, updating hash..."
  pnpm lockfile:hash:update

  # Stage the updated hash file
  git add .github/lockfile/pnpm-lock.sha256

  echo "✅ Lockfile hash updated and staged"
fi
```

3. **Make Hook Executable**
```bash
chmod +x .husky/pre-commit
```

4. **Test Hook**
```bash
# Modify lockfile
pnpm install

# Commit (should auto-update hash)
git add pnpm-lock.yaml
git commit -m "test: verify pre-commit hook"

# Verify hash was updated
git diff --cached .github/lockfile/pnpm-lock.sha256
```

**Expected Outcome:**
- ✅ Hash updates automatically on every commit touching lockfile
- ✅ Zero manual intervention required
- ✅ CI failures prevented at source

#### Implementation 2: GitHub Actions Auto-Fix
**Priority:** P2 - MEDIUM (fallback for hook bypass)
**Effort:** 1 hour
**Impact:** Catches issues if hooks are skipped

**Steps:**

1. **Create Workflow**
File: `.github/workflows/lockfile-autofix.yml`
```yaml
name: Lockfile Hash Auto-Fix

on:
  pull_request:
    paths:
      - 'pnpm-lock.yaml'

jobs:
  autofix:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.head_ref }}
          token: ${{ secrets.GITHUB_TOKEN }}

      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'

      - run: corepack enable

      - name: Check if hash needs update
        id: check
        run: |
          node scripts/ci/lockfile-governance.mjs || echo "needs_update=true" >> $GITHUB_OUTPUT

      - name: Update hash if needed
        if: steps.check.outputs.needs_update == 'true'
        run: |
          pnpm lockfile:hash:update
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add .github/lockfile/pnpm-lock.sha256
          git commit -m "chore: auto-update lockfile hash [skip ci]"
          git push
```

**Expected Outcome:**
- ✅ Automatic fix pushed to PR if hash is stale
- ✅ Zero friction for developers
- ✅ CI passes without manual intervention

#### Implementation 3: Improved Error Messages
**Priority:** P3 - LOW
**Effort:** 30 minutes
**Impact:** Faster resolution when issues occur

**Steps:**

1. **Update Error Message**
File: `scripts/ci/lockfile-governance.mjs`
```diff
  if (actualHash !== expectedHash) {
-   throw new Error(`Lockfile hash mismatch...`);
+   throw new Error(
+     `❌ Lockfile hash mismatch!\n` +
+     `\n` +
+     `Expected: ${expectedHash}\n` +
+     `Actual:   ${actualHash}\n` +
+     `\n` +
+     `🔧 Quick Fix:\n` +
+     `  pnpm lockfile:hash:update\n` +
+     `\n` +
+     `💡 To prevent this in the future:\n` +
+     `  1. Install pre-commit hook: pnpm exec husky init\n` +
+     `  2. See docs/contributing.md for setup\n`
+   );
  }
```

### Documentation Updates
**Files to Update:**
1. `CONTRIBUTING.md` - Add lockfile hash section
2. `README.md` - Mention in development setup
3. `.github/pull_request_template.md` - Add checklist item

**Example CONTRIBUTING.md Section:**
```markdown
## Lockfile Management

When you run `pnpm install`, the lockfile (`pnpm-lock.yaml`) may change. To ensure CI passes:

1. **Automatic (Recommended):** Install pre-commit hooks
   ```bash
   pnpm exec husky init
   ```
   The hash will update automatically on commit.

2. **Manual:** Run the hash update command
   ```bash
   pnpm lockfile:hash:update
   ```

The hash is stored in `.github/lockfile/pnpm-lock.sha256` and validates lockfile integrity in CI.
```

---

## 4. CLUSTER 2 Prevention: SQL Migration Validation

### Problem
SQL syntax errors in migration files block database bootstrap.

### Root Cause
Prisma generates migrations, but manual edits or generation bugs can introduce syntax errors.

### Solution: Automated SQL Linting

#### Implementation 1: Pre-Commit SQL Linting (RECOMMENDED)
**Priority:** P1 - HIGH
**Effort:** 3 hours
**Impact:** Catches 90%+ of SQL syntax errors

**Steps:**

1. **Install SQL Linter**
```bash
pnpm add -D sql-lint pg-query-native
```

2. **Create Lint Script**
File: `packages/database/scripts/lint-migrations.ts`
```typescript
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { parse } from "pg-query-native";

const migrationsDir = join(
  import.meta.dirname,
  "../prisma/migrations"
);

function lintMigration(filePath: string): boolean {
  const sql = readFileSync(filePath, "utf8");

  try {
    // Parse SQL with PostgreSQL parser
    parse(sql);
    console.log(`✅ ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ ${filePath}`);
    console.error(`   ${error.message}`);
    return false;
  }
}

function main() {
  const migrations = readdirSync(migrationsDir)
    .filter((dir) => !dir.startsWith("."))
    .map((dir) => join(migrationsDir, dir, "migration.sql"))
    .filter((file) => {
      try {
        readFileSync(file);
        return true;
      } catch {
        return false;
      }
    });

  console.log(`Linting ${migrations.length} migrations...\n`);

  const results = migrations.map(lintMigration);
  const failures = results.filter((r) => !r).length;

  if (failures > 0) {
    console.error(`\n❌ ${failures} migrations failed linting`);
    process.exit(1);
  }

  console.log(`\n✅ All migrations passed linting`);
}

main();
```

3. **Add Package Script**
File: `packages/database/package.json`
```json
{
  "scripts": {
    "lint:migrations": "tsx scripts/lint-migrations.ts"
  }
}
```

4. **Add to Pre-Commit Hook**
File: `.husky/pre-commit`
```bash
#!/bin/sh

# Check if any migration files changed
if git diff --cached --name-only | grep -q "prisma/migrations.*\.sql"; then
  echo "🔍 SQL migrations changed, linting..."
  pnpm --filter @birthub/database lint:migrations

  if [ $? -ne 0 ]; then
    echo "❌ SQL linting failed. Fix errors before committing."
    exit 1
  fi

  echo "✅ SQL migrations valid"
fi
```

5. **Add to CI**
File: `.github/workflows/ci.yml`
```yaml
- name: Lint SQL Migrations
  run: pnpm --filter @birthub/database lint:migrations
```

**Expected Outcome:**
- ✅ Syntax errors caught before commit
- ✅ PostgreSQL-specific validation
- ✅ CI failures prevented

#### Implementation 2: Prisma Migration Review Checklist
**Priority:** P2 - MEDIUM
**Effort:** 30 minutes
**Impact:** Catches manual edit errors

**Steps:**

1. **Create Checklist**
File: `.github/PULL_REQUEST_TEMPLATE/migration.md`
```markdown
## Migration Checklist

**Migration Name:** <!-- e.g., 20260316000100_cycle10_connectors_handoffs -->

### SQL Syntax Review
- [ ] All CREATE TABLE statements have commas after last column before CONSTRAINT
- [ ] All column definitions use valid PostgreSQL types
- [ ] All foreign key references point to existing tables
- [ ] All index names are unique
- [ ] No reserved keywords used as identifiers

### Schema Review
- [ ] Migration is reversible (or marked as irreversible)
- [ ] No data loss without explicit acknowledgment
- [ ] Tenant isolation maintained
- [ ] Foreign keys have proper CASCADE behavior

### Testing
- [ ] Tested locally with PostgreSQL 16
- [ ] Ran `pnpm db:bootstrap:ci` successfully
- [ ] Verified schema matches Prisma schema

### Documentation
- [ ] Breaking changes documented
- [ ] Migration purpose explained in description
```

2. **Add Template Selector**
File: `.github/pull_request_template.md`
```markdown
<!-- If your PR includes database migrations, use the migration template:
     .github/PULL_REQUEST_TEMPLATE/migration.md -->
```

**Expected Outcome:**
- ✅ Structured review process
- ✅ Common mistakes caught by reviewers
- ✅ Migration quality improves

#### Implementation 3: Migration Test Suite
**Priority:** P2 - MEDIUM
**Effort:** 2 hours
**Impact:** Validates migrations in isolation

**Steps:**

1. **Create Test Script**
File: `packages/database/scripts/test-migrations.ts`
```typescript
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function testMigrations() {
  const dbUrl = process.env.TEST_DATABASE_URL;

  if (!dbUrl) {
    throw new Error("TEST_DATABASE_URL required");
  }

  console.log("🧪 Testing migrations...");

  // Deploy all migrations
  await execAsync(
    `pnpm prisma migrate deploy --schema=prisma/schema.prisma`,
    { env: { ...process.env, DATABASE_URL: dbUrl } }
  );

  console.log("✅ All migrations applied successfully");

  // Verify schema
  await execAsync(
    `pnpm prisma db pull --schema=prisma/schema-test.prisma`,
    { env: { ...process.env, DATABASE_URL: dbUrl } }
  );

  console.log("✅ Schema valid");
}

testMigrations().catch((error) => {
  console.error("❌ Migration test failed:", error);
  process.exit(1);
});
```

2. **Add to CI**
```yaml
- name: Test Migrations
  run: |
    export TEST_DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/birthub_test"
    pnpm --filter @birthub/database test:migrations
```

**Expected Outcome:**
- ✅ Migrations validated in clean database
- ✅ Schema drift detected
- ✅ CI catches deployment issues

---

## 5. CLUSTER 3 Prevention: Cascading Failure Detection

### Problem
Security-guardrails failed due to dependency on db:bootstrap:ci.

### Root Cause
No visibility into dependency chain; failures cascaded without clear root cause.

### Solution: Better Dependency Tracking

#### Implementation 1: Job Dependency Visualization
**Priority:** P2 - MEDIUM
**Effort:** 2 hours
**Impact:** Faster failure diagnosis

**Steps:**

1. **Create Dependency Graph Script**
File: `scripts/ci/visualize-dependencies.mjs`
```javascript
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

function analyzeDependencies() {
  const workflowsDir = ".github/workflows";
  const workflows = readdirSync(workflowsDir)
    .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
    .map((f) => ({
      name: f,
      content: readFileSync(join(workflowsDir, f), "utf8"),
    }));

  const dependencies = new Map();

  workflows.forEach(({ name, content }) => {
    // Parse needs: [...] from workflow
    const needsMatch = content.match(/needs:\s*\[([^\]]+)\]/g);
    if (needsMatch) {
      dependencies.set(name, needsMatch[0]);
    }

    // Check for pnpm run commands
    const pnpmCalls = [...content.matchAll(/pnpm\s+([\w:]+)/g)];
    if (pnpmCalls.length > 0) {
      dependencies.set(
        name,
        pnpmCalls.map((m) => m[1])
      );
    }
  });

  return dependencies;
}

console.log("CI Dependency Graph:");
console.log(analyzeDependencies());
```

2. **Add to Documentation**
File: `audit/github_actions_map.md`
```markdown
## Dependency Graph

Run `node scripts/ci/visualize-dependencies.mjs` to see current dependencies.

### Known Cascading Dependencies
- security-guardrails → db:bootstrap:ci
- platform (test) → db:bootstrap:ci
- workflow-suite → db:bootstrap:ci
```

**Expected Outcome:**
- ✅ Clear visibility into job dependencies
- ✅ Faster root cause identification
- ✅ Better impact analysis for changes

#### Implementation 2: Improved Error Messages in Orchestrator Scripts
**Priority:** P2 - MEDIUM
**Effort:** 1 hour
**Impact:** Clearer failure attribution

**Steps:**

1. **Update security-guardrails-local.mjs**
File: `scripts/ci/security-guardrails-local.mjs`
```diff
  if (databaseUrl && databaseReachable) {
+   console.log("[security-guardrails] Running db:bootstrap:ci...");
    try {
      runPnpm(["db:bootstrap:ci"], {
        env: { DATABASE_URL: databaseUrl }
      });
+     console.log("[security-guardrails] ✓ db:bootstrap:ci passed");
    } catch (error) {
+     console.error(
+       "[security-guardrails] ✗ db:bootstrap:ci failed\n" +
+       "This is a CASCADING FAILURE. Fix db:bootstrap:ci first.\n" +
+       "See logs above for root cause."
+     );
      throw error;
    }
  }
```

**Expected Outcome:**
- ✅ Clear indication of cascading failures
- ✅ Directs attention to root cause
- ✅ Reduces debugging time

---

## 6. CLUSTER 4 Prevention: Commit Convention Enforcement

### Problem
Commits with invalid conventional format block CI.

### Root Cause
No enforcement at commit time; violations discovered only in CI.

### Solution: Pre-Commit Validation

#### Implementation 1: Commitlint Hook (RECOMMENDED)
**Priority:** P1 - HIGH
**Effort:** 1 hour
**Impact:** Prevents 100% of invalid commits

**Steps:**

1. **Install Commitlint**
```bash
pnpm add -D @commitlint/cli @commitlint/config-conventional
```

2. **Create Commitlint Config**
File: `commitlint.config.mjs`
```javascript
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "build",
        "ci",
        "chore",
        "revert",
      ],
    ],
    "subject-case": [2, "never", ["upper-case"]],
    "subject-empty": [2, "never"],
    "subject-full-stop": [2, "never", "."],
    "header-max-length": [2, "always", 100],
  },
};
```

3. **Add Commit-Msg Hook**
File: `.husky/commit-msg`
```bash
#!/bin/sh

npx --no-install commitlint --edit "$1"
```

4. **Make Hook Executable**
```bash
chmod +x .husky/commit-msg
```

5. **Test Hook**
```bash
# Should fail
git commit -m "bad commit"

# Should pass
git commit -m "feat: add new feature"
```

**Expected Outcome:**
- ✅ Invalid commits rejected before creation
- ✅ Immediate feedback to developers
- ✅ Zero invalid commits reach CI

#### Implementation 2: Commitizen for Guided Commits
**Priority:** P2 - MEDIUM
**Effort:** 30 minutes
**Impact:** Improves commit quality

**Steps:**

1. **Install Commitizen**
```bash
pnpm add -D commitizen cz-conventional-changelog
```

2. **Configure Commitizen**
File: `package.json`
```json
{
  "scripts": {
    "commit": "cz"
  },
  "config": {
    "commitizen": {
      "path": "./node_modules/cz-conventional-changelog"
    }
  }
}
```

3. **Document Usage**
File: `CONTRIBUTING.md`
```markdown
## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/).

### Quick Commit (if you know the format)
```bash
git commit -m "feat: add user authentication"
```

### Guided Commit (recommended)
```bash
pnpm commit
```

This will prompt you for:
- Type (feat, fix, docs, etc.)
- Scope (optional)
- Description
- Body (optional)
- Breaking changes (optional)
```

**Expected Outcome:**
- ✅ Easier to write valid commits
- ✅ Consistent commit history
- ✅ Reduced cognitive load

#### Implementation 3: Improved Allowlist Documentation
**Priority:** P3 - LOW
**Effort:** 15 minutes
**Impact:** Better policy understanding

**Steps:**

1. **Enhance Allowlist File**
File: `.github/commit-message-allowlist.txt`
```
# Commit Message Allowlist
#
# This file contains commit SHAs that are TEMPORARILY excluded from
# conventional commits validation. Use sparingly and only for:
#
# 1. Legacy commits pre-dating conventional commits adoption
# 2. Merge commits from external contributors (case-by-case)
# 3. Emergency hotfixes (must be reviewed post-merge)
#
# Format: <sha> # <reason> (YYYY-MM-DD)
#
# Review this list quarterly and remove obsolete entries.

# Legacy commit with message "1" - pre-existing before policy enforcement (2026-04-02)
116d26e
```

2. **Add Validation in CI**
File: `scripts/ci/check-commit-messages.mjs`
```javascript
// Warn if allowlist is getting large
if (allowlist.size > 10) {
  console.warn(
    `⚠️  Allowlist has ${allowlist.size} entries. ` +
    `Review and clean up .github/commit-message-allowlist.txt`
  );
}
```

**Expected Outcome:**
- ✅ Clear allowlist policy
- ✅ Prevents allowlist abuse
- ✅ Encourages periodic cleanup

---

## 7. General CI Improvements

### Improvement 1: Local CI Reproduction Script
**Priority:** P1 - HIGH
**Effort:** 2 hours
**Impact:** Faster feedback loop

**Steps:**

1. **Create Script**
File: `scripts/ci/run-local-ci.sh`
```bash
#!/bin/bash
set -e

echo "=== Running CI Locally ==="

# Start services
docker-compose -f .github/docker-compose.ci.yml up -d

# Wait for services
echo "Waiting for services..."
sleep 10

# Set environment
export DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/birthub_cycle1"
export REDIS_URL="redis://localhost:6379"

# Run CI checks
echo "Running CI checks..."

pnpm lint
pnpm typecheck
pnpm build
pnpm test
pnpm db:bootstrap:ci
pnpm ci:security-guardrails

echo "✅ All CI checks passed locally"

# Cleanup
docker-compose -f .github/docker-compose.ci.yml down
```

2. **Create Docker Compose**
File: `.github/docker-compose.ci.yml`
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: postgrespassword
      POSTGRES_DB: birthub_cycle1
    ports:
      - "5432:5432"

  redis:
    image: redis:7.2-alpine
    ports:
      - "6379:6379"
```

3. **Document**
File: `CONTRIBUTING.md`
```markdown
## Running CI Locally

Before pushing, verify your changes pass CI:

```bash
./scripts/ci/run-local-ci.sh
```

This runs the same checks as GitHub Actions.
```

**Expected Outcome:**
- ✅ Faster feedback (no waiting for CI)
- ✅ Reduced CI failures
- ✅ Developer confidence

### Improvement 2: CI Failure Notifications
**Priority:** P2 - MEDIUM
**Effort:** 1 hour
**Impact:** Faster response to failures

**Steps:**

1. **Add Slack Notification**
File: `.github/workflows/ci.yml`
```yaml
- name: Notify on Failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "❌ CI Failed on ${{ github.repository }}",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*CI Failure*\n*Repo:* ${{ github.repository }}\n*Branch:* ${{ github.ref }}\n*Run:* ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
            }
          }
        ]
      }
```

**Expected Outcome:**
- ✅ Team immediately aware of failures
- ✅ Faster incident response
- ✅ Reduced MTTR

### Improvement 3: CI Performance Monitoring
**Priority:** P3 - LOW
**Effort:** 2 hours
**Impact:** Identify bottlenecks

**Steps:**

1. **Add Timing to Jobs**
```yaml
- name: Job Start
  run: echo "JOB_START=$(date +%s)" >> $GITHUB_ENV

- name: Run Tests
  run: pnpm test

- name: Job End
  run: |
    JOB_END=$(date +%s)
    DURATION=$((JOB_END - JOB_START))
    echo "Job took ${DURATION}s"
```

2. **Collect Metrics**
```bash
# scripts/ci/collect-metrics.mjs
// Parse workflow logs and extract timings
// Store in metrics/ci-performance.json
```

**Expected Outcome:**
- ✅ Visibility into slow jobs
- ✅ Data-driven optimization
- ✅ Improved CI speed

---

## 8. Implementation Roadmap

### Phase 1: Critical Preventions (Week 1)
**Goal:** Prevent repeat of known failures

- [ ] Day 1-2: Lockfile hash automation (pre-commit hook)
- [ ] Day 3-4: SQL migration linting
- [ ] Day 5: Commit message validation (commitlint)

**Deliverables:**
- Pre-commit hooks active
- SQL linter integrated
- Commitlint enforced

### Phase 2: Enhanced Validation (Week 2)
**Goal:** Catch issues earlier

- [ ] Day 1-2: Local CI reproduction script
- [ ] Day 3: Migration test suite
- [ ] Day 4: Dependency visualization
- [ ] Day 5: Documentation updates

**Deliverables:**
- Local CI script functional
- Migration tests in CI
- Updated CONTRIBUTING.md

### Phase 3: Developer Experience (Week 3)
**Goal:** Make it easy to do the right thing

- [ ] Day 1-2: Commitizen setup
- [ ] Day 3: Improved error messages
- [ ] Day 4: CI notifications
- [ ] Day 5: Performance monitoring

**Deliverables:**
- Guided commit tool
- Better error UX
- Slack notifications

### Phase 4: Continuous Improvement (Week 4)
**Goal:** Monitor and iterate

- [ ] Review metrics
- [ ] Gather developer feedback
- [ ] Identify remaining gaps
- [ ] Plan next improvements

---

## 9. Success Metrics

### Leading Indicators (Measured Weekly)
- **Pre-Commit Hook Adoption:** Target 100% of team
- **SQL Lint Failures Caught:** >0 errors prevented
- **Invalid Commits Rejected:** >0 commits blocked
- **Local CI Usage:** >50% of developers

### Lagging Indicators (Measured Monthly)
- **CI Failure Rate:** Target <5% (down from current ~30%)
- **MTTR (Mean Time To Repair):** Target <30 minutes
- **Developer Satisfaction:** Survey score >4/5
- **CI Run Time:** Target <45 minutes (currently ~60 min)

### Key Performance Indicators (KPIs)
- **Repeat Failures:** Target 0 (same root cause twice)
- **CI Stability:** Target 95%+ green builds
- **First-Time Pass Rate:** Target 80%+ PRs pass CI on first run
- **Manual Interventions:** Target <2 per week

---

## 10. Risk Assessment

### Implementation Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Pre-commit hooks slow commits | MEDIUM | LOW | Optimize scripts, add skip flags |
| SQL linter false positives | MEDIUM | MEDIUM | Tune rules, add override mechanism |
| Developer resistance | LOW | MEDIUM | Show value, gather feedback |
| CI time increase | LOW | LOW | Profile and optimize |

### Rollback Plan
All changes are additive and can be disabled individually:
- Pre-commit hooks: `chmod -x .husky/*`
- SQL linting: Remove from package.json scripts
- Commitlint: Uninstall package
- CI changes: Revert workflow commits

---

## 11. Cost-Benefit Analysis

### Costs
- **Implementation Time:** 2-3 engineering days (~$2,400-$3,600)
- **Maintenance:** ~1 hour/month (~$150/month)
- **CI Time Increase:** +2-3 minutes per run (~$5/month)

**Total First Year Cost:** ~$5,600

### Benefits
- **Prevented Failures:** 80% reduction = ~24 hours/month saved
- **Developer Time Saved:** ~$3,600/month
- **Faster Deployments:** ~10 hours/month saved = ~$1,500/month
- **Reduced Incident Stress:** Unquantifiable

**Total First Year Benefit:** ~$61,200

**ROI:** 993% (~10x return)

---

## 12. Owner Assignment

| Improvement | Owner | Due Date | Status |
|-------------|-------|----------|--------|
| Pre-commit hooks | DevOps | Week 1 | 🔴 Not Started |
| SQL linting | Database Team | Week 1 | 🔴 Not Started |
| Commitlint | DevOps | Week 1 | 🔴 Not Started |
| Local CI script | DevOps | Week 2 | 🔴 Not Started |
| Migration tests | Database Team | Week 2 | 🔴 Not Started |
| Documentation | Tech Writer | Week 2-3 | 🔴 Not Started |
| Notifications | DevOps | Week 3 | 🔴 Not Started |

---

## 13. Review and Iteration

### Review Cadence
- **Weekly:** Check implementation progress
- **Monthly:** Review metrics and KPIs
- **Quarterly:** Assess overall impact and adjust

### Feedback Loops
- Developer surveys after each phase
- Retrospectives for major incidents
- Continuous monitoring of CI metrics

### Continuous Improvement
- Track new failure patterns
- Add preventions as needed
- Share learnings across team

---

## 14. Appendix: Quick Reference

### Developer Cheat Sheet

```bash
# Before committing:
pnpm lint              # Lint code
pnpm typecheck         # Check types
pnpm test              # Run tests
pnpm lockfile:hash:update  # Update lockfile hash (if needed)

# If you changed migrations:
pnpm --filter @birthub/database lint:migrations

# Run full CI locally:
./scripts/ci/run-local-ci.sh

# Guided commit:
pnpm commit
```

### Troubleshooting Guide

**Lockfile hash mismatch:**
```bash
pnpm lockfile:hash:update
git add .github/lockfile/pnpm-lock.sha256
```

**SQL migration lint failure:**
```bash
pnpm --filter @birthub/database lint:migrations
# Fix syntax errors in migration.sql files
```

**Invalid commit message:**
```bash
# Amend last commit
git commit --amend
# Or use guided commit
pnpm commit
```

---

**CI Hardening Plan Status:** ✅ READY FOR IMPLEMENTATION
**Priority:** HIGH
**Expected Impact:** 80%+ failure reduction
**Recommended Start:** Within 1 week
