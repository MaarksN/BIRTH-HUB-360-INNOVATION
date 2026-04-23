const fs = require('fs');

const testPath = 'apps/worker/src/worker.workflows.test.ts';
let testContent = fs.readFileSync(testPath, 'utf8');

// I also need to modify the include inside the test to NOT use `workflowRevision`!
testContent = testContent.replace(
  'workflowRevision: {',
  'revision: {'
);

fs.writeFileSync(testPath, testContent, 'utf8');
