-- Phase 3 workflow execution durability and revision lineage.

ALTER TABLE "workflow_executions"
  ADD COLUMN IF NOT EXISTS "workflowRevisionId" TEXT,
  ADD COLUMN IF NOT EXISTS "triggerEventId" TEXT,
  ADD COLUMN IF NOT EXISTS "triggerKey" TEXT,
  ADD COLUMN IF NOT EXISTS "eventSource" TEXT,
  ADD COLUMN IF NOT EXISTS "actorId" TEXT,
  ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'workflow_executions_workflowRevisionId_fkey'
      AND conrelid = 'workflow_executions'::regclass
  ) THEN
    ALTER TABLE "workflow_executions"
      ADD CONSTRAINT "workflow_executions_workflowRevisionId_fkey"
      FOREIGN KEY ("workflowRevisionId") REFERENCES "workflow_revisions"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

ALTER TABLE "workflow_steps"
  ADD COLUMN IF NOT EXISTS "workflowRevisionId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'workflow_steps_workflowRevisionId_fkey'
      AND conrelid = 'workflow_steps'::regclass
  ) THEN
    ALTER TABLE "workflow_steps"
      ADD CONSTRAINT "workflow_steps_workflowRevisionId_fkey"
      FOREIGN KEY ("workflowRevisionId") REFERENCES "workflow_revisions"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

ALTER TABLE "workflow_transitions"
  ADD COLUMN IF NOT EXISTS "workflowRevisionId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'workflow_transitions_workflowRevisionId_fkey'
      AND conrelid = 'workflow_transitions'::regclass
  ) THEN
    ALTER TABLE "workflow_transitions"
      ADD CONSTRAINT "workflow_transitions_workflowRevisionId_fkey"
      FOREIGN KEY ("workflowRevisionId") REFERENCES "workflow_revisions"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

ALTER TABLE "step_results"
  ADD COLUMN IF NOT EXISTS "workflowRevisionId" TEXT,
  ADD COLUMN IF NOT EXISTS "nextRetryAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "durationMs" INTEGER,
  ADD COLUMN IF NOT EXISTS "errorCode" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'step_results_workflowRevisionId_fkey'
      AND conrelid = 'step_results'::regclass
  ) THEN
    ALTER TABLE "step_results"
      ADD CONSTRAINT "step_results_workflowRevisionId_fkey"
      FOREIGN KEY ("workflowRevisionId") REFERENCES "workflow_revisions"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

UPDATE "step_results" sr
SET "workflowRevisionId" = we."workflowRevisionId"
FROM "workflow_executions" we
WHERE sr."executionId" = we."id"
  AND sr."workflowRevisionId" IS NULL
  AND we."workflowRevisionId" IS NOT NULL;

DROP INDEX IF EXISTS "workflow_steps_workflowId_key_key";
DROP INDEX IF EXISTS "workflow_transitions_workflowId_sourceStepId_targetStepId_route_key";
DROP INDEX IF EXISTS "workflow_executions_tenantId_workflowId_idempotencyKey_key";

CREATE UNIQUE INDEX IF NOT EXISTS "workflow_steps_workflowRevisionId_key_key"
  ON "workflow_steps"("workflowRevisionId", "key");

CREATE UNIQUE INDEX IF NOT EXISTS "workflow_transitions_workflowRevisionId_sourceStepId_targetStepId_route_key"
  ON "workflow_transitions"("workflowRevisionId", "sourceStepId", "targetStepId", "route");

CREATE UNIQUE INDEX IF NOT EXISTS "workflow_executions_tenantId_idempotencyKey_key"
  ON "workflow_executions"("tenantId", "idempotencyKey");

CREATE INDEX IF NOT EXISTS "workflow_executions_tenantId_workflowRevisionId_idx"
  ON "workflow_executions"("tenantId", "workflowRevisionId");

CREATE INDEX IF NOT EXISTS "step_results_tenantId_workflowRevisionId_idx"
  ON "step_results"("tenantId", "workflowRevisionId");

CREATE INDEX IF NOT EXISTS "step_results_tenantId_nextRetryAt_idx"
  ON "step_results"("tenantId", "nextRetryAt");
