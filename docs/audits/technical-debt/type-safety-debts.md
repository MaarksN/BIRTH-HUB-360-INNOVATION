# Dívidas de Tipagem


### [TD-1] DÍVIDAS DE TIPAGEM: Uso de any explícito
- **Severidade:** MÉDIO
- **Prioridade:** P2 média
- **Status:** Confirmado por evidência
- **Impacto:** Reduz a segurança estática de tipos
- **Risco de não corrigir:** Risco de erros em tempo de execução
- **Recomendação:** Substituir any por tipos concretos ou unknown com narrowing
- **Esforço:** M
- **Arquivo/Linha:** `.ops/analysis/type-suppressions.json:5179`
- **Evidência/Como detectado:** .ops/analysis/type-suppressions.json:5179:      "type": "any-signature",
- **Correção sugerida:** Definir interfaces adequadas
- **Testes recomendados:** Testes de tipagem e unitários

### [TD-2] DÍVIDAS DE TIPAGEM: Uso de any explícito
- **Severidade:** MÉDIO
- **Prioridade:** P2 média
- **Status:** Confirmado por evidência
- **Impacto:** Reduz a segurança estática de tipos
- **Risco de não corrigir:** Risco de erros em tempo de execução
- **Recomendação:** Substituir any por tipos concretos ou unknown com narrowing
- **Esforço:** M
- **Arquivo/Linha:** `.ops/analysis/type-suppressions.json:5182`
- **Evidência/Como detectado:** .ops/analysis/type-suppressions.json:5182:      "snippet": "function readJsonIfExists(filePath: string): any | null {",
- **Correção sugerida:** Definir interfaces adequadas
- **Testes recomendados:** Testes de tipagem e unitários

### [TD-3] DÍVIDAS DE TIPAGEM: Uso de any explícito
- **Severidade:** MÉDIO
- **Prioridade:** P2 média
- **Status:** Confirmado por evidência
- **Impacto:** Reduz a segurança estática de tipos
- **Risco de não corrigir:** Risco de erros em tempo de execução
- **Recomendação:** Substituir any por tipos concretos ou unknown com narrowing
- **Esforço:** M
- **Arquivo/Linha:** `.ops/analysis/type-suppressions.json:5183`
- **Evidência/Como detectado:** .ops/analysis/type-suppressions.json:5183:      "notes": "Explicit any found in a likely public signature."
- **Correção sugerida:** Definir interfaces adequadas
- **Testes recomendados:** Testes de tipagem e unitários

### [TD-4] DÍVIDAS DE TIPAGEM: Uso de any explícito
- **Severidade:** MÉDIO
- **Prioridade:** P2 média
- **Status:** Confirmado por evidência
- **Impacto:** Reduz a segurança estática de tipos
- **Risco de não corrigir:** Risco de erros em tempo de execução
- **Recomendação:** Substituir any por tipos concretos ou unknown com narrowing
- **Esforço:** M
- **Arquivo/Linha:** `.ops/analysis/type-suppressions.json:5188`
- **Evidência/Como detectado:** .ops/analysis/type-suppressions.json:5188:      "type": "any-signature",
- **Correção sugerida:** Definir interfaces adequadas
- **Testes recomendados:** Testes de tipagem e unitários

### [TD-5] DÍVIDAS DE TIPAGEM: Uso de any explícito
- **Severidade:** MÉDIO
- **Prioridade:** P2 média
- **Status:** Confirmado por evidência
- **Impacto:** Reduz a segurança estática de tipos
- **Risco de não corrigir:** Risco de erros em tempo de execução
- **Recomendação:** Substituir any por tipos concretos ou unknown com narrowing
- **Esforço:** M
- **Arquivo/Linha:** `.ops/analysis/type-suppressions.json:5191`
- **Evidência/Como detectado:** .ops/analysis/type-suppressions.json:5191:      "snippet": "function normalizeLegacyDrill(drill: any): any {",
- **Correção sugerida:** Definir interfaces adequadas
- **Testes recomendados:** Testes de tipagem e unitários

### [TD-6] DÍVIDAS DE TIPAGEM: Uso de any explícito
- **Severidade:** MÉDIO
- **Prioridade:** P2 média
- **Status:** Confirmado por evidência
- **Impacto:** Reduz a segurança estática de tipos
- **Risco de não corrigir:** Risco de erros em tempo de execução
- **Recomendação:** Substituir any por tipos concretos ou unknown com narrowing
- **Esforço:** M
- **Arquivo/Linha:** `.ops/analysis/type-suppressions.json:5192`
- **Evidência/Como detectado:** .ops/analysis/type-suppressions.json:5192:      "notes": "Explicit any found in a likely public signature."
- **Correção sugerida:** Definir interfaces adequadas
- **Testes recomendados:** Testes de tipagem e unitários

### [TD-7] DÍVIDAS DE TIPAGEM: Uso de any explícito
- **Severidade:** MÉDIO
- **Prioridade:** P2 média
- **Status:** Confirmado por evidência
- **Impacto:** Reduz a segurança estática de tipos
- **Risco de não corrigir:** Risco de erros em tempo de execução
- **Recomendação:** Substituir any por tipos concretos ou unknown com narrowing
- **Esforço:** M
- **Arquivo/Linha:** `.ops/quarantine/runtime-noise/root-files/auditoria birthub 360.html:528`
- **Evidência/Como detectado:** .ops/quarantine/runtime-noise/root-files/auditoria birthub 360.html:528:        { id:"c1_4", t:"M", text:"Eliminar todo uso de 'any': substituir por tipos Zod inferidos ou generics explícitos" },
- **Correção sugerida:** Definir interfaces adequadas
- **Testes recomendados:** Testes de tipagem e unitários

### [TD-8] DÍVIDAS DE TIPAGEM: Uso de any explícito
- **Severidade:** MÉDIO
- **Prioridade:** P2 média
- **Status:** Confirmado por evidência
- **Impacto:** Reduz a segurança estática de tipos
- **Risco de não corrigir:** Risco de erros em tempo de execução
- **Recomendação:** Substituir any por tipos concretos ou unknown com narrowing
- **Esforço:** M
- **Arquivo/Linha:** `.ops/quarantine/runtime-noise/root-files/auditoria birthub 360.html:832`
- **Evidência/Como detectado:** .ops/quarantine/runtime-noise/root-files/auditoria birthub 360.html:832:    "Zero uso de 'any' no TypeScript (strict: true)",
- **Correção sugerida:** Definir interfaces adequadas
- **Testes recomendados:** Testes de tipagem e unitários

### [TD-9] DÍVIDAS DE TIPAGEM: Uso de any explícito
- **Severidade:** MÉDIO
- **Prioridade:** P2 média
- **Status:** Confirmado por evidência
- **Impacto:** Reduz a segurança estática de tipos
- **Risco de não corrigir:** Risco de erros em tempo de execução
- **Recomendação:** Substituir any por tipos concretos ou unknown com narrowing
- **Esforço:** M
- **Arquivo/Linha:** `.ops/quarantine/runtime-noise/root-files/fix_final.mjs:12`
- **Evidência/Como detectado:** .ops/quarantine/runtime-noise/root-files/fix_final.mjs:12:// To fix this without `@ts-expect-error`, we can just mock `prisma` locally with `mockDeep<PrismaClient>()` and then assign it back, OR we can cast the factory return type to `any` but we can't use `as any`.
- **Correção sugerida:** Definir interfaces adequadas
- **Testes recomendados:** Testes de tipagem e unitários

### [TD-10] DÍVIDAS DE TIPAGEM: Uso de any explícito
- **Severidade:** MÉDIO
- **Prioridade:** P2 média
- **Status:** Confirmado por evidência
- **Impacto:** Reduz a segurança estática de tipos
- **Risco de não corrigir:** Risco de erros em tempo de execução
- **Recomendação:** Substituir any por tipos concretos ou unknown com narrowing
- **Esforço:** M
- **Arquivo/Linha:** `.ops/quarantine/runtime-noise/root-files/fix_final.ts:106`
- **Evidência/Como detectado:** .ops/quarantine/runtime-noise/root-files/fix_final.ts:106:     defaults.user.preferences = overrides.user.preferences as unknown as any;
- **Correção sugerida:** Definir interfaces adequadas
- **Testes recomendados:** Testes de tipagem e unitários

### [TD-11] DÍVIDAS DE TIPAGEM: Uso de any explícito
- **Severidade:** MÉDIO
- **Prioridade:** P2 média
- **Status:** Confirmado por evidência
- **Impacto:** Reduz a segurança estática de tipos
- **Risco de não corrigir:** Risco de erros em tempo de execução
- **Recomendação:** Substituir any por tipos concretos ou unknown com narrowing
- **Esforço:** M
- **Arquivo/Linha:** `.ops/quarantine/runtime-noise/root-files/fix_final.ts:135`
- **Evidência/Como detectado:** .ops/quarantine/runtime-noise/root-files/fix_final.ts:135:  `injectedClient.userPreference.upsert.mockImplementation(async (args: any) => {\n    received = args;\n    return createMockUserPreference({ inAppNotifications: true }) as any;\n  });`);
- **Correção sugerida:** Definir interfaces adequadas
- **Testes recomendados:** Testes de tipagem e unitários

### [TD-12] DÍVIDAS DE TIPAGEM: Uso de any explícito
- **Severidade:** MÉDIO
- **Prioridade:** P2 média
- **Status:** Confirmado por evidência
- **Impacto:** Reduz a segurança estática de tipos
- **Risco de não corrigir:** Risco de erros em tempo de execução
- **Recomendação:** Substituir any por tipos concretos ou unknown com narrowing
- **Esforço:** M
- **Arquivo/Linha:** `.ops/quarantine/runtime-noise/root-files/fix_final.ts:138`
- **Evidência/Como detectado:** .ops/quarantine/runtime-noise/root-files/fix_final.ts:138:  `injectedClient.userPreference.upsert.mockResolvedValue(createMockUserPreference({ inAppNotifications: true }) as any);`);
- **Correção sugerida:** Definir interfaces adequadas
- **Testes recomendados:** Testes de tipagem e unitários

### [TD-13] DÍVIDAS DE TIPAGEM: Uso de any explícito
- **Severidade:** MÉDIO
- **Prioridade:** P2 média
- **Status:** Confirmado por evidência
- **Impacto:** Reduz a segurança estática de tipos
- **Risco de não corrigir:** Risco de erros em tempo de execução
- **Recomendação:** Substituir any por tipos concretos ou unknown com narrowing
- **Esforço:** M
- **Arquivo/Linha:** `.ops/quarantine/runtime-noise/root-files/fix_final.ts:141`
- **Evidência/Como detectado:** .ops/quarantine/runtime-noise/root-files/fix_final.ts:141:  `injectedClient.notification.create.mockImplementation(async (args: any) => { createArgs = args; return createMockNotification({ id: "notification_1" }) as any; });`);
- **Correção sugerida:** Definir interfaces adequadas
- **Testes recomendados:** Testes de tipagem e unitários

### [TD-14] DÍVIDAS DE TIPAGEM: Uso de any explícito
- **Severidade:** MÉDIO
- **Prioridade:** P2 média
- **Status:** Confirmado por evidência
- **Impacto:** Reduz a segurança estática de tipos
- **Risco de não corrigir:** Risco de erros em tempo de execução
- **Recomendação:** Substituir any por tipos concretos ou unknown com narrowing
- **Esforço:** M
- **Arquivo/Linha:** `.ops/quarantine/runtime-noise/root-files/fix_final.ts:144`
- **Evidência/Como detectado:** .ops/quarantine/runtime-noise/root-files/fix_final.ts:144:  `injectedClient.userPreference.findUnique.mockResolvedValue(createMockUserPreference({ cookieConsent: "PENDING" }) as any);`);
- **Correção sugerida:** Definir interfaces adequadas
- **Testes recomendados:** Testes de tipagem e unitários

### [TD-15] DÍVIDAS DE TIPAGEM: Uso de any explícito
- **Severidade:** MÉDIO
- **Prioridade:** P2 média
- **Status:** Confirmado por evidência
- **Impacto:** Reduz a segurança estática de tipos
- **Risco de não corrigir:** Risco de erros em tempo de execução
- **Recomendação:** Substituir any por tipos concretos ou unknown com narrowing
- **Esforço:** M
- **Arquivo/Linha:** `.ops/quarantine/runtime-noise/root-files/fix_final.ts:147`
- **Evidência/Como detectado:** .ops/quarantine/runtime-noise/root-files/fix_final.ts:147:  `injectedClient.userPreference.upsert.mockResolvedValue(createMockUserPreference({ cookieConsent: "ACCEPTED", id: "pref_1" }) as any);`);
- **Correção sugerida:** Definir interfaces adequadas
- **Testes recomendados:** Testes de tipagem e unitários

### [TD-16] DÍVIDAS DE TIPAGEM: Uso de any explícito
- **Severidade:** MÉDIO
- **Prioridade:** P2 média
- **Status:** Confirmado por evidência
- **Impacto:** Reduz a segurança estática de tipos
- **Risco de não corrigir:** Risco de erros em tempo de execução
- **Recomendação:** Substituir any por tipos concretos ou unknown com narrowing
- **Esforço:** M
- **Arquivo/Linha:** `.ops/quarantine/runtime-noise/root-files/fix_final.ts:150`
- **Evidência/Como detectado:** .ops/quarantine/runtime-noise/root-files/fix_final.ts:150:  `injectedClient.auditLog.create.mockImplementation(async (args: any) => { auditPayload = args; return createMockAuditLog({}) as any; });`);
- **Correção sugerida:** Definir interfaces adequadas
- **Testes recomendados:** Testes de tipagem e unitários

### [TD-17] DÍVIDAS DE TIPAGEM: Uso de any explícito
- **Severidade:** MÉDIO
- **Prioridade:** P2 média
- **Status:** Confirmado por evidência
- **Impacto:** Reduz a segurança estática de tipos
- **Risco de não corrigir:** Risco de erros em tempo de execução
- **Recomendação:** Substituir any por tipos concretos ou unknown com narrowing
- **Esforço:** M
- **Arquivo/Linha:** `.ops/quarantine/runtime-noise/root-files/fix_final.ts:153`
- **Evidência/Como detectado:** .ops/quarantine/runtime-noise/root-files/fix_final.ts:153:  `injectedClient.membership.findMany.mockReturnValue(createPrismaPromise([createMockMembership({ role: "ADMIN" })]) as any);`);
- **Correção sugerida:** Definir interfaces adequadas
- **Testes recomendados:** Testes de tipagem e unitários

### [TD-18] DÍVIDAS DE TIPAGEM: Uso de any explícito
- **Severidade:** MÉDIO
- **Prioridade:** P2 média
- **Status:** Confirmado por evidência
- **Impacto:** Reduz a segurança estática de tipos
- **Risco de não corrigir:** Risco de erros em tempo de execução
- **Recomendação:** Substituir any por tipos concretos ou unknown com narrowing
- **Esforço:** M
- **Arquivo/Linha:** `.ops/quarantine/runtime-noise/root-files/fix_final.ts:156`
- **Evidência/Como detectado:** .ops/quarantine/runtime-noise/root-files/fix_final.ts:156:  `injectedClient.notification.createMany.mockImplementation(async (args: any) => { createManyArgs = args; return createPrismaPromise({ count: 1 } as Prisma.BatchPayload) as any; });`);
- **Correção sugerida:** Definir interfaces adequadas
- **Testes recomendados:** Testes de tipagem e unitários

### [TD-19] DÍVIDAS DE TIPAGEM: Uso de any explícito
- **Severidade:** MÉDIO
- **Prioridade:** P2 média
- **Status:** Confirmado por evidência
- **Impacto:** Reduz a segurança estática de tipos
- **Risco de não corrigir:** Risco de erros em tempo de execução
- **Recomendação:** Substituir any por tipos concretos ou unknown com narrowing
- **Esforço:** M
- **Arquivo/Linha:** `.ops/quarantine/runtime-noise/root-files/fix_final.ts:159`
- **Evidência/Como detectado:** .ops/quarantine/runtime-noise/root-files/fix_final.ts:159:  `injectedClient.notification.findMany.mockReturnValue(createPrismaPromise([\n      createMockNotification({ id: "n3" }),\n      createMockNotification({ id: "n2" }),\n      createMockNotification({ id: "n1" })\n    ]) as any);`);
- **Correção sugerida:** Definir interfaces adequadas
- **Testes recomendados:** Testes de tipagem e unitários

### [TD-20] DÍVIDAS DE TIPAGEM: Uso de any explícito
- **Severidade:** MÉDIO
- **Prioridade:** P2 média
- **Status:** Confirmado por evidência
- **Impacto:** Reduz a segurança estática de tipos
- **Risco de não corrigir:** Risco de erros em tempo de execução
- **Recomendação:** Substituir any por tipos concretos ou unknown com narrowing
- **Esforço:** M
- **Arquivo/Linha:** `.ops/quarantine/runtime-noise/root-files/fix_final.ts:162`
- **Evidência/Como detectado:** .ops/quarantine/runtime-noise/root-files/fix_final.ts:162:  `injectedClient.notification.count.mockReturnValue(createPrismaPromise(7) as any);`);
- **Correção sugerida:** Definir interfaces adequadas
- **Testes recomendados:** Testes de tipagem e unitários

### [TD-61] DÍVIDAS DE TIPAGEM: Supressão de erro de tipagem
- **Severidade:** ALTO
- **Prioridade:** P1 alta
- **Status:** Confirmado por evidência
- **Impacto:** Oculta erros reais de tipagem
- **Risco de não corrigir:** Bugs não previstos
- **Recomendação:** Corrigir a tipagem, remover @ts-ignore ou usar @ts-expect-error com comentário
- **Esforço:** M
- **Arquivo/Linha:** `.ops/analysis/type-suppressions.json:4876`
- **Evidência/Como detectado:** .ops/analysis/type-suppressions.json:4876:      "snippet": "const ignoreMatch = line.match(/@ts-ignore\\b(.*)$/u);",
- **Correção sugerida:** Corrigir os tipos
- **Testes recomendados:** Testes de typecheck

### [TD-62] DÍVIDAS DE TIPAGEM: Supressão de erro de tipagem
- **Severidade:** ALTO
- **Prioridade:** P1 alta
- **Status:** Confirmado por evidência
- **Impacto:** Oculta erros reais de tipagem
- **Risco de não corrigir:** Bugs não previstos
- **Recomendação:** Corrigir a tipagem, remover @ts-ignore ou usar @ts-expect-error com comentário
- **Esforço:** M
- **Arquivo/Linha:** `.ops/analysis/type-suppressions.json:4885`
- **Evidência/Como detectado:** .ops/analysis/type-suppressions.json:4885:      "snippet": "`- ${sectionLabels[entry.section]}: ${entry.noCheck} @ts-nocheck, ${entry.tsIgnore} unjustified @ts-ignore`",
- **Correção sugerida:** Corrigir os tipos
- **Testes recomendados:** Testes de typecheck

### [TD-63] DÍVIDAS DE TIPAGEM: Supressão de erro de tipagem
- **Severidade:** ALTO
- **Prioridade:** P1 alta
- **Status:** Confirmado por evidência
- **Impacto:** Oculta erros reais de tipagem
- **Risco de não corrigir:** Bugs não previstos
- **Recomendação:** Corrigir a tipagem, remover @ts-ignore ou usar @ts-expect-error com comentário
- **Esforço:** M
- **Arquivo/Linha:** `.ops/analysis/type-suppressions.json:4894`
- **Evidência/Como detectado:** .ops/analysis/type-suppressions.json:4894:      "snippet": "`- ${sectionLabels[entry.section]}: ${entry.noCheck} @ts-nocheck, ${entry.tsIgnore} unjustified @ts-ignore`",
- **Correção sugerida:** Corrigir os tipos
- **Testes recomendados:** Testes de typecheck

### [TD-64] DÍVIDAS DE TIPAGEM: Supressão de erro de tipagem
- **Severidade:** ALTO
- **Prioridade:** P1 alta
- **Status:** Confirmado por evidência
- **Impacto:** Oculta erros reais de tipagem
- **Risco de não corrigir:** Bugs não previstos
- **Recomendação:** Corrigir a tipagem, remover @ts-ignore ou usar @ts-expect-error com comentário
- **Esforço:** M
- **Arquivo/Linha:** `.ops/analysis/type-suppressions.json:4921`
- **Evidência/Como detectado:** .ops/analysis/type-suppressions.json:4921:      "snippet": "console.error(\" - New @ts-ignore directives require inline justification (>=12 chars after directive):\");",
- **Correção sugerida:** Corrigir os tipos
- **Testes recomendados:** Testes de typecheck

### [TD-65] DÍVIDAS DE TIPAGEM: Supressão de erro de tipagem
- **Severidade:** ALTO
- **Prioridade:** P1 alta
- **Status:** Confirmado por evidência
- **Impacto:** Oculta erros reais de tipagem
- **Risco de não corrigir:** Bugs não previstos
- **Recomendação:** Corrigir a tipagem, remover @ts-ignore ou usar @ts-expect-error com comentário
- **Esforço:** M
- **Arquivo/Linha:** `.ops/analysis/type-suppressions.json:4948`
- **Evidência/Como detectado:** .ops/analysis/type-suppressions.json:4948:      "snippet": "`- Improvements detected: ${retiredNoCheckViolations} @ts-nocheck and ${retiredTsIgnoreViolations} @ts-ignore removed fr",
- **Correção sugerida:** Corrigir os tipos
- **Testes recomendados:** Testes de typecheck

### [TD-66] DÍVIDAS DE TIPAGEM: Supressão de erro de tipagem
- **Severidade:** ALTO
- **Prioridade:** P1 alta
- **Status:** Confirmado por evidência
- **Impacto:** Oculta erros reais de tipagem
- **Risco de não corrigir:** Bugs não previstos
- **Recomendação:** Corrigir a tipagem, remover @ts-ignore ou usar @ts-expect-error com comentário
- **Esforço:** M
- **Arquivo/Linha:** `.ops/analysis/type-suppressions.json:4957`
- **Evidência/Como detectado:** .ops/analysis/type-suppressions.json:4957:      "snippet": "`- Improvements detected: ${retiredNoCheckViolations} @ts-nocheck and ${retiredTsIgnoreViolations} @ts-ignore removed fr",
- **Correção sugerida:** Corrigir os tipos
- **Testes recomendados:** Testes de typecheck

### [TD-67] DÍVIDAS DE TIPAGEM: Supressão de erro de tipagem
- **Severidade:** ALTO
- **Prioridade:** P1 alta
- **Status:** Confirmado por evidência
- **Impacto:** Oculta erros reais de tipagem
- **Risco de não corrigir:** Bugs não previstos
- **Recomendação:** Corrigir a tipagem, remover @ts-ignore ou usar @ts-expect-error com comentário
- **Esforço:** M
- **Arquivo/Linha:** `.ops/tools/generate_cycles.js:402`
- **Evidência/Como detectado:** .ops/tools/generate_cycles.js:402:    if (line.includes('@ts-ignore')) {
- **Correção sugerida:** Corrigir os tipos
- **Testes recomendados:** Testes de typecheck

### [TD-68] DÍVIDAS DE TIPAGEM: Supressão de erro de tipagem
- **Severidade:** ALTO
- **Prioridade:** P1 alta
- **Status:** Confirmado por evidência
- **Impacto:** Oculta erros reais de tipagem
- **Risco de não corrigir:** Bugs não previstos
- **Recomendação:** Corrigir a tipagem, remover @ts-ignore ou usar @ts-expect-error com comentário
- **Esforço:** M
- **Arquivo/Linha:** `apps/worker/patch_workers_7.js:7`
- **Evidência/Como detectado:** apps/worker/patch_workers_7.js:7:  '// @ts-ignore\n  if (!execution.workflowRevision || !execution.workflowRevision.definition) {'
- **Correção sugerida:** Corrigir os tipos
- **Testes recomendados:** Testes de typecheck

### [TD-69] DÍVIDAS DE TIPAGEM: Supressão de erro de tipagem
- **Severidade:** ALTO
- **Prioridade:** P1 alta
- **Status:** Confirmado por evidência
- **Impacto:** Oculta erros reais de tipagem
- **Risco de não corrigir:** Bugs não previstos
- **Recomendação:** Corrigir a tipagem, remover @ts-ignore ou usar @ts-expect-error com comentário
- **Esforço:** M
- **Arquivo/Linha:** `apps/worker/patch_workers_7.js:11`
- **Evidência/Como detectado:** apps/worker/patch_workers_7.js:11:  '// @ts-ignore\n  const definition = execution.workflowRevision.definition as { steps?: any[], transitions?: any[] };'
- **Correção sugerida:** Corrigir os tipos
- **Testes recomendados:** Testes de typecheck

### [TD-70] DÍVIDAS DE TIPAGEM: Supressão de erro de tipagem
- **Severidade:** ALTO
- **Prioridade:** P1 alta
- **Status:** Confirmado por evidência
- **Impacto:** Oculta erros reais de tipagem
- **Risco de não corrigir:** Bugs não previstos
- **Recomendação:** Corrigir a tipagem, remover @ts-ignore ou usar @ts-expect-error com comentário
- **Esforço:** M
- **Arquivo/Linha:** `apps/worker/src/worker.workflows.ts:27`
- **Evidência/Como detectado:** apps/worker/src/worker.workflows.ts:27:  // @ts-ignore
- **Correção sugerida:** Corrigir os tipos
- **Testes recomendados:** Testes de typecheck

### [TD-71] DÍVIDAS DE TIPAGEM: Supressão de erro de tipagem
- **Severidade:** ALTO
- **Prioridade:** P1 alta
- **Status:** Confirmado por evidência
- **Impacto:** Oculta erros reais de tipagem
- **Risco de não corrigir:** Bugs não previstos
- **Recomendação:** Corrigir a tipagem, remover @ts-ignore ou usar @ts-expect-error com comentário
- **Esforço:** M
- **Arquivo/Linha:** `apps/worker/src/worker.workflows.ts:33`
- **Evidência/Como detectado:** apps/worker/src/worker.workflows.ts:33:  // @ts-ignore
- **Correção sugerida:** Corrigir os tipos
- **Testes recomendados:** Testes de typecheck

### [TD-72] DÍVIDAS DE TIPAGEM: Supressão de erro de tipagem
- **Severidade:** ALTO
- **Prioridade:** P1 alta
- **Status:** Confirmado por evidência
- **Impacto:** Oculta erros reais de tipagem
- **Risco de não corrigir:** Bugs não previstos
- **Recomendação:** Corrigir a tipagem, remover @ts-ignore ou usar @ts-expect-error com comentário
- **Esforço:** M
- **Arquivo/Linha:** `apps/worker/src/worker.workflows.ts:133`
- **Evidência/Como detectado:** apps/worker/src/worker.workflows.ts:133:    // @ts-ignore
- **Correção sugerida:** Corrigir os tipos
- **Testes recomendados:** Testes de typecheck

### [TD-73] DÍVIDAS DE TIPAGEM: Supressão de erro de tipagem
- **Severidade:** ALTO
- **Prioridade:** P1 alta
- **Status:** Confirmado por evidência
- **Impacto:** Oculta erros reais de tipagem
- **Risco de não corrigir:** Bugs não previstos
- **Recomendação:** Corrigir a tipagem, remover @ts-ignore ou usar @ts-expect-error com comentário
- **Esforço:** M
- **Arquivo/Linha:** `apps/worker/src/worker.workflows.ts:134`
- **Evidência/Como detectado:** apps/worker/src/worker.workflows.ts:134:    await prisma.usageRecord.create({ // @ts-ignore
- **Correção sugerida:** Corrigir os tipos
- **Testes recomendados:** Testes de typecheck

### [TD-74] DÍVIDAS DE TIPAGEM: Supressão de erro de tipagem
- **Severidade:** ALTO
- **Prioridade:** P1 alta
- **Status:** Confirmado por evidência
- **Impacto:** Oculta erros reais de tipagem
- **Risco de não corrigir:** Bugs não previstos
- **Recomendação:** Corrigir a tipagem, remover @ts-ignore ou usar @ts-expect-error com comentário
- **Esforço:** M
- **Arquivo/Linha:** `audit/governance_inventory_complete_2026-03-29.html:110647`
- **Evidência/Como detectado:** audit/governance_inventory_complete_2026-03-29.html:110647:    const ignoreMatch = line.match(/@ts-ignore\b(.*)$/u);
- **Correção sugerida:** Corrigir os tipos
- **Testes recomendados:** Testes de typecheck

### [TD-75] DÍVIDAS DE TIPAGEM: Supressão de erro de tipagem
- **Severidade:** ALTO
- **Prioridade:** P1 alta
- **Status:** Confirmado por evidência
- **Impacto:** Oculta erros reais de tipagem
- **Risco de não corrigir:** Bugs não previstos
- **Recomendação:** Corrigir a tipagem, remover @ts-ignore ou usar @ts-expect-error com comentário
- **Esforço:** M
- **Arquivo/Linha:** `audit/governance_inventory_complete_2026-03-29.html:110668`
- **Evidência/Como detectado:** audit/governance_inventory_complete_2026-03-29.html:110668:    console.error(&quot;- @ts-ignore requires inline justification (&gt;=12 chars after directive):&quot;);
- **Correção sugerida:** Corrigir os tipos
- **Testes recomendados:** Testes de typecheck

### [TD-76] DÍVIDAS DE TIPAGEM: Supressão de erro de tipagem
- **Severidade:** ALTO
- **Prioridade:** P1 alta
- **Status:** Confirmado por evidência
- **Impacto:** Oculta erros reais de tipagem
- **Risco de não corrigir:** Bugs não previstos
- **Recomendação:** Corrigir a tipagem, remover @ts-ignore ou usar @ts-expect-error com comentário
- **Esforço:** M
- **Arquivo/Linha:** `audit/repo-doctor/20260417_224259/findings.json:33642`
- **Evidência/Como detectado:** audit/repo-doctor/20260417_224259/findings.json:33642:        "Details":  "C:\\Users\\Marks\\Documents\\GitHub\\PROJETO-FINAL-BIRTHUB-360-INNOVATION\\audit\\governance_inventory_complete_2026-03-29.html:111740 =\u003e console.error(\u0026quot;- @ts-ignore requires inline justification (\u0026gt;=12 chars after directive):\u0026quot;);"
- **Correção sugerida:** Corrigir os tipos
- **Testes recomendados:** Testes de typecheck

### [TD-77] DÍVIDAS DE TIPAGEM: Supressão de erro de tipagem
- **Severidade:** ALTO
- **Prioridade:** P1 alta
- **Status:** Confirmado por evidência
- **Impacto:** Oculta erros reais de tipagem
- **Risco de não corrigir:** Bugs não previstos
- **Recomendação:** Corrigir a tipagem, remover @ts-ignore ou usar @ts-expect-error com comentário
- **Esforço:** M
- **Arquivo/Linha:** `audit/repo-doctor/20260417_224259/findings.json:37428`
- **Evidência/Como detectado:** audit/repo-doctor/20260417_224259/findings.json:37428:        "Details":  "C:\\Users\\Marks\\Documents\\GitHub\\PROJETO-FINAL-BIRTHUB-360-INNOVATION\\scripts\\ci\\ts-directives-guard.mjs:398 =\u003e console.error(\"  - New @ts-ignore directives require inline justification (\u003e=12 chars after directive):\");"
- **Correção sugerida:** Corrigir os tipos
- **Testes recomendados:** Testes de typecheck

### [TD-78] DÍVIDAS DE TIPAGEM: Supressão de erro de tipagem
- **Severidade:** ALTO
- **Prioridade:** P1 alta
- **Status:** Confirmado por evidência
- **Impacto:** Oculta erros reais de tipagem
- **Risco de não corrigir:** Bugs não previstos
- **Recomendação:** Corrigir a tipagem, remover @ts-ignore ou usar @ts-expect-error com comentário
- **Esforço:** M
- **Arquivo/Linha:** `audit/repo-doctor/20260417_224259/report.html:33678`
- **Evidência/Como detectado:** audit/repo-doctor/20260417_224259/report.html:33678:    <td><pre style='white-space:pre-wrap;margin:0;'>C:\Users\Marks\Documents\GitHub\PROJETO-FINAL-BIRTHUB-360-INNOVATION\audit\governance_inventory_complete_2026-03-29.html:111740 =&gt; console.error(&amp;quot;- @ts-ignore requires inline justification (&amp;gt;=12 chars after directive):&amp;quot;);</pre></td>
- **Correção sugerida:** Corrigir os tipos
- **Testes recomendados:** Testes de typecheck

### [TD-79] DÍVIDAS DE TIPAGEM: Supressão de erro de tipagem
- **Severidade:** ALTO
- **Prioridade:** P1 alta
- **Status:** Confirmado por evidência
- **Impacto:** Oculta erros reais de tipagem
- **Risco de não corrigir:** Bugs não previstos
- **Recomendação:** Corrigir a tipagem, remover @ts-ignore ou usar @ts-expect-error com comentário
- **Esforço:** M
- **Arquivo/Linha:** `audit/repo-doctor/20260417_224259/report.html:37464`
- **Evidência/Como detectado:** audit/repo-doctor/20260417_224259/report.html:37464:    <td><pre style='white-space:pre-wrap;margin:0;'>C:\Users\Marks\Documents\GitHub\PROJETO-FINAL-BIRTHUB-360-INNOVATION\scripts\ci\ts-directives-guard.mjs:398 =&gt; console.error(&quot;  - New @ts-ignore directives require inline justification (&gt;=12 chars after directive):&quot;);</pre></td>
- **Correção sugerida:** Corrigir os tipos
- **Testes recomendados:** Testes de typecheck

### [TD-80] DÍVIDAS DE TIPAGEM: Supressão de erro de tipagem
- **Severidade:** ALTO
- **Prioridade:** P1 alta
- **Status:** Confirmado por evidência
- **Impacto:** Oculta erros reais de tipagem
- **Risco de não corrigir:** Bugs não previstos
- **Recomendação:** Corrigir a tipagem, remover @ts-ignore ou usar @ts-expect-error com comentário
- **Esforço:** M
- **Arquivo/Linha:** `docs/audits/technical-debt/type-safety-debts.md:80`
- **Evidência/Como detectado:** docs/audits/technical-debt/type-safety-debts.md:80:docs/audits/technical-debt/technical-debt-full-report.md:45:Categoria: Tipagem. Divida detectada: TypeScript permissivo e uso amplo de supressoes. Severidade: Medio. Status: Confirmado por evidencia. Evidencia: `tsconfig.base.json:9` `strict:false`, `:10` `noImplicitAny:false`, `:11` `exactOptionalPropertyTypes:false`, `:12` `useUnknownInCatchVariables:false`; buscas encontraram 198 ocorrencias de `any`, 18 `as any`, 171 `@ts-expect-error` e 11 `@ts-ignore`. Como: leitura de tsconfig e `rg`. Impacto: contratos de dominio e API menos confiaveis. Risco: erros em runtime mascarados. Recomendacao: habilitar flags por pacote em fases. Esforco: G. Testes: typecheck por pacote e lint de ban-types/suppressions. Prioridade: P2 media.
- **Correção sugerida:** Corrigir os tipos
- **Testes recomendados:** Testes de typecheck
