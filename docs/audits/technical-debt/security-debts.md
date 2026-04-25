# Dívidas de Segurança


### [TD-91] DÍVIDAS DE SEGURANÇA: Possível secret hardcoded
- **Severidade:** CRÍTICO
- **Prioridade:** P0 urgente
- **Status:** Suspeita forte
- **Impacto:** Exposição de credencial
- **Risco de não corrigir:** Vazamento de dados, acesso indevido
- **Recomendação:** Mover para variável de ambiente
- **Esforço:** P
- **Arquivo/Linha:** `apps/api/src/lib/encryption.ts:15`
- **Evidência/Como detectado:** apps/api/src/lib/encryption.ts:15:type ParsedEncryptedConnectorToken = {
- **Correção sugerida:** Uso de process.env.SECRET
- **Testes recomendados:** Verificar config

### [TD-92] DÍVIDAS DE SEGURANÇA: Possível secret hardcoded
- **Severidade:** CRÍTICO
- **Prioridade:** P0 urgente
- **Status:** Suspeita forte
- **Impacto:** Exposição de credencial
- **Risco de não corrigir:** Vazamento de dados, acesso indevido
- **Recomendação:** Mover para variável de ambiente
- **Esforço:** P
- **Arquivo/Linha:** `apps/api/src/lib/encryption.ts:102`
- **Evidência/Como detectado:** apps/api/src/lib/encryption.ts:102:  const parsedToken = parseDelimitedEncryptedConnectorToken(rawPayload);
- **Correção sugerida:** Uso de process.env.SECRET
- **Testes recomendados:** Verificar config

### [TD-93] DÍVIDAS DE SEGURANÇA: Possível secret hardcoded
- **Severidade:** CRÍTICO
- **Prioridade:** P0 urgente
- **Status:** Suspeita forte
- **Impacto:** Exposição de credencial
- **Risco de não corrigir:** Vazamento de dados, acesso indevido
- **Recomendação:** Mover para variável de ambiente
- **Esforço:** P
- **Arquivo/Linha:** `apps/api/src/lib/encryption.ts:149`
- **Evidência/Como detectado:** apps/api/src/lib/encryption.ts:149:  const parsedToken = parseEncryptedConnectorToken(encryptedText);
- **Correção sugerida:** Uso de process.env.SECRET
- **Testes recomendados:** Verificar config

### [TD-94] DÍVIDAS DE SEGURANÇA: Possível secret hardcoded
- **Severidade:** CRÍTICO
- **Prioridade:** P0 urgente
- **Status:** Suspeita forte
- **Impacto:** Exposição de credencial
- **Risco de não corrigir:** Vazamento de dados, acesso indevido
- **Recomendação:** Mover para variável de ambiente
- **Esforço:** P
- **Arquivo/Linha:** `apps/api/src/middleware/authentication.ts:65`
- **Evidência/Como detectado:** apps/api/src/middleware/authentication.ts:65:      const sessionToken = authorization.sessionToken ?? cookies[sessionCookieName] ?? null;
- **Correção sugerida:** Uso de process.env.SECRET
- **Testes recomendados:** Verificar config

### [TD-95] DÍVIDAS DE SEGURANÇA: Possível secret hardcoded
- **Severidade:** CRÍTICO
- **Prioridade:** P0 urgente
- **Status:** Suspeita forte
- **Impacto:** Exposição de credencial
- **Risco de não corrigir:** Vazamento de dados, acesso indevido
- **Recomendação:** Mover para variável de ambiente
- **Esforço:** P
- **Arquivo/Linha:** `apps/api/src/middleware/authentication.ts:66`
- **Evidência/Como detectado:** apps/api/src/middleware/authentication.ts:66:      const apiKeyToken = authorization.apiKeyToken ?? null;
- **Correção sugerida:** Uso de process.env.SECRET
- **Testes recomendados:** Verificar config

### [TD-96] DÍVIDAS DE SEGURANÇA: Possível secret hardcoded
- **Severidade:** CRÍTICO
- **Prioridade:** P0 urgente
- **Status:** Suspeita forte
- **Impacto:** Exposição de credencial
- **Risco de não corrigir:** Vazamento de dados, acesso indevido
- **Recomendação:** Mover para variável de ambiente
- **Esforço:** P
- **Arquivo/Linha:** `apps/api/src/middleware/csrf.ts:33`
- **Evidência/Como detectado:** apps/api/src/middleware/csrf.ts:33:    const cookieToken = cookies[config.cookieName];
- **Correção sugerida:** Uso de process.env.SECRET
- **Testes recomendados:** Verificar config

### [TD-97] DÍVIDAS DE SEGURANÇA: Possível secret hardcoded
- **Severidade:** CRÍTICO
- **Prioridade:** P0 urgente
- **Status:** Suspeita forte
- **Impacto:** Exposição de credencial
- **Risco de não corrigir:** Vazamento de dados, acesso indevido
- **Recomendação:** Mover para variável de ambiente
- **Esforço:** P
- **Arquivo/Linha:** `apps/api/src/middleware/csrf.ts:34`
- **Evidência/Como detectado:** apps/api/src/middleware/csrf.ts:34:    const headerToken = request.header(config.headerName);
- **Correção sugerida:** Uso de process.env.SECRET
- **Testes recomendados:** Verificar config

### [TD-98] DÍVIDAS DE SEGURANÇA: Possível secret hardcoded
- **Severidade:** CRÍTICO
- **Prioridade:** P0 urgente
- **Status:** Suspeita forte
- **Impacto:** Exposição de credencial
- **Risco de não corrigir:** Vazamento de dados, acesso indevido
- **Recomendação:** Mover para variável de ambiente
- **Esforço:** P
- **Arquivo/Linha:** `apps/api/src/modules/auth/auth.service.credentials.ts:106`
- **Evidência/Como detectado:** apps/api/src/modules/auth/auth.service.credentials.ts:106:    const challengeToken = `mfa_${randomToken(36)}`;
- **Correção sugerida:** Uso de process.env.SECRET
- **Testes recomendados:** Verificar config

### [TD-99] DÍVIDAS DE SEGURANÇA: Possível secret hardcoded
- **Severidade:** CRÍTICO
- **Prioridade:** P0 urgente
- **Status:** Suspeita forte
- **Impacto:** Exposição de credencial
- **Risco de não corrigir:** Vazamento de dados, acesso indevido
- **Recomendação:** Mover para variável de ambiente
- **Esforço:** P
- **Arquivo/Linha:** `apps/api/src/modules/auth/auth.service.credentials.ts:202`
- **Evidência/Como detectado:** apps/api/src/modules/auth/auth.service.credentials.ts:202:    const decryptedSecret = decryptTotpSecret(
- **Correção sugerida:** Uso de process.env.SECRET
- **Testes recomendados:** Verificar config

### [TD-100] DÍVIDAS DE SEGURANÇA: Possível secret hardcoded
- **Severidade:** CRÍTICO
- **Prioridade:** P0 urgente
- **Status:** Suspeita forte
- **Impacto:** Exposição de credencial
- **Risco de não corrigir:** Vazamento de dados, acesso indevido
- **Recomendação:** Mover para variável de ambiente
- **Esforço:** P
- **Arquivo/Linha:** `apps/api/src/modules/auth/auth.service.credentials.ts:298`
- **Evidência/Como detectado:** apps/api/src/modules/auth/auth.service.credentials.ts:298:  const secret = generateTotpSecret();
- **Correção sugerida:** Uso de process.env.SECRET
- **Testes recomendados:** Verificar config
