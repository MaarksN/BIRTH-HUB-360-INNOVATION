const fs = require('fs');

const filePath = 'apps/worker/src/worker.workflows.ts';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  'const completedAt = new Date();',
  `
  if (currentStatus === WorkflowExecutionStatus.RUNNING) {
    currentStatus = WorkflowExecutionStatus.SUCCESS;
  }
  const completedAt = new Date();`
);

fs.writeFileSync(filePath, content, 'utf8');
