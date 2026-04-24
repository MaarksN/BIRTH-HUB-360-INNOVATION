const fs = require('fs');
const filePath = 'apps/worker/src/worker.workflows.ts';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  'const execution: any = await prisma.workflowExecution.findUnique({',
  'const execution = await prisma.workflowExecution.findUnique({'
);

content = content.replace(
  'workflowRevision: true',
  'revision: true'
);

content = content.replace(
  'if (!execution.workflowRevision || !execution.workflowRevision.definition) {',
  'if (!execution.revision || !execution.revision.definition) {'
);

content = content.replace(
  'const definition = execution.workflowRevision.definition as { steps?: any[], transitions?: any[] };',
  'const definition = execution.revision.definition as { steps?: any[], transitions?: any[] };'
);

fs.writeFileSync(filePath, content, 'utf8');
