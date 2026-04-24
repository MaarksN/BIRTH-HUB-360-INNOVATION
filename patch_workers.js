const fs = require('fs');
const filePath = 'apps/worker/src/worker.workflows.ts';
let content = fs.readFileSync(filePath, 'utf8');

// It really IS `workflowRevision` in the schema for WorkflowExecution!
// But wait, the error from TS says:
// src/worker.workflows.ts(18,7): error TS2353: Object literal may only specify known properties, and 'workflowRevision' does not exist in type 'WorkflowExecutionInclude<DefaultArgs>'.
// Wait. Did the `db:generate` not run with my updated version? Or is it actually `revision` in Prisma schema? Let's check:
