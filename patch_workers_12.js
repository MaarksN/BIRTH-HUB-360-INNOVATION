const fs = require('fs');
const filePath = 'apps/worker/src/worker.workflows.ts';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  'revision: true',
  'workflowRevision: true'
);

content = content.replace(
  'if (!execution.revision || !execution.revision.definition) {',
  'if (!execution.workflowRevision || !execution.workflowRevision.definition) {'
);

content = content.replace(
  'const definition = execution.revision.definition as { steps?: any[], transitions?: any[] };',
  'const definition = execution.workflowRevision.definition as { steps?: any[], transitions?: any[] };'
);

fs.writeFileSync(filePath, content, 'utf8');

const testPath = 'apps/worker/src/worker.workflows.test.ts';
let testContent = fs.readFileSync(testPath, 'utf8');

testContent = testContent.replace(
  'revision: {',
  'workflowRevision: {'
);

fs.writeFileSync(testPath, testContent, 'utf8');
