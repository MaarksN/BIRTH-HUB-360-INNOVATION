# DTOs, Inputs e Mass Assignment

Fase 2 endurece contratos de entrada para impedir que o cliente envie campos internos como `tenantId`, `userId`, `organizationId`, `role`, `context` ou `status` fora do schema permitido.

## Regras

- DTOs de mutation devem usar Zod com `.strict()`.
- Controllers devem repassar apenas campos validados e explicitamente nomeados para services.
- Contexto autenticado (`tenantId`, `organizationId`, `userId`, `role`) deve vir de `request.context`, nunca do body.
- Campos livres continuam permitidos somente dentro de envelopes intencionais como `payload`, `metadata`, `triggerConfig` ou payload bruto de provider.
- Payloads de providers externos podem usar `.passthrough()` quando o contrato do provider exigir compatibilidade com campos adicionais.

## Superficies reforcadas

- Auth: login, MFA e refresh rejeitam campos inesperados.
- Organizations/invites/API keys/users/privacy: mutations sensiveis rejeitam campos fora do DTO.
- Tasks: campos top-level de contexto sao bloqueados antes de consumo de budget ou enqueue.
- Webhook settings e connectors ja usam schemas estritos para create/update internos.

## Testes

- `packages/config/src/contracts.test.ts` cobre rejeicao de campos inesperados nos contratos compartilhados.
- `apps/api/tests/tasks-router.test.ts` cobre tentativa de mass assignment em task enqueue e garante ausencia de side effects.
- Testes existentes de dashboard e webhook settings seguem cobrindo rejeicao de propriedades inesperadas em endpoints sensiveis.
