const fs = require('fs');
const filePath = 'apps/worker/src/worker.workflows.test.ts';
let content = fs.readFileSync(filePath, 'utf8');

// I also need to update the mock test!
content = content.replace(
  'revision: {',
  'workflowRevision: {'
);

fs.writeFileSync(filePath, content, 'utf8');
