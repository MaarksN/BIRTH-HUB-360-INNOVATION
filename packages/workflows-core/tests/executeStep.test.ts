
// 
import assert from "node:assert/strict";
import test from "node:test";

import { executeStep, type WorkflowRuntimeContext } from "../src/index.js";

function createContext(): WorkflowRuntimeContext {
  return {
    executionId: "exec_execute_step",
    steps: {},
    tenantId: "tenant_alpha",
    trigger: {
      output: {
        ok: true,
        topic: "workflow.finished"
      },
      type: "MANUAL"
    },
    workflowId: "wf_execute_step"
  };
}

test("executeStep forwards trigger outputs through the shared trigger handler", async () => {
  const context = createContext();

  const payload = await executeStep(
    {
      config: {
        topic: "workflow.finished"
      },
      isTrigger: true,
      key: "trigger_event",
      name: "Trigger Event",
      type: "TRIGGER_EVENT"
    },
    context
  );

  assert.deepEqual(payload, context.trigger.output);
});

test("executeStep preserves dependency guards for agent and connector handlers", async () => {
  const context = createContext();

  await assert.rejects(
    () =>
      executeStep(
        {
          config: {
            agentId: "care-coordinator",
            input: {},
            onError: "stop"
          },
          key: "agent_execute",
          name: "Agent Execute",
          type: "AGENT_EXECUTE"
        },
        context
      ),
    (error: Error) => error.message === "AGENT_EXECUTOR_NOT_CONFIGURED"
  );

  await assert.rejects(
    () =>
      executeStep(
        {
          config: {
            message: "Ol\u00e1",
            to: "+5511999999999"
          },
          key: "whatsapp_send",
          name: "WhatsApp Send",
          type: "WHATSAPP_SEND"
        },
        context
      ),
    (error: Error) => error.message === "CONNECTOR_EXECUTOR_NOT_CONFIGURED"
  );
});
