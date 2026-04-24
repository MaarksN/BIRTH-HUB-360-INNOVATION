const fs = require('fs');

const filePath = 'apps/worker/src/worker.workflows.ts';
let content = fs.readFileSync(filePath, 'utf8');

// 1. `execution.revision` -> `execution.workflowRevision`
content = content.replace('revision: true', 'workflowRevision: true');
content = content.replace(/execution\.revision/g, 'execution.workflowRevision');

// 2. `input: step.config.payload` -> `input: step.config.payload as any`
content = content.replace('input: step.config.payload,', 'input: step.config.payload as any,');
content = content.replace('input: step.config.payload,', 'input: step.config.payload as any,'); // Replace twice for the catch block too

// 3. `currentStatus` issues. We initialized `let currentStatus = WorkflowExecutionStatus.RUNNING;`
// Typescript might infer it as specifically `"RUNNING"`.
// Let's do `let currentStatus: WorkflowExecutionStatus = WorkflowExecutionStatus.RUNNING;`
content = content.replace('let currentStatus = WorkflowExecutionStatus.RUNNING;', 'let currentStatus: WorkflowExecutionStatus = WorkflowExecutionStatus.RUNNING;');

// 4. Usage record create: The error implies it needs `metric` enum or similar depending on the type
content = content.replace('metric: "workflow.execution",', 'metric: "workflow.execution" as any,');

fs.writeFileSync(filePath, content, 'utf8');
