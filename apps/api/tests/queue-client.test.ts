import assert from "node:assert/strict";
import test from "node:test";

import { queueClient } from "@birthub/queue";

import { enqueueTask } from "../src/lib/queue.js";
import { createTestApiConfig } from "./test-config.js";

void test("API queue wrapper only enqueues through the shared queue client", async () => {
  const original = queueClient.enqueue.bind(queueClient);
  const captured: Array<unknown> = [];

  queueClient.enqueue = ((request) => {
    captured.push(request);
    return Promise.resolve({
      jobId: "job_1",
      pendingJobs: 1,
      queue: "legacy-tasks"
    });
  }) as typeof queueClient.enqueue;

  try {
    const result = await enqueueTask(createTestApiConfig(), {
      agentId: "ceo-pack",
      approvalRequired: false,
      estimatedCostBRL: 0.5,
      executionMode: "LIVE",
      payload: {
        sample: true
      },
      requestId: "req_1",
      signature: "unsigned",
      tenantId: "tenant_1",
      type: "sync-session",
      userId: "user_1",
      version: "1"
    });

    assert.deepEqual(result, { jobId: "job_1" });
    assert.equal(captured.length, 1);
    assert.equal(
      (captured[0] as { queue: { name: string } }).queue.name,
      createTestApiConfig().QUEUE_NAME
    );
  } finally {
    queueClient.enqueue = original;
  }
});
