import { z } from "zod";

const workflowRunnerHarnessEnvSchema = z.object({
  WORKFLOW_TEST_EXECUTION_ID: z.string().trim().min(1),
  WORKFLOW_TEST_ORGANIZATION_ID: z.string().trim().min(1),
  WORKFLOW_TEST_STEP_KEY: z.string().trim().min(1),
  WORKFLOW_TEST_TENANT_ID: z.string().trim().min(1),
  WORKFLOW_TEST_TRIGGER_PAYLOAD: z.string().trim().min(1),
  WORKFLOW_TEST_WORKFLOW_ID: z.string().trim().min(1)
});

export type WorkflowRunnerHarnessConfig = {
  executionId: string;
  organizationId: string;
  stepKey: string;
  tenantId: string;
  triggerPayload: Record<string, unknown>;
  workflowId: string;
};

function parseTriggerPayload(raw: string): Record<string, unknown> {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("WORKFLOW_TEST_TRIGGER_PAYLOAD must be valid JSON.");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("WORKFLOW_TEST_TRIGGER_PAYLOAD must be a JSON object.");
  }

  return parsed as Record<string, unknown>;
}

export function getWorkflowRunnerHarnessConfig(
  env: NodeJS.ProcessEnv = process.env
): WorkflowRunnerHarnessConfig {
  const parsed = workflowRunnerHarnessEnvSchema.safeParse(env);

  if (!parsed.success) {
    throw new Error(
      [
        "Missing or invalid WORKFLOW_TEST_* environment variables.",
        ...parsed.error.issues.map((issue) => `- ${issue.path.join(".")}: ${issue.message}`)
      ].join("\n")
    );
  }

  return {
    executionId: parsed.data.WORKFLOW_TEST_EXECUTION_ID,
    organizationId: parsed.data.WORKFLOW_TEST_ORGANIZATION_ID,
    stepKey: parsed.data.WORKFLOW_TEST_STEP_KEY,
    tenantId: parsed.data.WORKFLOW_TEST_TENANT_ID,
    triggerPayload: parseTriggerPayload(parsed.data.WORKFLOW_TEST_TRIGGER_PAYLOAD),
    workflowId: parsed.data.WORKFLOW_TEST_WORKFLOW_ID
  };
}

