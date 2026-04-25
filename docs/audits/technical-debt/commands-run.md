# Comandos Executados

## Busca por uso de tipo genérico 'any'
- **Diretório:** /app
- **Comando:** `git grep -n '\bany\b' | head -n 20`
- **Status:** ✅ Sucesso
- **Saída:**
```
.ops/analysis/type-suppressions.json:5179:      "type": "any-signature",
.ops/analysis/type-suppressions.json:5182:      "snippet": "function readJsonIfExists(filePath: string): any | null {",
.ops/analysis/type-suppressions.json:5183:      "notes": "Explicit any found in a likely public signature."
.ops/analysis/type-suppressions.json:5188:      "type": "any-signature",
.ops/analysis/type-suppressions.json:5191:      "snippet": "function normalizeLegacyDrill(drill: any): any {",
.ops/analysis/t
... (truncado)
```

## Busca por TODOs no código
- **Diretório:** /app
- **Comando:** `git grep -n 'TODO' | head -n 20`
- **Status:** ✅ Sucesso
- **Saída:**
```
.ops/analysis/type-suppressions.json:16:      "snippet": "// @ts-expect-error TODO: remover suppressão ampla",
.ops/analysis/type-suppressions.json:25:      "snippet": "// @ts-expect-error TODO: remover suppressão ampla",
.ops/analysis/type-suppressions.json:34:      "snippet": "// @ts-expect-error TODO: remover suppressão ampla",
.ops/analysis/type-suppressions.json:43:      "snippet": "// @ts-expect-error TODO: remover suppressão ampla",
.ops/analysis/type-suppressions.json:52:      "snippet":
... (truncado)
```

## Busca por console.log
- **Diretório:** /app
- **Comando:** `git grep -n 'console\.log' | head -n 20`
- **Status:** ✅ Sucesso
- **Saída:**
```
.ops/quarantine/runtime-noise/root-files/auditoria birthub 360.html:537:        { id:"c1_11", t:"M", text:"Substituir console.log por Pino logger com contexto de requestId, userId, tenantId" },
.ops/tools/generate_cycles.js:1034:console.log(
apps/api/test/benchmarks/pack-installer.benchmark.ts:13:  console.log(`Setting up benchmark for tenant ${tenantId}...`);
apps/api/test/benchmarks/pack-installer.benchmark.ts:26:  console.log(`Creating ${agentCount} agents...`);
apps/api/test/benchmarks/pack-
... (truncado)
```

## Busca por @ts-ignore
- **Diretório:** /app
- **Comando:** `git grep -n '@ts-ignore' | head -n 20`
- **Status:** ✅ Sucesso
- **Saída:**
```
.ops/analysis/type-suppressions.json:4876:      "snippet": "const ignoreMatch = line.match(/@ts-ignore\\b(.*)$/u);",
.ops/analysis/type-suppressions.json:4885:      "snippet": "`- ${sectionLabels[entry.section]}: ${entry.noCheck} @ts-nocheck, ${entry.tsIgnore} unjustified @ts-ignore`",
.ops/analysis/type-suppressions.json:4894:      "snippet": "`- ${sectionLabels[entry.section]}: ${entry.noCheck} @ts-nocheck, ${entry.tsIgnore} unjustified @ts-ignore`",
.ops/analysis/type-suppressions.json:4921:
... (truncado)
```

## Busca por catch vazios
- **Diretório:** /app
- **Comando:** `git grep -n 'catch.*{.*}' | head -n 10`
- **Status:** ✅ Sucesso
- **Saída:**
```
.ops/quarantine/runtime-noise/root-files/auditoria birthub 360.html:1164:function save() { try { localStorage.setItem('bh360_v2', JSON.stringify(S)); } catch(e){} }
apps/api/.eslint-api.json:1:﻿[{"filePath":"C:\\Users\\Marks\\Documents\\GitHub\\PROJETO-FINAL-BIRTHUB-360-INNOVATION\\apps\\api\\src\\app.ts","messages":[],"suppressedMessages":[],"errorCount":0,"fatalErrorCount":0,"warningCount":0,"fixableErrorCount":0,"fixableWarningCount":0,"usedDeprecatedRules":[]},{"filePath":"C:\\Users\\Marks\\
... (truncado)
```

## Busca por secrets hardcoded
- **Diretório:** /app
- **Comando:** `git grep -nEi 'password = |secret = |token = ' | head -n 10`
- **Status:** ✅ Sucesso
- **Saída:**
```
apps/api/src/lib/encryption.ts:15:type ParsedEncryptedConnectorToken = {
apps/api/src/lib/encryption.ts:102:  const parsedToken = parseDelimitedEncryptedConnectorToken(rawPayload);
apps/api/src/lib/encryption.ts:149:  const parsedToken = parseEncryptedConnectorToken(encryptedText);
apps/api/src/middleware/authentication.ts:65:      const sessionToken = authorization.sessionToken ?? cookies[sessionCookieName] ?? null;
apps/api/src/middleware/authentication.ts:66:      const apiKeyToken = authoriz
... (truncado)
```

## Verifica dependências desatualizadas
- **Diretório:** /app
- **Comando:** `pnpm outdated || true`
- **Status:** ✅ Sucesso
- **Saída:**
```
┌─────────────────────────────────────────┬─────────────────────────┬────────┐
│ Package                                 │ Current                 │ Latest │
├─────────────────────────────────────────┼─────────────────────────┼────────┤
│ @commitlint/cli (dev)                   │ missing (wanted 20.5.0) │ 20.5.0 │
├─────────────────────────────────────────┼─────────────────────────┼────────┤
│ @commitlint/config-conventional (dev)   │ missing (wanted 20.5.0) │ 20.5.0 │
├─────────────────────────
... (truncado)
```

