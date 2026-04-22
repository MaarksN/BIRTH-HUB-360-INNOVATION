
// 
import assert from "node:assert/strict";
import test from "node:test";

import { lintWorkflowSteps, workflowCanvasSchema } from "../src/index.js";

test("semantic lint reports deprecated/risky/incompatible workflow steps", () => {
  const canvas = workflowCanvasSchema.parse({
    steps: [
      {
        config: {
          method: "POST",
          path: "/hook"
        },
        isTrigger: true,
        key: "trigger",
        name: "Trigger",
        type: "TRIGGER_WEBHOOK"
      },
      {
        config: {
          timeout_ms: 900,
          source: "return { ok: true };"
        },
        key: "code_block",
        name: "Code",
        type: "CODE"
      },
      {
        config: {
          headers: {},
          method: "POST",
          timeout_ms: 2000,
          url: "http://internal-api.local/run"
        },
        key: "http_call",
        name: "HTTP",
        type: "HTTP_REQUEST"
      },
      {
        config: {
          message: "hello",
          to: "+5511999999999"
        },
        key: "legacy_whatsapp",
        name: "Legacy WhatsApp",
        type: "WHATSAPP_SEND"
      }
    ],
    transitions: [
      {
        route: "ALWAYS",
        source: "trigger",
        target: "code_block"
      },
      {
        route: "IF_TRUE",
        source: "http_call",
        target: "legacy_whatsapp"
      }
    ]
  });

  const lint = lintWorkflowSteps(canvas);

  assert.equal(lint.summary.critical, 2);
  assert.equal(lint.summary.warning, 3);
  assert.equal(lint.summary.info, 1);
  assert.equal(lint.score, 100);
  assert.deepEqual(
    lint.findings.map((finding) => finding.code).sort(),
    [
      "INCOMPATIBLE_ROUTE",
      "INSECURE_HTTP_URL",
      "LEGACY_STEP",
      "MISSING_FAILURE_PATH",
      "RISKY_CODE_TIMEOUT",
      "UNSCOPED_CONNECTOR_ACCOUNT"
    ]
  );
});

test("semantic lint keeps clean workflows at score zero", () => {
  const canvas = workflowCanvasSchema.parse({
    steps: [
      {
        config: {
          method: "POST",
          path: "/events"
        },
        isTrigger: true,
        key: "trigger",
        name: "Trigger",
        type: "TRIGGER_WEBHOOK"
      },
      {
        config: {
          headers: {},
          method: "POST",
          timeout_ms: 300,
          url: "https://api.birthhub.local/leads"
        },
        key: "http_safe",
        name: "HTTP Safe",
        type: "HTTP_REQUEST"
      },
      {
        config: {
          batchWindowMs: 3000,
          channel: "email",
          message: "Lead recebido",
          to: "ops@birthhub.local"
        },
        key: "notify",
        name: "Notify",
        type: "SEND_NOTIFICATION"
      }
    ],
    transitions: [
      {
        route: "ALWAYS",
        source: "trigger",
        target: "http_safe"
      },
      {
        route: "ON_FAILURE",
        source: "http_safe",
        target: "notify"
      }
    ]
  });

  const lint = lintWorkflowSteps(canvas);
  assert.equal(lint.score, 0);
  assert.equal(lint.findings.length, 0);
});
