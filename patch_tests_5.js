const fs = require('fs');

const filePath = 'apps/worker/src/worker.workflows.ts';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  'import { resolveConnectorAccount, createDefaultConnectorRuntime, toConnectorCredentials } from "./integrations/workflow-connectors.js";',
  'import { resolveConnectorAccount, toConnectorCredentials } from "./integrations/workflow-connectors.js";\nimport { createDefaultConnectorRuntime } from "@birthub/connectors-core";'
);

fs.writeFileSync(filePath, content, 'utf8');
