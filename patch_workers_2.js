const fs = require('fs');
const filePath = 'apps/worker/src/worker.workflows.ts';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace('revision: true', 'workflowRevision: true');
content = content.replace(/execution\.revision/g, 'execution.workflowRevision');
// actually wait! The typescript error is:
// src/worker.workflows.ts(18,7): error TS2353: Object literal may only specify known properties, and 'workflowRevision' does not exist in type 'WorkflowExecutionInclude<DefaultArgs>'.
// If it's NOT `workflowRevision` then what IS IT?
// Let's check what `runner.ts` uses.
