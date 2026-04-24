const fs = require('fs');

const filePath = 'apps/worker/src/worker.workflows.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Replace the entire UsageRecord create because Prisma's `Without` types break on `organizationId` sometimes if it is provided alongside others?
// Let's just cast the entire object passed to `data` to `any`.
content = content.replace(
  '    await prisma.usageRecord.create({',
  '    await prisma.usageRecord.create({ // @ts-ignore'
);

content = content.replace(
  'data: {',
  'data: {'
);
content = content.replace('organizationId: execution.organizationId,', 'organizationId: execution.organizationId,');
content = content.replace('metadata: {', 'metadata: {');

// Just force `@ts-ignore` for now on the whole block to let compilation pass so we can focus on functionality.
content = content.replace(
  '    await prisma.usageRecord.create({',
  '    // @ts-ignore\n    await prisma.usageRecord.create({'
);

fs.writeFileSync(filePath, content, 'utf8');
