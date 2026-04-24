import assert from "node:assert/strict";
import test from "node:test";
import { processWorkflowExecutionJob } from "./worker.workflows.js";
import { prisma, WorkflowExecutionStatus, StepResultStatus } from "@birthub/database";

test("processWorkflowExecutionJob gracefully handles unknown workflow execution", async () => {
    // We mock Prisma to return null
    const originalFindUnique = prisma.workflowExecution.findUnique;
    (prisma.workflowExecution.findUnique as any) = async () => null;

    try {
        const result = await processWorkflowExecutionJob({
            data: { executionId: "nonexistent" }
        } as any);

        assert.equal(result.executed, false);
    } finally {
        prisma.workflowExecution.findUnique = originalFindUnique;
    }
});

test("processWorkflowExecutionJob executes connector action", async () => {
    const originalFindUnique = prisma.workflowExecution.findUnique;
    const originalUpdate = prisma.workflowExecution.update;
    const originalStepResultCreate = prisma.stepResult.create;
    const originalUsageCreate = prisma.usageRecord.create;

    let updateCalled = false;

    (prisma.workflowExecution.findUnique as any) = async () => ({
        id: "exec_1",
        workflowId: "wf_1",
        workflowRevisionId: "rev_1",
        organizationId: "org_1",
        tenantId: "tenant_1",
        isDryRun: true,
        startedAt: new Date(),
        revision: {
            definition: {
                steps: [
                    {
                        id: "step_1",
                        type: "CONNECTOR_ACTION",
                        config: {
                            action: "hubspot.crm.contact.upsert",
                            payload: {}
                        }
                    }
                ],
                transitions: []
            }
        }
    });

    (prisma.stepResult.create as any) = async () => ({ id: "res_1" });
    (prisma.usageRecord.create as any) = async () => ({ id: "usg_1" });

    const originalFindConnector = prisma.connectorAccount.findFirst;
    (prisma.connectorAccount.findFirst as any) = async () => ({ id: "acc_1", credentials: [] });
    (prisma.workflowExecution.update as any) = async (args: any) => {

        updateCalled = true;
        assert.equal(args.data.status, WorkflowExecutionStatus.SUCCESS);
        return args.data;
    };

    try {
        const result = await processWorkflowExecutionJob({
            data: { executionId: "exec_1" }
        } as any);

        assert.equal(result.executed, true);
        assert.equal(updateCalled, true);
    } finally {
        prisma.workflowExecution.findUnique = originalFindUnique;
        prisma.workflowExecution.update = originalUpdate;
        prisma.stepResult.create = originalStepResultCreate;
        prisma.connectorAccount.findFirst = originalFindConnector;
        prisma.usageRecord.create = originalUsageCreate;
    }
});
