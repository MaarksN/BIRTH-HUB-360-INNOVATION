import { test } from "node:test";
import assert from "node:assert/strict";

import { compileDslToCanvas, workflowDslSchema } from "../src/dsl.js";

test("compileDslToCanvas compila trigger implicito e transicoes lineares", () => {
  const dsl = workflowDslSchema.parse({
    steps: [
      {
        action: "hubspot.crm.contact.upsert",
        config: { email: "a@b.com" },
        key: "upsert-contact",
        name: "Upsert contact"
      },
      {
        action: "slack.message.send",
        config: { channel: "ops" },
        key: "notify-slack",
        name: "Notify"
      }
    ],
    trigger: {
      eventTopic: "lead.created",
      triggerKey: "trigger-lead"
    }
  });

  const canvas = compileDslToCanvas(dsl);

  assert.equal(canvas.steps[0]?.type, "TRIGGER_EVENT");
  assert.equal(canvas.steps[1]?.type, "CONNECTOR_ACTION");
  assert.equal(canvas.transitions.length, 2);
  assert.equal(canvas.transitions[0]?.source, "trigger-lead");
  assert.equal(canvas.transitions[1]?.target, "notify-slack");
});
