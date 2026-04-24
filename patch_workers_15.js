const fs = require('fs');

const testPath = 'apps/worker/src/worker.workflows.test.ts';
let testContent = fs.readFileSync(testPath, 'utf8');

// I accidentally changed `workflowRevision` back to `revision` in test. Let's fix that!
// Wait, my previous patch script `patch_workers_12.js` did:
// `testContent = testContent.replace('revision: {', 'workflowRevision: {');`
// BUT IF I look at `patch_workers_13.js`:
// `testContent = testContent.replace('workflowRevision: {', 'revision: {');`
// I reverted it in 13.

testContent = testContent.replace(
  'revision: {',
  'workflowRevision: {'
);

fs.writeFileSync(testPath, testContent, 'utf8');
