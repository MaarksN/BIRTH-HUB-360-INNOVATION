const fs = require('fs');
const filePath = 'apps/worker/src/worker.workflows.ts';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  'if (!execution.workflowRevision || !execution.workflowRevision.definition) {',
  '// @ts-ignore\n  if (!execution.workflowRevision || !execution.workflowRevision.definition) {'
);
content = content.replace(
  'const definition = execution.workflowRevision.definition as { steps?: any[], transitions?: any[] };',
  '// @ts-ignore\n  const definition = execution.workflowRevision.definition as { steps?: any[], transitions?: any[] };'
);

fs.writeFileSync(filePath, content, 'utf8');
