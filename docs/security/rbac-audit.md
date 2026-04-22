# RBAC e Auditoria

Fase 2 endurece autorizacao e trilhas de auditoria para operacao multi-tenant. Operacoes sensiveis devem exigir sessao autenticada, tenant ativo e papel minimo explicito via `RequireRole`.

## Politica RBAC

- `SUPER_ADMIN`: operacoes globais de administracao, impersonation e break-glass.
- `OWNER`: configuracoes criticas do tenant, politicas de retencao e remocao de membros proprietarios.
- `ADMIN`: usuarios, convites, API keys, conectores, webhooks, workflows, billing checkout/portal e paineis administrativos.
- `MEMBER`: operacoes de produto autorizadas sem administracao do tenant.
- `READONLY`: acesso de leitura quando a rota permitir explicitamente.

Callbacks OAuth de conectores tambem exigem `ADMIN`, porque finalizam credenciais reais do tenant. Webhooks de providers continuam fora de `RequireRole`, mas dependem de assinatura/segredo, rate limiting e idempotencia.

## Auditoria

Eventos administrativos devem registrar:

- `tenantId`, `actorId`, `entityType`, `entityId` e `action`.
- diffs minimos, com dados operacionais suficientes para investigacao.
- IP e user-agent quando disponiveis no request.

O envelope `Auditable` redige chaves sensiveis antes da persistencia, incluindo tokens, passwords, secrets, credentials, API keys, cookies, session ids, autorizacao e assinaturas. Rotas que retornam material secreto devem devolver ao audit wrapper apenas identificadores seguros.

## Conectores

As mutacoes de conectores auditadas nesta fase sao:

- `connector.upserted`
- `connector.connect_started`
- `connector.connected`
- `connector.sync_requested`
- `connector.health_checked`

O log de conectores registra apenas identificadores, provider, status e flags operacionais. Credenciais, access tokens, refresh tokens, OAuth state, authorization URLs e assinaturas nao devem entrar em audit log.

## PII e Retencao

- PII em audit log deve ser minimizada; prefira ids internos e metadados nao sensiveis.
- Retencao padrao sugerida: 365 dias para eventos administrativos e 90 dias para eventos operacionais de menor risco, salvo obrigacao legal/contratual.
- Exportacoes e delecoes de dados pessoais devem registrar o evento, mas nao duplicar o conteudo exportado/deletado no audit log.
- Anonimizacao deve substituir identificadores diretos por referencias irreversiveis quando o evento deixar de ser necessario para seguranca ou compliance.

## Testes

- `apps/api/tests/rbac.test.ts` valida a matriz basica de RBAC.
- `apps/api/tests/connectors-router.test.ts` valida `ADMIN` no callback OAuth e auditoria redigida de conectores.
- `apps/api/tests/audit-redaction.test.ts` valida redacao centralizada de segredos no audit envelope.
