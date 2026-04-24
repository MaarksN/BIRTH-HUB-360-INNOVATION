const fs = require('fs');

const filePath = 'apps/worker/src/worker.workflows.test.ts';
let content = fs.readFileSync(filePath, 'utf8');

// I also need to mock `WorkflowRevision definition not found` if `execution.workflowRevision.definition` is not set?
// No, the error is `WorkflowRevision definition not found`.
// Ah! In my mock: `revision: { definition: ... }`
// but I changed the query to `include: { workflowRevision: true }` and check `execution.workflowRevision.definition`!
// So my mock in `worker.workflows.test.ts` should return `workflowRevision` instead of `revision`!

content = content.replace('revision: {', 'workflowRevision: {');

fs.writeFileSync(filePath, content, 'utf8');
