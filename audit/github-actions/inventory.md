# GitHub Actions Inventory

## Agent Packs Conformity (`.github/workflows/agents-conformity.yml`)

- Jobs: 1
- Job `validate-agent-packs` (validate-agent-packs): runner=`ubuntu-latest` uses=`None` steps=7
    - Step `Checkout` uses: `actions/checkout@v6`
    - Step `Setup pnpm` uses: `pnpm/action-setup@v6`
    - Step `Setup Node` uses: `actions/setup-node@v6`
    - Step `Install dependencies` run: `corepack pnpm install --frozen-lockfile`
    - Step `Validate generated collection` run: `corepack pnpm --filter @birthub/agent-packs validate`
    - Step `Test generated collection` run: `corepack pnpm --filter @birthub/agent-packs test`
    - Step `Upload generated collection evidence` uses: `actions/upload-artifact@v7`

## Cleanup Merged Branches (`.github/workflows/branch-cleanup.yml`)

- Jobs: 1
- Job `cleanup_branch` (cleanup_branch): runner=`ubuntu-latest` uses=`None` steps=1
    - Step `Delete Branch` uses: `dawidd6/action-delete-branch@v3`

## CD (`.github/workflows/cd.yml`)

- Jobs: 12
- Job `resolve-release-source` (resolve-release-source): runner=`ubuntu-latest` uses=`None` steps=1
    - Step `Resolve immutable release source` run: `set -euo pipefail event_name="${GITHUB_EVENT_NAME}" source_event="${event_name}" if [[ "${event_name}" == "workflow_run" ]]; then if [[ "${{ github.event.workflow_run.head_branch }}" != "main" ]]; then echo "::error titl`
- Job `staging-preflight` (staging-preflight): runner=`ubuntu-latest` uses=`None` steps=8
    - Step `Checkout source from CI run` uses: `actions/checkout@v6`
    - Step `Setup pnpm` uses: `pnpm/action-setup@v6`
    - Step `Setup Node.js` uses: `actions/setup-node@v6`
    - Step `Install dependencies` run: `pnpm install --frozen-lockfile`
    - Step `Mask configured secrets` run: `set -euo pipefail for key in AUTH_MFA_ENCRYPTION_KEY DATABASE_URL JOB_HMAC_GLOBAL_SECRET REDIS_URL RENDER_STAGING_DEPLOY_HOOK_URL SENTRY_DSN SESSION_SECRET STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET; do value="${!key:-}" if`
    - Step `Validate required staging configuration` run: `set -euo pipefail required_secrets=( RENDER_STAGING_DEPLOY_HOOK_URL DATABASE_URL REDIS_URL SESSION_SECRET JOB_HMAC_GLOBAL_SECRET AUTH_MFA_ENCRYPTION_KEY STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET SENTRY_DSN ) required_vars=`
    - Step `Run staging preflight` run: `pnpm release:preflight:staging`
    - Step `Upload staging preflight evidence` uses: `actions/upload-artifact@v7`
- Job `release-sbom` (release-sbom): runner=`ubuntu-latest` uses=`None` steps=8
    - Step `Checkout immutable release source` uses: `actions/checkout@v6`
    - Step `Setup pnpm` uses: `pnpm/action-setup@v6`
    - Step `Setup Node.js` uses: `actions/setup-node@v6`
    - Step `Install dependencies` run: `pnpm install --frozen-lockfile`
    - Step `Generate CycloneDX SBOM` run: `pnpm release:sbom`
    - Step `Materialize release bundle manifests` run: `set -euo pipefail pnpm release:materialize -- \ --tag=v1.0.0 \ --source-event="${{ needs.resolve-release-source.outputs.source_event }}" \ --source-ref="${{ needs.resolve-release-source.outputs.source_ref }}" \ --source-`
    - Step `Upload SBOM artifact` uses: `actions/upload-artifact@v7`
    - Step `Upload release manifests` uses: `actions/upload-artifact@v7`
- Job `production-preflight` (production-preflight): runner=`ubuntu-latest` uses=`None` steps=8
    - Step `Checkout immutable release source` uses: `actions/checkout@v6`
    - Step `Setup pnpm` uses: `pnpm/action-setup@v6`
    - Step `Setup Node.js` uses: `actions/setup-node@v6`
    - Step `Install dependencies` run: `pnpm install --frozen-lockfile`
    - Step `Mask configured secrets` run: `set -euo pipefail for key in AUTH_MFA_ENCRYPTION_KEY DATABASE_URL JOB_HMAC_GLOBAL_SECRET REDIS_URL RENDER_PRODUCTION_DEPLOY_HOOK_URL SENTRY_DSN SESSION_SECRET STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET; do value="${!key:-}"`
    - Step `Validate required production configuration` run: `set -euo pipefail required_secrets=( RENDER_PRODUCTION_DEPLOY_HOOK_URL DATABASE_URL REDIS_URL SESSION_SECRET JOB_HMAC_GLOBAL_SECRET AUTH_MFA_ENCRYPTION_KEY STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET SENTRY_DSN ) required_va`
    - Step `Run production preflight` run: `pnpm release:preflight:production`
    - Step `Upload production preflight evidence` uses: `actions/upload-artifact@v7`
- Job `build-staging-images` (build-staging-images): runner=`ubuntu-latest` uses=`None` steps=9
    - Step `Checkout immutable release source` uses: `actions/checkout@v6`
    - Step `Authenticate to Google Cloud` uses: `google-github-actions/auth@v3`
    - Step `Setup gcloud` uses: `google-github-actions/setup-gcloud@v3`
    - Step `Setup Docker Buildx` uses: `docker/setup-buildx-action@v4`
    - Step `Compute image refs` run: `set -euo pipefail SHORT_SHA="${{ needs.resolve-release-source.outputs.source_sha }}" SHORT_SHA="${SHORT_SHA:0:12}" REGISTRY="${{ vars.GCP_ARTIFACT_REGISTRY_REGION }}-docker.pkg.dev/${{ vars.GCP_PROJECT_ID }}/${{ vars.GCP`
    - Step `Configure Artifact Registry auth` run: `gcloud auth configure-docker "${{ vars.GCP_ARTIFACT_REGISTRY_REGION }}-docker.pkg.dev" --quiet`
    - Step `Build and push API image` run: `docker build -f apps/api/Dockerfile -t "${{ steps.refs.outputs.api_image }}" . docker push "${{ steps.refs.outputs.api_image }}"`
    - Step `Build and push Web image` run: `docker build -f apps/web/Dockerfile -t "${{ steps.refs.outputs.web_image }}" . docker push "${{ steps.refs.outputs.web_image }}"`
    - Step `Build and push Worker image` run: `docker build -f apps/worker/Dockerfile -t "${{ steps.refs.outputs.worker_image }}" . docker push "${{ steps.refs.outputs.worker_image }}"`
- Job `deploy-staging` (deploy-staging): runner=`ubuntu-latest` uses=`None` steps=4
    - Step `Authenticate to Google Cloud` uses: `google-github-actions/auth@v3`
    - Step `Setup gcloud` uses: `google-github-actions/setup-gcloud@v3`
    - Step `Deploy staging revisions` run: `set -euo pipefail REGION="${{ vars.CLOUD_RUN_REGION }}" mkdir -p artifacts/release : > artifacts/release/staging-rollout.tsv while IFS='|' read -r component service image; do before_json="artifacts/release/${component}-b`
    - Step `Upload staging rollout manifest` uses: `actions/upload-artifact@v7`
- Job `backup-health-gate` (backup-health-gate): runner=`ubuntu-latest` uses=`None` steps=6
    - Step `Checkout immutable release source` uses: `actions/checkout@v6`
    - Step `Setup pnpm` uses: `pnpm/action-setup@v6`
    - Step `Setup Node.js` uses: `actions/setup-node@v6`
    - Step `Install dependencies` run: `pnpm install --frozen-lockfile`
    - Step `Run backup health gate` run: `pnpm ops:backup:health`
    - Step `Upload backup health evidence` uses: `actions/upload-artifact@v7`
- Job `release-smoke-gate` (release-smoke-gate): runner=`ubuntu-latest` uses=`None` steps=6
    - Step `Checkout immutable release source` uses: `actions/checkout@v6`
    - Step `Setup pnpm` uses: `pnpm/action-setup@v6`
    - Step `Setup Node.js` uses: `actions/setup-node@v6`
    - Step `Install dependencies` run: `pnpm install --frozen-lockfile`
    - Step `Run release smoke gate` run: `pnpm release:smoke`
    - Step `Upload smoke evidence` uses: `actions/upload-artifact@v7`
- Job `release-e2e-gate` (release-e2e-gate): runner=`ubuntu-latest` uses=`None` steps=6
    - Step `Checkout immutable release source` uses: `actions/checkout@v6`
    - Step `Setup pnpm` uses: `pnpm/action-setup@v6`
    - Step `Setup Node.js` uses: `actions/setup-node@v6`
    - Step `Install dependencies` run: `pnpm install --frozen-lockfile`
    - Step `Run release E2E gate` run: `pnpm test:e2e:release`
    - Step `Upload E2E evidence` uses: `actions/upload-artifact@v7`
- Job `rollback-rehearsal-evidence-gate` (rollback-rehearsal-evidence-gate): runner=`ubuntu-latest` uses=`None` steps=10
    - Step `Checkout immutable release source` uses: `actions/checkout@v6`
    - Step `Setup pnpm` uses: `pnpm/action-setup@v6`
    - Step `Setup Node.js` uses: `actions/setup-node@v6`
    - Step `Install dependencies` run: `pnpm install --frozen-lockfile`
    - Step `Download production preflight evidence` uses: `actions/download-artifact@v6`
    - Step `Download smoke evidence` uses: `actions/download-artifact@v6`
    - Step `Download release manifests` uses: `actions/download-artifact@v6`
    - Step `Download release SBOM` uses: `actions/download-artifact@v6`
    - Step `Materialize rollback rehearsal evidence` run: `pnpm release:rollback:evidence:auto -- --target=production`
    - Step `Upload rollback rehearsal evidence` uses: `actions/upload-artifact@v7`
- Job `dr-readiness-gate` (dr-readiness-gate): runner=`ubuntu-latest` uses=`None` steps=8
    - Step `Checkout immutable release source` uses: `actions/checkout@v6`
    - Step `Setup pnpm` uses: `pnpm/action-setup@v6`
    - Step `Setup Node.js` uses: `actions/setup-node@v6`
    - Step `Install dependencies` run: `pnpm install --frozen-lockfile`
    - Step `Download rollback rehearsal evidence` uses: `actions/download-artifact@v6`
    - Step `Download smoke evidence` uses: `actions/download-artifact@v6`
    - Step `Rebuild backup and DR readiness evidence` run: `set -euo pipefail pnpm ops:backup:health pnpm ops:dr:record:auto -- --environment=production --owner=platform-ops --scenario="automated release readiness rehearsal" pnpm ops:dr:report`
    - Step `Upload disaster recovery readiness evidence` uses: `actions/upload-artifact@v7`
- Job `deploy-production` (deploy-production): runner=`ubuntu-latest` uses=`None` steps=5
    - Step `Guard production deployment branch` run: `set -euo pipefail if [[ "${GITHUB_REF}" != "refs/heads/main" ]]; then echo "::error title=Invalid branch::Production deploy can only run from main." >&2 exit 1 fi`
    - Step `Mask deploy hook` run: `set -euo pipefail if [[ -n "${RENDER_PRODUCTION_DEPLOY_HOOK_URL:-}" ]]; then echo "::add-mask::${RENDER_PRODUCTION_DEPLOY_HOOK_URL}" fi`
    - Step `Trigger Render deploy hook (production)` run: `set -euo pipefail if [[ -z "${RENDER_PRODUCTION_DEPLOY_HOOK_URL:-}" ]]; then echo "::error title=Missing secret::RENDER_PRODUCTION_DEPLOY_HOOK_URL is not configured in Environment production secrets." >&2 exit 1 fi if ! `
    - Step `Generate deploy manifest` run: `mkdir -p artifacts/release cat > artifacts/release/deploy-manifest.json <<EOF { "status": "deployed", "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)", "sourceEvent": "${{ needs.resolve-release-source.outputs.source_event }`
    - Step `Upload deploy manifest` uses: `actions/upload-artifact@v7`

## CI (`.github/workflows/ci.yml`)

- Jobs: 19
- Job `branch-name` (branch-name): runner=`None` uses=`./.github/workflows/reusable-node-check.yml` steps=0
  - Reusable command: `pnpm branch:check`
- Job `commit-messages` (commitlint): runner=`None` uses=`./.github/workflows/reusable-node-check.yml` steps=0
  - Reusable command: `pnpm ci:commitlint`
- Job `lockfile-integrity` (lockfile-integrity): runner=`ubuntu-latest` uses=`None` steps=11
    - Step `Checkout` uses: `actions/checkout@v6`
    - Step `Setup pnpm` uses: `pnpm/action-setup@v6`
    - Step `Setup Node.js` uses: `actions/setup-node@v6`
    - Step `Install dependencies` run: `pnpm install --frozen-lockfile`
    - Step `Enforce agent surface freeze` run: `node scripts/ci/check-agent-surface-freeze.mjs`
    - Step `Enforce legacy DB surface freeze` run: `node scripts/ci/check-legacy-db-surface-freeze.mjs`
    - Step `Enforce legacy runtime surface freeze` run: `node scripts/ci/check-legacy-runtime-surface-freeze.mjs`
    - Step `Enforce active product capability alignment` run: `pnpm ci:active-product-capabilities`
    - Step `Enforce default e2e surface freeze` run: `pnpm ci:default-e2e-surface-freeze`
    - Step `Enforce web inline style freeze` run: `node scripts/ci/check-web-inline-style-freeze.mjs`
    - Step `Enforce lockfile governance` run: `pnpm ci:lockfile`
- Job `lockfile-corruption-simulation` (lockfile-corruption-simulation): runner=`ubuntu-latest` uses=`None` steps=6
    - Step `Checkout` uses: `actions/checkout@v6`
    - Step `Setup pnpm` uses: `pnpm/action-setup@v6`
    - Step `Setup Node.js` uses: `actions/setup-node@v6`
    - Step `Corrupt lockfile fixture` run: `set -euo pipefail cp pnpm-lock.yaml pnpm-lock.yaml.bak printf '\n__corrupted_lockfile_marker: [\n' >> pnpm-lock.yaml`
    - Step `Assert frozen install fails on corrupted lockfile` run: `set +e pnpm install --frozen-lockfile > lockfile-corruption.log 2>&1 status=$? set -e if [[ "${status}" -eq 0 ]]; then echo "::error title=Lockfile corruption simulation failed::pnpm install unexpectedly succeeded." cat `
    - Step `Restore lockfile` run: `mv pnpm-lock.yaml.bak pnpm-lock.yaml`
- Job `inline-credentials` (inline-credentials): runner=`None` uses=`./.github/workflows/reusable-node-check.yml` steps=0
  - Reusable command: `pnpm security:inline-credentials`
- Job `documentation-links` (documentation-links): runner=`None` uses=`./.github/workflows/reusable-node-check.yml` steps=0
  - Reusable command: `pnpm docs:check-links`
- Job `repo-hygiene` (repo-hygiene): runner=`None` uses=`./.github/workflows/reusable-node-check.yml` steps=0
  - Reusable command: `pnpm hygiene:check`
- Job `gitleaks` (gitleaks): runner=`ubuntu-latest` uses=`None` steps=2
    - Step `Checkout` uses: `actions/checkout@v6`
    - Step `Run Gitleaks` uses: `gitleaks/gitleaks-action@v2`
- Job `security-guardrails` (security-guardrails): runner=`ubuntu-latest` uses=`None` steps=6
  - Services: `postgres`
    - Step `Checkout` uses: `actions/checkout@v6`
    - Step `Setup pnpm` uses: `pnpm/action-setup@v6`
    - Step `Setup Node.js` uses: `actions/setup-node@v6`
    - Step `Install dependencies` run: `pnpm install --frozen-lockfile`
    - Step `Generate Prisma client` run: `pnpm db:generate`
    - Step `Enforce security guardrails` run: `pnpm ci:security-guardrails`
- Job `platform` (platform (${{ matrix.task }})): runner=`ubuntu-latest` uses=`None` steps=8
  - Matrix: `{"task": ["lint", "typecheck", "test", "test:isolation", "build"]}`
  - Services: `postgres, redis`
    - Step `Checkout` uses: `actions/checkout@v6`
    - Step `Setup pnpm` uses: `pnpm/action-setup@v6`
    - Step `Setup Node.js` uses: `actions/setup-node@v6`
    - Step `Cache Turbo` uses: `actions/cache@v5`
    - Step `Install dependencies` run: `pnpm install --frozen-lockfile`
    - Step `Generate Prisma client` run: `pnpm db:generate`
    - Step `Bootstrap CI database` run: `pnpm db:bootstrap:ci`
    - Step `Run ${{ matrix.task }}` run: `pnpm ci:task ${{ matrix.task }}`
- Job `satellites` (satellites): runner=`ubuntu-latest` uses=`None` steps=7
    - Step `Checkout` uses: `actions/checkout@v6`
    - Step `Setup pnpm` uses: `pnpm/action-setup@v6`
    - Step `Setup Node.js` uses: `actions/setup-node@v6`
    - Step `Setup Python` uses: `actions/setup-python@v6`
    - Step `Install dependencies` run: `pnpm install --frozen-lockfile`
    - Step `Install Python test dependencies` run: `python -m pip install --upgrade pip python -m pip install -r requirements-test.txt -r apps/webhook-receiver/requirements.txt`
    - Step `Run satellites lane` run: `pnpm ci:task satellites`
- Job `workflow-suite` (workflow-suite): runner=`ubuntu-latest` uses=`None` steps=8
  - Services: `postgres, redis`
    - Step `Checkout` uses: `actions/checkout@v6`
    - Step `Setup pnpm` uses: `pnpm/action-setup@v6`
    - Step `Setup Node.js` uses: `actions/setup-node@v6`
    - Step `Setup Python` uses: `actions/setup-python@v6`
    - Step `Install dependencies` run: `pnpm install --frozen-lockfile`
    - Step `Generate Prisma client` run: `pnpm db:generate`
    - Step `Bootstrap CI database` run: `pnpm db:bootstrap:ci`
    - Step `Run workflow suite` run: `pnpm ci:task workflow-suite`
- Job `integration-db` (integration-db): runner=`ubuntu-latest` uses=`None` steps=6
  - Services: `postgres, redis`
    - Step `Checkout` uses: `actions/checkout@v6`
    - Step `Setup pnpm` uses: `pnpm/action-setup@v6`
    - Step `Setup Node.js` uses: `actions/setup-node@v6`
    - Step `Install dependencies` run: `pnpm install --frozen-lockfile`
    - Step `Generate Prisma client` run: `pnpm db:generate`
    - Step `Run integration lane with real database` run: `pnpm test:integration`
- Job `coverage-quality` (coverage-quality): runner=`ubuntu-latest` uses=`None` steps=12
  - Services: `postgres, redis`
    - Step `Checkout` uses: `actions/checkout@v6`
    - Step `Setup pnpm` uses: `pnpm/action-setup@v6`
    - Step `Setup Node.js` uses: `actions/setup-node@v6`
    - Step `Setup Python` uses: `actions/setup-python@v6`
    - Step `Install dependencies` run: `pnpm install --frozen-lockfile`
    - Step `Install Python coverage dependencies` run: `python -m pip install --upgrade pip python -m pip install -r requirements-test.txt -r apps/webhook-receiver/requirements.txt`
    - Step `Generate Prisma client` run: `pnpm db:generate`
    - Step `Bootstrap coverage database` run: `pnpm db:bootstrap:ci`
    - Step `Enforce TypeScript coverage baseline` run: `pnpm coverage:check`
    - Step `Enforce Python coverage baseline` run: `pnpm test:python:coverage`
    - Step `Detect dead code` run: `pnpm quality:dead-code`
    - Step `Upload coverage evidence` uses: `actions/upload-artifact@v7`
- Job `mutation-testing` (mutation-testing): runner=`None` uses=`./.github/workflows/reusable-node-check.yml` steps=0
  - Reusable command: `pnpm test:mutation`
- Job `pack-tests` (pack-tests): runner=`None` uses=`./.github/workflows/reusable-node-check.yml` steps=0
  - Reusable command: `pnpm ci:task pack-tests`
- Job `governance-gates` (governance-gates): runner=`None` uses=`./.github/workflows/reusable-node-check.yml` steps=0
  - Reusable command: `pnpm monorepo:doctor && RELEASE_SCORECARD_MIN_SCORE=100 pnpm release:scorecard && pnpm audit:ownership`
- Job `e2e-release` (e2e-release): runner=`None` uses=`./.github/workflows/reusable-node-check.yml` steps=0
  - Reusable command: `pnpm test:e2e:release`
- Job `ci` (ci): runner=`ubuntu-latest` uses=`None` steps=1
    - Step `Done` run: `echo "All required checks passed."`

## Dependabot Security Auto-Merge (`.github/workflows/dependabot-auto-merge.yml`)

- Jobs: 1
- Job `auto-merge` (auto-merge): runner=`ubuntu-latest` uses=`None` steps=2
    - Step `Fetch Dependabot metadata` uses: `dependabot/fetch-metadata@v3`
    - Step `Enable auto-merge for security patches` run: `gh pr merge --auto --squash "$PR_URL"`

## F4 Script Compliance (`.github/workflows/f4-script-compliance.yml`)

- Jobs: 1
- Job `workspace-compliance` (workspace-compliance): runner=`ubuntu-latest` uses=`None` steps=6
    - Step `Checkout` uses: `actions/checkout@v6`
    - Step `Setup pnpm` uses: `pnpm/action-setup@v6`
    - Step `Setup Node.js` uses: `actions/setup-node@v6`
    - Step `Install dependencies` run: `pnpm install --frozen-lockfile`
    - Step `Run workspace audit` run: `pnpm workspace:audit`
    - Step `Upload compliance artifacts` uses: `actions/upload-artifact@v7`

## Materialize Doc-Only Controls (`.github/workflows/materialize-doc-only.yml`)

- Jobs: 1
- Job `materialize-doc-only` (materialize-doc-only): runner=`ubuntu-latest` uses=`None` steps=6
    - Step `Checkout` uses: `actions/checkout@v6`
    - Step `Setup pnpm` uses: `pnpm/action-setup@v6`
    - Step `Setup Node.js` uses: `actions/setup-node@v6`
    - Step `Install dependencies` run: `pnpm install --frozen-lockfile`
    - Step `Run technical materialization controls` run: `pnpm audit:materialize:all`
    - Step `Upload materialization report` uses: `actions/upload-artifact@v7`

## Release Rehearsal (`.github/workflows/release-rehearsal.yml`)

- Jobs: 1
- Job `cycle0-rehearsal` (cycle0-rehearsal): runner=`ubuntu-latest` uses=`None` steps=7
    - Step `Checkout` uses: `actions/checkout@v6`
    - Step `Setup pnpm` uses: `pnpm/action-setup@v6`
    - Step `Setup Node.js` uses: `actions/setup-node@v6`
    - Step `Install dependencies` run: `pnpm install --frozen-lockfile`
    - Step `Run recurring release rehearsal` run: `pnpm release:verify:cycle0`
    - Step `Rebuild backup and DR readiness evidence` run: `set -euo pipefail pnpm ops:backup:health pnpm ops:dr:record:auto -- --environment=production --owner=platform-ops --scenario="scheduled release rehearsal" pnpm ops:dr:report`
    - Step `Upload rehearsal artifacts` uses: `actions/upload-artifact@v7`

## Repository Health (`.github/workflows/repository-health.yml`)

- Jobs: 1
- Job `repository-health` (repository-health): runner=`ubuntu-latest` uses=`None` steps=7
    - Step `Checkout` uses: `actions/checkout@v6`
    - Step `Setup pnpm` uses: `pnpm/action-setup@v6`
    - Step `Setup Node.js` uses: `actions/setup-node@v6`
    - Step `Install dependencies` run: `pnpm install --frozen-lockfile`
    - Step `Clean stale untracked artifacts` run: `pnpm artifacts:clean -- --apply`
    - Step `Generate repository health report` run: `pnpm monorepo:doctor`
    - Step `Upload doctor artifacts` uses: `actions/upload-artifact@v7`

## Reusable Node Check (`.github/workflows/reusable-node-check.yml`)

- Jobs: 1
- Job `run` (run): runner=`ubuntu-latest` uses=`None` steps=7
    - Step `Checkout` uses: `actions/checkout@v6`
    - Step `Setup pnpm` uses: `pnpm/action-setup@v6`
    - Step `Setup Node.js` uses: `actions/setup-node@v6`
    - Step `Install dependencies` run: `pnpm install --frozen-lockfile`
    - Step `Install Playwright browsers` run: `pnpm exec playwright install --with-deps chromium`
    - Step `Prisma diagnostics` run: `node -e "const pkg=require('./packages/database/package.json'); console.log('prisma(dev):', pkg.devDependencies?.prisma ?? 'missing'); console.log('@prisma/client(dep):', pkg.dependencies?.['@prisma/client'] ?? 'missing'`
    - Step `Run command` run: `case "$WORKFLOW_COMMAND" in "pnpm branch:check") pnpm branch:check ;; "pnpm ci:commitlint") pnpm ci:commitlint ;; "pnpm security:inline-credentials") pnpm security:inline-credentials ;; "pnpm docs:check-links") pnpm docs`

## Security Scan (`.github/workflows/security-scan.yml`)

- Jobs: 6
- Job `semgrep` (semgrep (typescript + express)): runner=`ubuntu-latest` uses=`None` steps=2
    - Step `Checkout` uses: `actions/checkout@v6`
    - Step `Run Semgrep` uses: `semgrep/semgrep-action@v1`
- Job `dependency-audit` (npm audit (high+)): runner=`ubuntu-latest` uses=`None` steps=5
    - Step `Checkout` uses: `actions/checkout@v6`
    - Step `Setup pnpm` uses: `pnpm/action-setup@v6`
    - Step `Setup Node.js` uses: `actions/setup-node@v6`
    - Step `Install dependencies` run: `pnpm install --frozen-lockfile`
    - Step `Audit dependencies` run: `pnpm audit --audit-level=high`
- Job `python-security` (python-security): runner=`ubuntu-latest` uses=`None` steps=10
    - Step `Checkout` uses: `actions/checkout@v6`
    - Step `Setup pnpm` uses: `pnpm/action-setup@v6`
    - Step `Setup Node.js` uses: `actions/setup-node@v6`
    - Step `Setup Python` uses: `actions/setup-python@v6`
    - Step `Install dependencies` run: `pnpm install --frozen-lockfile`
    - Step `Install Python dependencies` run: `set -euo pipefail python -m pip install --upgrade pip python -m pip install -r requirements-test.txt bandit pip-audit "safety>=3.7.0"`
    - Step `Enforce Python workflow hard-fail policy` run: `python scripts/ci/check-python-workflow-hard-fail.py`
    - Step `Run Bandit` run: `python -m bandit -q -r agents apps/webhook-receiver -x "*/tests/*" -lll`
    - Step `Run pip-audit` run: `python -m pip_audit -r requirements-test.txt --ignore-vuln CVE-2026-4539`
    - Step `Run Safety` run: `python -m safety check --full-report -r requirements-test.txt`
- Job `rbac-suite` (RBAC suite): runner=`ubuntu-latest` uses=`None` steps=6
  - Services: `postgres, redis`
    - Step `Checkout` uses: `actions/checkout@v6`
    - Step `Setup pnpm` uses: `pnpm/action-setup@v6`
    - Step `Setup Node.js` uses: `actions/setup-node@v6`
    - Step `Install dependencies` run: `pnpm install --frozen-lockfile`
    - Step `Generate Prisma client` run: `pnpm db:generate`
    - Step `Run RBAC tests` run: `pnpm test:rbac`
- Job `zap-baseline` (OWASP ZAP baseline): runner=`ubuntu-latest` uses=`None` steps=10
    - Step `Checkout` uses: `actions/checkout@v6`
    - Step `Setup pnpm` uses: `pnpm/action-setup@v6`
    - Step `Setup Node.js` uses: `actions/setup-node@v6`
    - Step `Install dependencies` run: `pnpm install --frozen-lockfile`
    - Step `Build canonical web target` run: `pnpm --filter @birthub/web build`
    - Step `Start canonical web target` run: `set -euo pipefail mkdir -p artifacts/security/zap pnpm --filter @birthub/web start > artifacts/security/zap/web-server.log 2>&1 & echo "$!" > artifacts/security/zap/web-server.pid`
    - Step `Wait for canonical web target` run: `set -euo pipefail target_url="http://127.0.0.1:3001/login" for attempt in {1..60}; do if curl --silent --show-error --fail "$target_url" > /dev/null; then exit 0 fi sleep 2 done echo "Canonical web target did not become `
    - Step `ZAP baseline scan` run: `set -euo pipefail mkdir -p artifacts/security/zap docker run --rm --network host \ -v "${PWD}/artifacts/security/zap:/zap/wrk" \ ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \ -t http://127.0.0.1:3001/login \ -J zap-re`
    - Step `Stop canonical web target` run: `set -euo pipefail if [[ -f artifacts/security/zap/web-server.pid ]]; then pid="$(cat artifacts/security/zap/web-server.pid)" kill "$pid" 2>/dev/null || true fi`
    - Step `Upload ZAP artifacts` uses: `actions/upload-artifact@v7`
- Job `security-report` (security coverage report): runner=`ubuntu-latest` uses=`None` steps=7
    - Step `Checkout` uses: `actions/checkout@v6`
    - Step `Setup pnpm` uses: `pnpm/action-setup@v6`
    - Step `Setup Node.js` uses: `actions/setup-node@v6`
    - Step `Install dependencies` run: `pnpm install --frozen-lockfile`
    - Step `Verify auth guards` run: `pnpm security:guards`
    - Step `Generate security report` run: `pnpm security:report`
    - Step `Upload security report` uses: `actions/upload-artifact@v7`

