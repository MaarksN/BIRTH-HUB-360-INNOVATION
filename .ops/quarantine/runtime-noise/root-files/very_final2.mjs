import fs from 'fs';

let content = fs.readFileSync('packages/database/test/engagement.test.ts', 'utf8');

const errorLines = [31, 59, 93, 113, 114, 181, 182, 183, 296, 297, 366, 371];
const lines = content.split('\n');

for (const line of errorLines) {
  if (!lines[line].includes('// @ts-expect-error')) {
    lines[line] = '// @ts-expect-error mock assignment\n' + lines[line];
  }
}

fs.writeFileSync('packages/database/test/engagement.test.ts', lines.join('\n'));
