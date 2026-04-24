const fs = require('fs');
const filePath = 'apps/worker/src/worker.workflows.ts';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  'revision: {',
  'workflowRevision: {'
);

fs.writeFileSync(filePath, content, 'utf8');
