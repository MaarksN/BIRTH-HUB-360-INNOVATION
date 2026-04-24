const fs = require('fs');
let content = fs.readFileSync('packages/database/test/engagement.test.ts', 'utf8');

const regexes = [
  /prisma\.userPreference\.upsert = mock\.fn/g,
  /injectedClient\.notification\.create\.mockImplementation/g,
  /injectedClient\.userPreference\.findUnique\.mockResolvedValue/g,
  /injectedClient\.userPreference\.upsert\.mockResolvedValue/g,
  /injectedClient\.auditLog\.create\.mockImplementation/g,
  /injectedClient\.membership\.findMany\.mockReturnValue/g,
  /injectedClient\.notification\.createMany\.mockImplementation/g,
  /injectedClient\.notification\.findMany\.mockReturnValue/g,
  /injectedClient\.notification\.count\.mockReturnValue/g,
  /mock\.method\(prisma\.userPreference, "upsert"/g,
  /mock\.method\(prisma\.notification, "create"/g,
  /mock\.method\(prisma\.userPreference, "findUnique"/g,
  /mock\.method\(prisma\.auditLog, "create"/g,
  /mock\.method\(prisma\.membership, "findMany"/g,
  /mock\.method\(prisma\.notification, "createMany"/g,
  /mock\.method\(prisma\.notification, "findMany"/g,
  /mock\.method\(prisma\.notification, "count"/g,
  /prisma\.notification\.create = mock\.fn/g,
  /prisma\.userPreference\.findUnique = mock\.fn/g,
  /prisma\.auditLog\.create = mock\.fn/g,
  /prisma\.membership\.findMany = mock\.fn/g,
  /prisma\.notification\.createMany = mock\.fn/g,
  /prisma\.notification\.findMany = mock\.fn/g,
  /prisma\.notification\.count = mock\.fn/g
];

// Clean old expected errors.
content = content.replace(/\/\/ @ts-expect-error.*\n/g, '');

for (const regex of regexes) {
  content = content.replace(regex, match => `// @ts-expect-error mock assignment\n  ${match}`);
}

content = content.replace(/\/\/ @ts-expect-error.*\n\s*\/\/ @ts-expect-error.*\n/g, '// @ts-expect-error mock assignment\n');

fs.writeFileSync('packages/database/test/engagement.test.ts', content);
