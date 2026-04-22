import assert from "node:assert/strict";
import test from "node:test";

import { getWorkflowRunnerHarnessConfig } from "./runner.db-integration.config.js";

void test("workflow runner harness config parses required env and JSON payload", () => {
  const config = getWorkflowRunnerHarnessConfig({
    WORKFLOW_TEST_EXECUTION_ID: "exec_1",
    WORKFLOW_TEST_ORGANIZATION_ID: "org_1",
    WORKFLOW_TEST_STEP_KEY: "step_1",
    WORKFLOW_TEST_TENANT_ID: "tenant_1",
    WORKFLOW_TEST_TRIGGER_PAYLOAD: '{"leadId":"lead_1","score":92}',
    WORKFLOW_TEST_WORKFLOW_ID: "workflow_1"
  });

  assert.deepEqual(config, {
    executionId: "exec_1",
    organizationId: "org_1",
    stepKey: "step_1",
    tenantId: "tenant_1",
    triggerPayload: {
      leadId: "lead_1",
      score: 92
    },
    workflowId: "workflow_1"
  });
});

void test("workflow runner harness config rejects invalid JSON payloads", () => {
  assert.throws(
    () =>
      getWorkflowRunnerHarnessConfig({
        WORKFLOW_TEST_EXECUTION_ID: "exec_1",
        WORKFLOW_TEST_ORGANIZATION_ID: "org_1",
        WORKFLOW_TEST_STEP_KEY: "step_1",
        WORKFLOW_TEST_TENANT_ID: "tenant_1",
        WORKFLOW_TEST_TRIGGER_PAYLOAD: "[]",
        WORKFLOW_TEST_WORKFLOW_ID: "workflow_1"
      }),
    /WORKFLOW_TEST_TRIGGER_PAYLOAD must be a JSON object/i
  );
});

