const fs = require('fs');

const filePath = 'apps/worker/src/worker.workflows.test.ts';
let content = fs.readFileSync(filePath, 'utf8');

// We are getting an error "Step failed" which means the code reaches the try-catch block
// inside processWorkflowExecutionJob but then fails (possibly because "resolveConnectorAccount"
// is actually imported and does something that throws). Wait, we mocked `prisma.connectorAccount.findFirst` to return null.
// If it returns null, resolveConnectorAccount will throw "CONNECTOR_ACCOUNT_NOT_FOUND".
// This makes the step fail, which makes currentStatus = "FAILED".
// This is exactly why the assertion fails: actual is 'FAILED', expected is 'SUCCESS'.

// So we just need to return a mocked account instead of null!
content = content.replace(
  '(prisma.connectorAccount.findFirst as any) = async () => null;',
  '(prisma.connectorAccount.findFirst as any) = async () => ({ id: "acc_1", credentials: [] });'
);

fs.writeFileSync(filePath, content, 'utf8');
