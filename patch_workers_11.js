const fs = require('fs');
const filePath = 'apps/worker/src/worker.workflows.ts';
let content = fs.readFileSync(filePath, 'utf8');

// I also need to update the mock test!
// Since `worker.workflows.ts` now uses `findUnique({ include: { workflowRevision: true } })`
// We must mock it correctly in `worker.workflows.test.ts` as `workflowRevision`.

const mockPath = 'apps/worker/src/worker.workflows.test.ts';
let mockContent = fs.readFileSync(mockPath, 'utf8');

mockContent = mockContent.replace(
  'revision: {',
  'workflowRevision: {'
);

fs.writeFileSync(mockPath, mockContent, 'utf8');
