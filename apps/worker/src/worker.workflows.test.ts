import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { processWorkflowExecutionJob } from "./worker.workflows.js";
import {
    Prisma,
    prisma,
    WorkflowExecutionStatus,
    StepResultStatus
} from "@birthub/database";
import type { Job } from "bullmq";

type WorkflowJob = Job<{ attempt?: number; executionId: string }>;

function stubMethod(target: object, key: string, value: unknown): () => void {
    const original = Reflect.get(target, key);
    Reflect.set(target, key, value);
    return () => {
        Reflect.set(target, key, original);
    };
}

function workflowJob(data: { attempt?: number; executionId: string }): WorkflowJob {
    return { data } as WorkflowJob;
}

function uniqueUsageEventError(): Prisma.PrismaClientKnownRequestError {
    return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        clientVersion: "test",
        code: "P2002",
        meta: {
            target: ["event_id"]
        }
    });
}

test("processWorkflowExecutionJob gracefully handles unknown workflow execution", async () => {
    const restoreFindUnique = stubMethod(prisma.workflowExecution, "findUnique", async () => null);

    try {
        const result = await processWorkflowExecutionJob(workflowJob({ executionId: "nonexistent" }));

        assert.equal(result.executed, false);
    } finally {
        restoreFindUnique();
    }
});

test("processWorkflowExecutionJob executes connector action", async () => {
    let updateCalled = false;
    let stepResultData: Record<string, unknown> | null = null;

    const restores = [
        stubMethod(prisma.workflowExecution, "findUnique", async () => ({
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
    })),
        stubMethod(prisma.stepResult, "create", async (args: { data: Record<string, unknown> }) => {
            stepResultData = args.data;
            return { id: "res_1" };
        }),
        stubMethod(prisma.usageRecord, "create", async () => ({ id: "usg_1" })),
        stubMethod(prisma.connectorAccount, "findFirst", async () => ({ id: "acc_1", credentials: [] })),
        stubMethod(prisma.workflowExecution, "update", async (args: { data: { status: WorkflowExecutionStatus } }) => {

        updateCalled = true;
        assert.equal(args.data.status, WorkflowExecutionStatus.SUCCESS);
        return args.data;
    })
    ];

    try {
        const result = await processWorkflowExecutionJob(workflowJob({ executionId: "exec_1" }));

        assert.equal(result.executed, true);
        assert.equal(updateCalled, true);
        assert.equal(stepResultData?.status, StepResultStatus.SUCCESS);
        assert.equal(stepResultData?.workflowRevisionId, "rev_1");
    } finally {
        for (const restore of restores.reverse()) {
            restore();
        }
    }
});

test("processWorkflowExecutionJob records idempotent usage for successful non-dry-run executions", async () => {
    let usageData: Record<string, unknown> | null = null;
    const restores = [
        stubMethod(prisma.workflowExecution, "findUnique", async () => ({
            id: "exec_2",
            workflowId: "wf_2",
            workflowRevisionId: "rev_2",
            organizationId: "org_1",
            tenantId: "tenant_1",
            isDryRun: false,
            startedAt: new Date("2026-04-01T10:00:00.000Z"),
            revision: {
                definition: {
                    steps: [],
                    transitions: []
                }
            }
        })),
        stubMethod(prisma.workflowExecution, "update", async (args: { data: Record<string, unknown> }) => args.data),
        stubMethod(prisma.usageRecord, "create", mock.fn(async (args: { data: Record<string, unknown> }) => {
            usageData = args.data;
            return { id: "usg_2" };
        }))
    ];

    try {
        const result = await processWorkflowExecutionJob(workflowJob({ executionId: "exec_2" }));

        assert.equal(result.executed, true);
        assert.equal(usageData?.eventId, "workflow.execution:exec_2");
        assert.equal(usageData?.metric, "workflow.execution");
        assert.equal(usageData?.unit, "execution");
    } finally {
        for (const restore of restores.reverse()) {
            restore();
        }
    }
});

test("processWorkflowExecutionJob treats duplicate usage records as idempotent", async () => {
    const restores = [
        stubMethod(prisma.workflowExecution, "findUnique", async () => ({
            id: "exec_3",
            workflowId: "wf_3",
            workflowRevisionId: "rev_3",
            organizationId: "org_1",
            tenantId: "tenant_1",
            isDryRun: false,
            startedAt: new Date("2026-04-01T10:00:00.000Z"),
            revision: {
                definition: {
                    steps: [],
                    transitions: []
                }
            }
        })),
        stubMethod(prisma.workflowExecution, "update", async (args: { data: Record<string, unknown> }) => args.data),
        stubMethod(prisma.usageRecord, "create", mock.fn(async () => {
            throw uniqueUsageEventError();
        }))
    ];

    try {
        const result = await processWorkflowExecutionJob(workflowJob({ executionId: "exec_3" }));

        assert.equal(result.executed, true);
    } finally {
        for (const restore of restores.reverse()) {
            restore();
        }
    }
});
