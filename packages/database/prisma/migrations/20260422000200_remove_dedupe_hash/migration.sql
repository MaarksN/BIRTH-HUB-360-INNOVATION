-- Drop legacy dedupeHash artifact
DROP INDEX IF EXISTS "workflow_executions_tenantId_dedupeHash_idx";
ALTER TABLE "workflow_executions" DROP COLUMN IF EXISTS "dedupeHash";
