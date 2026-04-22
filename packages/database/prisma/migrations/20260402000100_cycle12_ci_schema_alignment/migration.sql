-- Align historical migrations with the current Prisma datamodel so CI can
-- rely on migrate deploy alone instead of schema-engine reconciliation.

DROP INDEX IF EXISTS "audit_logs_tenantId_action_createdAt_idx";
DROP INDEX IF EXISTS "Membership_userId_idx";
DROP INDEX IF EXISTS "Session_organizationId_userId_idx";
DROP INDEX IF EXISTS "subscriptions_tenantId_id_idx";

ALTER TABLE "agent_handoffs" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "agents" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "connector_accounts" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "connector_credentials" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "connector_sync_cursors" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "conversation_threads" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "customers" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "invites" ALTER COLUMN "updatedAt" DROP DEFAULT;

CREATE INDEX IF NOT EXISTS "agent_executions_userId_idx" ON "agent_executions"("userId");
CREATE INDEX IF NOT EXISTS "agent_feedback_organizationId_idx" ON "agent_feedback"("organizationId");
CREATE INDEX IF NOT EXISTS "agent_feedback_userId_idx" ON "agent_feedback"("userId");
CREATE INDEX IF NOT EXISTS "agent_handoffs_thread_id_idx" ON "agent_handoffs"("thread_id");
CREATE INDEX IF NOT EXISTS "agents_organizationId_idx" ON "agents"("organizationId");
CREATE INDEX IF NOT EXISTS "api_keys_userId_idx" ON "api_keys"("userId");
CREATE INDEX IF NOT EXISTS "api_keys_rotatedFromId_idx" ON "api_keys"("rotatedFromId");
CREATE INDEX IF NOT EXISTS "conversation_threads_connector_account_id_idx" ON "conversation_threads"("connector_account_id");
CREATE INDEX IF NOT EXISTS "customers_organizationId_idx" ON "customers"("organizationId");
CREATE INDEX IF NOT EXISTS "dataset_exports_organizationId_idx" ON "dataset_exports"("organizationId");
CREATE INDEX IF NOT EXISTS "invites_organizationId_idx" ON "invites"("organizationId");
CREATE INDEX IF NOT EXISTS "invites_invitedByUserId_idx" ON "invites"("invitedByUserId");
CREATE INDEX IF NOT EXISTS "invoices_subscriptionId_idx" ON "invoices"("subscriptionId");
CREATE INDEX IF NOT EXISTS "login_alerts_organizationId_idx" ON "login_alerts"("organizationId");
CREATE INDEX IF NOT EXISTS "mfa_challenges_organizationId_idx" ON "mfa_challenges"("organizationId");
CREATE INDEX IF NOT EXISTS "notifications_organizationId_idx" ON "notifications"("organizationId");
CREATE INDEX IF NOT EXISTS "sessions_organizationId_idx" ON "sessions"("organizationId");
CREATE INDEX IF NOT EXISTS "sessions_replacedBySessionId_idx" ON "sessions"("replacedBySessionId");
CREATE INDEX IF NOT EXISTS "step_results_organizationId_idx" ON "step_results"("organizationId");
CREATE INDEX IF NOT EXISTS "subscriptions_planId_idx" ON "subscriptions"("planId");
CREATE INDEX IF NOT EXISTS "usage_records_subscriptionId_idx" ON "usage_records"("subscriptionId");
CREATE INDEX IF NOT EXISTS "webhook_endpoints_createdByUserId_idx" ON "webhook_endpoints"("createdByUserId");
CREATE INDEX IF NOT EXISTS "workflow_executions_organizationId_idx" ON "workflow_executions"("organizationId");
CREATE INDEX IF NOT EXISTS "workflow_steps_organizationId_idx" ON "workflow_steps"("organizationId");
CREATE INDEX IF NOT EXISTS "workflow_transitions_organizationId_idx" ON "workflow_transitions"("organizationId");
CREATE INDEX IF NOT EXISTS "workflows_organizationId_idx" ON "workflows"("organizationId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'audit_logs_tenantId_fkey'
      AND conrelid = 'audit_logs'::regclass
  ) THEN
    ALTER TABLE "audit_logs"
      ADD CONSTRAINT "audit_logs_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "organizations"("tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'quota_usage_tenantId_fkey'
      AND conrelid = 'quota_usage'::regclass
  ) THEN
    ALTER TABLE "quota_usage"
      ADD CONSTRAINT "quota_usage_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "organizations"("tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;
