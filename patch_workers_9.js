const fs = require('fs');
const filePath = 'apps/worker/src/worker.workflows.ts';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  'const execution: any = await prisma.workflowExecution.findUnique({',
  'const execution = await prisma.workflowExecution.findUnique({'
);

content = content.replace(
  'workflowRevision: true',
  'revision: true' // This is wrong, it was correct originally, maybe we should just remove the include entirely and use `findUnique({ include: { workflowRevision: true } })` again but explicitly suppress the typescript error on `workflowRevision`?
);

// Wait, the actual error was:
// src/worker.workflows.ts(18,7): error TS2353: Object literal may only specify known properties, and 'workflowRevision' does not exist in type 'WorkflowExecutionInclude<DefaultArgs>'.
// src/worker.workflows.ts(27,18): error TS2551: Property 'workflowRevision' does not exist on type '{ ... }'. Did you mean 'workflowRevisionId'?

// If `workflowRevision` does not exist on `WorkflowExecutionInclude`, what DOES exist?
// Let's check the Prisma client generated types.
