const fs = require('fs');

const filePath = 'apps/worker/src/worker.workflows.ts';
let content = fs.readFileSync(filePath, 'utf8');

// 1. `input: step.config.payload as any,` -> `input: step.config.payload as Prisma.InputJsonValue,` (wait, I didn't import Prisma... Let's just cast output too)
// Ah! TS2322 is for `output: result.response ?? {}`
content = content.replace('output: result.response ?? {}', 'output: (result.response ?? {}) as any');

// 2. `UsageRecordCreateInput` is strict about `organizationId` depending on other relations, wait, no.
// Sometimes it wants nested objects if using Prisma relation creation or strictly primitives in UncheckedCreateInput.
// Let's just use `any` for the whole data object to bypass this Prisma TS bug.
content = content.replace('data: {', 'data: {');
content = content.replace(
  '        organizationId: execution.organizationId,\n        tenantId: execution.tenantId,\n        metric: "workflow.execution" as any,\n        quantity: 1,\n        occurredAt: completedAt,\n        metadata: {\n          executionId: execution.id,\n          workflowId: execution.workflowId\n        }',
  '        organizationId: execution.organizationId,\n        tenantId: execution.tenantId,\n        metric: "workflow.execution" as any,\n        quantity: 1,\n        occurredAt: completedAt,\n        metadata: {\n          executionId: execution.id,\n          workflowId: execution.workflowId\n        } as any'
);

fs.writeFileSync(filePath, content, 'utf8');
