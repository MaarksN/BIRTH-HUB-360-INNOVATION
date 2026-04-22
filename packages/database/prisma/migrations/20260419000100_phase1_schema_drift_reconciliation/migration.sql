-- Materialize schema-only changes that landed after the last recorded
-- migration so fresh CI databases match the canonical Prisma datamodel.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'organizations_pkey'
      AND conrelid = 'organizations'::regclass
  ) THEN
    ALTER TABLE "organizations" RENAME CONSTRAINT "organizations_pkey" TO "Organization_pkey";
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_pkey'
      AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE "users" RENAME CONSTRAINT "users_pkey" TO "User_pkey";
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'members_pkey'
      AND conrelid = 'members'::regclass
  ) THEN
    ALTER TABLE "members" RENAME CONSTRAINT "members_pkey" TO "Membership_pkey";
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'sessions_pkey'
      AND conrelid = 'sessions'::regclass
  ) THEN
    ALTER TABLE "sessions" RENAME CONSTRAINT "sessions_pkey" TO "Session_pkey";
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ConsentPurpose') THEN
    CREATE TYPE "ConsentPurpose" AS ENUM ('ANALYTICS', 'HEALTH_DATA_SHARING', 'MARKETING');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ConsentSource') THEN
    CREATE TYPE "ConsentSource" AS ENUM ('WEB', 'APP');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ConsentStatus') THEN
    CREATE TYPE "ConsentStatus" AS ENUM ('GRANTED', 'DENIED', 'PENDING');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RetentionAction') THEN
    CREATE TYPE "RetentionAction" AS ENUM ('DELETE', 'ANONYMIZE', 'ARCHIVE');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RetentionDataCategory') THEN
    CREATE TYPE "RetentionDataCategory" AS ENUM ('LOGS', 'ANALYTICS', 'PII', 'HEALTH');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RetentionExecutionMode') THEN
    CREATE TYPE "RetentionExecutionMode" AS ENUM ('DRY_RUN', 'EXECUTE');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "workflow_revisions" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "workflowId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "definition" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "workflow_revisions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "workflow_revisions_workflowId_version_key"
  ON "workflow_revisions"("workflowId", "version");

CREATE INDEX IF NOT EXISTS "workflow_revisions_tenantId_idx"
  ON "workflow_revisions"("tenantId");

CREATE INDEX IF NOT EXISTS "workflow_revisions_organizationId_idx"
  ON "workflow_revisions"("organizationId");

CREATE INDEX IF NOT EXISTS "workflow_revisions_workflowId_idx"
  ON "workflow_revisions"("workflowId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'workflow_revisions_organizationId_fkey'
      AND conrelid = 'workflow_revisions'::regclass
  ) THEN
    ALTER TABLE "workflow_revisions"
      ADD CONSTRAINT "workflow_revisions_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'workflow_revisions_workflowId_fkey'
      AND conrelid = 'workflow_revisions'::regclass
  ) THEN
    ALTER TABLE "workflow_revisions"
      ADD CONSTRAINT "workflow_revisions_workflowId_fkey"
      FOREIGN KEY ("workflowId") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

ALTER TABLE "workflow_executions"
  ADD COLUMN IF NOT EXISTS "isDryRun" BOOLEAN NOT NULL DEFAULT false;

DROP INDEX IF EXISTS "user_preferences_tenantId_lgpd_consent_status_idx";

ALTER TABLE "user_preferences"
  DROP COLUMN IF EXISTS "lgpd_consent_status",
  DROP COLUMN IF EXISTS "lgpd_consent_version",
  DROP COLUMN IF EXISTS "lgpd_consented_at",
  DROP COLUMN IF EXISTS "lgpd_legal_basis";

DROP TYPE IF EXISTS "LgpdConsentStatus";
DROP TYPE IF EXISTS "LgpdLegalBasis";

ALTER TABLE "workflow_revisions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workflow_revisions" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy_workflow_revisions ON "workflow_revisions";

CREATE POLICY tenant_isolation_policy_workflow_revisions ON "workflow_revisions"
  FOR ALL
  USING (tenant_access_allowed("tenantId"))
  WITH CHECK (tenant_access_allowed("tenantId"));
