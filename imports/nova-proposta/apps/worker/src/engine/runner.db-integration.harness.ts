import type { WorkflowExecutionJobPayload } from "./runner.js";
import { getWorkflowRunnerHarnessConfig } from "./runner.db-integration.config.js";
import { WorkflowRunner } from "./runner.js";

const config = getWorkflowRunnerHarnessConfig();

const queuedJobs: WorkflowExecutionJobPayload[] = [];
const agentCalls: Array<{
  agentId: string;
  contextSummary: string;
  input: Record<string, unknown>;
}> = [];

const fakeQueue = {
  add: (_name: string, payload: WorkflowExecutionJobPayload) => {
    queuedJobs.push(payload);
    return Promise.resolve();
  }
} as {
  add: (name: string, payload: WorkflowExecutionJobPayload) => Promise<void>;
};

const runner = new WorkflowRunner(fakeQueue as never, {
  agentExecutor: {
    execute: (input) => {
      agentCalls.push(input);

      return Promise.resolve({
        agentId: input.agentId,
        reviewedCompany: input.input.company,
        reviewedTenantId: input.input.tenantId
      });
    }
  }
});

await runner.processExecutionJob({
  attempt: 1,
  executionId: config.executionId,
  organizationId: config.organizationId,
  stepKey: config.stepKey,
  tenantId: config.tenantId,
  triggerPayload: config.triggerPayload,
  triggerType: "WEBHOOK",
  workflowId: config.workflowId
});

while (queuedJobs.length > 0) {
  const nextJob = queuedJobs.shift();

  if (!nextJob) {
    continue;
  }

  await runner.processExecutionJob(nextJob);
}

process.stdout.write(
  JSON.stringify({
    agentCalls
  })
);

