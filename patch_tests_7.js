const fs = require('fs');

const filePath = 'apps/worker/src/worker.workflows.test.ts';
let content = fs.readFileSync(filePath, 'utf8');

// The test fails because it tries to call prisma.connectorAccount.findFirst.
// We must mock prisma.connectorAccount.findFirst as well.

content = content.replace(
  '(prisma.workflowExecution.update as any) = async (args: any) => {',
  `
    const originalFindConnector = prisma.connectorAccount.findFirst;
    (prisma.connectorAccount.findFirst as any) = async () => null;
    (prisma.workflowExecution.update as any) = async (args: any) => {
`
);

content = content.replace(
  'prisma.stepResult.create = originalStepResultCreate;',
  `prisma.stepResult.create = originalStepResultCreate;
        prisma.connectorAccount.findFirst = originalFindConnector;`
);

fs.writeFileSync(filePath, content, 'utf8');
