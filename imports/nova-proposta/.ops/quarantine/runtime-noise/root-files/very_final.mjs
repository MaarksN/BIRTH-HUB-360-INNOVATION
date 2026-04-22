import fs from 'fs';

let content = fs.readFileSync('packages/database/test/engagement.test.ts', 'utf8');

// I need to add // @ts-expect-error to the failed mock assignments:
// test/engagement.test.ts:94 (userPreference.findUnique)
// test/engagement.test.ts:95 (userPreference.upsert)
// test/engagement.test.ts:145
// test/engagement.test.ts:146
// test/engagement.test.ts:147
// test/engagement.test.ts:223
// test/engagement.test.ts:267
// test/engagement.test.ts:332
// test/engagement.test.ts:346
// test/engagement.test.ts:347

// Since I removed them before, I will restore them using replace.
content = content.replace(/injectedClient\.userPreference\.findUnique = mock\.fn/g, '// @ts-expect-error mock limit\n  injectedClient.userPreference.findUnique = mock.fn');
content = content.replace(/injectedClient\.userPreference\.upsert = mock\.fn/g, '// @ts-expect-error mock limit\n  injectedClient.userPreference.upsert = mock.fn');
content = content.replace(/injectedClient\.auditLog\.create = mock\.fn/g, '// @ts-expect-error mock limit\n  injectedClient.auditLog.create = mock.fn');
content = content.replace(/injectedClient\.notification\.createMany = mock\.fn/g, '// @ts-expect-error mock limit\n  injectedClient.notification.createMany = mock.fn');
content = content.replace(/injectedClient\.notification\.findMany = mock\.fn/g, '// @ts-expect-error mock limit\n  injectedClient.notification.findMany = mock.fn');
content = content.replace(/injectedClient\.notification\.count = mock\.fn/g, '// @ts-expect-error mock limit\n  injectedClient.notification.count = mock.fn');
content = content.replace(/injectedClient\.membership\.findMany = mock\.fn/g, '// @ts-expect-error mock limit\n  injectedClient.membership.findMany = mock.fn');

fs.writeFileSync('packages/database/test/engagement.test.ts', content);
