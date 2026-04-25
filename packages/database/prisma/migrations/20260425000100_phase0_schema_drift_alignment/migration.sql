-- Align Prisma schema changes that were present in code but not recorded in
-- migrations, so schema drift gates can run against a freshly migrated DB.

-- AlterEnum
ALTER TYPE "WorkflowStepType" ADD VALUE 'CONNECTOR_ACTION';

-- DropIndex
DROP INDEX "workflow_transitions_workflowId_sourceStepId_targetStepId_r_key";

-- CreateIndex
CREATE INDEX "workflow_steps_tenantId_workflowRevisionId_idx" ON "workflow_steps"("tenantId", "workflowRevisionId");

-- CreateIndex
CREATE INDEX "workflow_transitions_tenantId_workflowRevisionId_idx" ON "workflow_transitions"("tenantId", "workflowRevisionId");

-- RenameIndex
ALTER INDEX "crm_sync_events_tenantId_provider_direction_external_event_id_i" RENAME TO "crm_sync_events_tenantId_provider_direction_external_event__idx";

-- RenameIndex
ALTER INDEX "workflow_transitions_workflowRevisionId_sourceStepId_targetStep" RENAME TO "workflow_transitions_workflowRevisionId_sourceStepId_target_key";
