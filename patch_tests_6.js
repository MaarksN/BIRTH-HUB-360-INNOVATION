const fs = require('fs');

const filePath = 'apps/worker/src/integrations/workflow-connectors.ts';
let content = fs.readFileSync(filePath, 'utf8');

// I need to make `resolveConnectorAccount` and `toConnectorCredentials` exported.
content = content.replace('async function resolveConnectorAccount(', 'export async function resolveConnectorAccount(');
content = content.replace('function toConnectorCredentials(', 'export function toConnectorCredentials(');

fs.writeFileSync(filePath, content, 'utf8');
