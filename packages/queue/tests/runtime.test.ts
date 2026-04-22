import assert from "node:assert/strict";
import test from "node:test";

import { QUEUE_CONFIG } from "../src/definitions.js";
import { QueueManager } from "../src/index.js";
import type { RepeatableJobRequest } from "../src/types.js";
import {
  createRuntimeWorkerProcessor,
  extractJobContext,
  forwardToDlq,
  isFinalAttempt
} from "../src/worker.js";

void test("runtime worker processor injects normalized job context", async () => {
  const contexts: Array<{ jobId: string; tenantId?: string; traceId?: string }> = [];
  const processor = createRuntimeWorkerProcessor("tenant-jobs", (_data, context) => {
    contexts.push(context);
    return Promise.resolve({ ok: true });
  });

  const result = await processor({
    attemptsMade: 0,
    data: {
      context: {
        actorId: "user_1",
        organizationId: "org_1",
        tenantId: "tenant_1"
      },
      requestId: "req_1",
      tenantId: "tenant_1",
      userId: "user_1"
    },
    id: "job_1"
  } as never);

  assert.deepEqual(result, { ok: true });
  assert.deepEqual(contexts, [
    {
      actorId: "user_1",
      attemptsMade: 0,
      jobId: "job_1",
      organizationId: "org_1",
      queue: "tenant-jobs",
      requestId: "req_1",
      tenantId: "tenant_1",
      traceId: "req_1",
      userId: "user_1"
    }
  ]);
});

void test("retry helper distinguishes intermediate and final attempts", () => {
  assert.equal(
    isFinalAttempt({
      attemptsMade: 1,
      opts: {
        attempts: 3
      }
    } as never),
    false
  );
  assert.equal(
    isFinalAttempt({
      attemptsMade: 3,
      opts: {
        attempts: 3
      }
    } as never),
    true
  );
});

void test("final failures are forwarded to DLQ with original payload and context", async () => {
  const added: Array<{ name: string; payload: unknown; options: unknown }> = [];
  await forwardToDlq(
    "workflow-execution",
    {
      add: (name: string, payload: unknown, options: unknown) => {
        added.push({ name, options, payload });
        return Promise.resolve();
      },
      name: "workflow-execution.dlq"
    } as never,
    {
      attemptsMade: 5,
      data: {
        executionId: "exec_1",
        requestId: "trace_1",
        tenantId: "tenant_1"
      },
      id: "job_42",
      name: "workflow-step",
      opts: {
        attempts: 5,
        backoff: {
          delay: 1000,
          type: "exponential"
        }
      }
    } as never,
    new Error("boom")
  );

  assert.equal(added.length, 1);
  assert.equal(added[0]?.name, "dead-letter");
  assert.deepEqual(added[0]?.payload, {
    configuredAttempts: 5,
    context: extractJobContext(
      "workflow-execution",
      {
        attemptsMade: 5,
        data: {
          executionId: "exec_1",
          requestId: "trace_1",
          tenantId: "tenant_1"
        },
        id: "job_42",
        name: "workflow-step",
        opts: {
          attempts: 5,
          backoff: {
            delay: 1000,
            type: "exponential"
          }
        }
      } as never
    ),
    errorMessage: "boom",
    failedAt: added[0] && typeof (added[0].payload as { failedAt: string }).failedAt === "string"
      ? (added[0].payload as { failedAt: string }).failedAt
      : "",
    originalJobId: "job_42",
    originalJobName: "workflow-step",
    originalOptions: {
      attempts: 5,
      backoff: {
        delay: 1000,
        type: "exponential"
      },
      removeOnComplete: {
        count: 100
      },
      removeOnFail: {
        count: 500
      }
    },
    originalQueue: "workflow-execution",
    payload: {
      executionId: "exec_1",
      requestId: "trace_1",
      tenantId: "tenant_1"
    }
  });
});

void test("queue manager schedules recurring jobs from the central configuration", async () => {
  const scheduled: RepeatableJobRequest[] = [];
  const manager = Object.create(QueueManager.prototype) as QueueManager;

  manager.upsertRepeatableJob = <DataType>(request: RepeatableJobRequest<DataType>) => {
    scheduled.push(request);
    return Promise.resolve();
  };

  await QueueManager.prototype.scheduleRecurringJobs.call(manager);

  const expected = Object.entries(QUEUE_CONFIG)
    .filter(([, config]) => Boolean(config.cron))
    .map(([queue]) => queue)
    .sort();
  const actual = scheduled
    .map((entry) => (typeof entry.queue === "string" ? entry.queue : entry.queue.name))
    .sort();

  assert.deepEqual(actual, expected);
  assert.ok(scheduled.every((entry) => typeof entry.repeat.pattern === "string"));
});
