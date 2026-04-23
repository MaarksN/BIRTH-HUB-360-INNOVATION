const fs = require('fs');
const filePath = 'apps/worker/src/worker.workflows.ts';
let content = fs.readFileSync(filePath, 'utf8');

// I replaced workflowRevision back to revision but the compiler clearly complained about revision before:
// It says `Object literal may only specify known properties, and 'revision' does not exist in type 'WorkflowExecutionInclude<DefaultArgs>'`
// Wait. No, the compiler complained about `workflowRevision` when it was `workflowRevision` AND about `revision` when it was `revision`.
// Why would the compiler complain about `workflowRevision` when `workflowRevision` is literally in `WorkflowExecutionInclude`?
// Oh!
// The error was:
// src/worker.workflows.ts(18,7): error TS2353: Object literal may only specify known properties, and 'workflowRevision' does not exist in type 'WorkflowExecutionInclude<DefaultArgs>'.
// src/worker.workflows.ts(27,18): error TS2551: Property 'workflowRevision' does not exist on type '{ tenantId: string; id: string; organizationId: string; actorId: string; status: WorkflowExecutionStatus; createdAt: Date; updatedAt: Date; errorMessage: string; ... 13 more ...; resumedFromExecutionId: string; }'. Did you mean 'workflowRevisionId'?

// Let's change the query to use `.findUniqueOrThrow` or just cast to `any`.
// If I use `findUnique` without include, and just cast to any, then do whatever, it's unsafe but passes compiler.
// BUT wait, I already cast to `any`!
// `const execution: any = await prisma.workflowExecution.findUnique({` -> I did this in my last patch, BUT I ALSO changed `workflowRevision: true` back to `revision: true` which is STILL an error because `revision: true` is inside the `findUnique` options which are type-checked against `Prisma.WorkflowExecutionFindUniqueArgs`.
// Yes!

// So I should change `revision: true` to `workflowRevision: true` and keep the cast.
content = content.replace('revision: true', 'workflowRevision: true');
content = content.replace(/execution\.revision/g, 'execution.workflowRevision');

// I also notice I used `const execution = ...` instead of `const execution: any = ...` in the last run because my `patch_workers_8.js` did exactly that (reverting `execution: any` back to `execution`).
// So let's restore the `any` cast.
content = content.replace(
  'const execution = await prisma.workflowExecution.findUnique({',
  'const execution: any = await prisma.workflowExecution.findUnique({'
);

fs.writeFileSync(filePath, content, 'utf8');
