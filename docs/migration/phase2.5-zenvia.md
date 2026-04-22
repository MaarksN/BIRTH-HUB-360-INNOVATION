# Phase 2.5 Zenvia

## Objetivo

Adicionar o conector Zenvia como novo canal de comunicacao no mesmo modelo endurecido da fase Slack:

- credenciais por tenant;
- envio idempotente;
- execucao assincrona no worker;
- status de entrega processado por webhook;
- logs estruturados;
- estado visivel no dashboard via `lastExecution` e `crmSyncEvent`.

## Escopo implementado

1. `packages/integrations`
   - adapter `ZenviaMessageAdapter` com:
     - envio de mensagem por `POST /channels/{channel}/messages`;
     - health check por `GET /subscriptions`;
     - classificacao de erro para auth, rate limit, timeout e falha de request.
2. `packages/connectors-core`
   - provider `zenvia` habilitado no runtime;
   - reaproveitamento da action `message.send`;
   - handler dedicado para Zenvia com `externalId` apontando para o id da mensagem do provider;
   - taxonomia de erro serializada para o pipeline central.
3. `apps/worker`
   - extracao de payload Zenvia no padrao do Slack;
   - leitura da credencial por tenant;
   - envio idempotente usando `externalEventId` como `externalId` do provider;
   - criacao de `ConversationThread` e `ConversationMessage` outbound para reconciliar status depois;
   - persistencia de outbound log, `lastExecution` e `connectorSyncCursor`.
4. `apps/api`
   - health check Zenvia no servico central de conectores;
   - ingestao generica de envio via `/api/v1/connectors/webhooks/zenvia`;
   - webhook dedicado de status via `/api/v1/connectors/webhooks/zenvia/:connectorAccountId/status`;
   - validacao do webhook por `x-zenvia-webhook-secret`;
   - deduplicacao de status inbound por `externalEventId`;
   - atualizacao assincrona de mensagem, thread e dashboard.

## Fluxo

`POST /api/v1/connectors/webhooks/zenvia` -> `crmSyncEvent` inbound -> fila `engagement.connector-events` -> worker -> runtime -> Zenvia -> webhook `POST /api/v1/connectors/webhooks/zenvia/:connectorAccountId/status` -> atualizacao de `ConversationMessage` + `ConversationThread` + `connectorAccount.metadata.lastExecution` -> dashboard

## Payload minimo de envio

```json
{
  "accountKey": "primary",
  "eventType": "message.send",
  "payload": {
    "channel": "whatsapp",
    "from": "5511999999999",
    "to": "5511888888888",
    "text": "BirthHub ping"
  }
}
```

Observacoes:

- `channel` continua explicito para nao misturar o provider Zenvia com um provider direto de WhatsApp.
- `externalEventId` e usado como fallback de idempotencia. Quando nao vier no payload, a API gera um identificador deterministico.

## Payload minimo de status

```json
{
  "type": "MESSAGE_STATUS",
  "id": "evt_123",
  "message": {
    "id": "msg_123",
    "externalId": "zenvia:message.send:..."
  },
  "messageStatus": {
    "code": "DELIVERED"
  }
}
```

Cabecalho esperado:

```text
x-zenvia-webhook-secret: <tenant webhook secret>
```

## Credenciais por tenant

- `apiKey`: token principal de API usado no envio e no health check.
- `webhookSecret`: segredo compartilhado para validar o callback de status.

## Mapeamento de status

- `DELIVERED` e `READ` -> `delivered`
- `REJECTED`, `NOT_DELIVERED` e `DELETED` -> `failed`
- demais codigos operacionais como `SENT` e `VERIFIED` -> `processing`

O status normalizado atualiza:

- `ConversationMessage.metadata.deliveryStatus`
- `ConversationThread.metadata.lastMessageStatus`
- `connectorAccount.metadata.lastExecution`
- `connectorSyncCursor` no escopo `messaging:status`

## Logs estruturados

O fluxo reaproveita o logger central e registra:

- webhook duplicado;
- webhook de status processado;
- falha de entrega reportada pelo provider;
- envio processado pelo worker;
- retries e falhas permanentes do envio.

## Regras mantidas

- Nao ha provider direto de WhatsApp nesta fase.
- O conector permanece simples e focado em texto outbound.
- O desenho replica o padrao Slack: adapter fino, runtime central, worker para envio e API para observabilidade/status.

## Validacao executada

- `pnpm --filter @birthub/integrations exec node --import tsx --test src/adapters/zenvia-message-adapter.test.ts`
- `pnpm --filter @birthub/connectors-core exec node --import tsx --test src/runtime.test.ts`
- `pnpm --filter @birthub/worker exec node --import tsx --test src/integrations/zenvia-events.test.ts`
- `pnpm --filter @birthub/api exec node --import tsx --test src/modules/connectors/normalized-events.test.ts`

## Limitacoes intencionais

- Sem recebimento inbound de mensagens do ecossistema Zenvia nesta fase.
- Sem branch separado para WhatsApp Business API.
- Sem configuracao automatica de subscriptions no provider; o handler assume o webhook ja apontado para a rota do tenant.
