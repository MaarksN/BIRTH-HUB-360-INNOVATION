# Phase 2.2 Slack

## Objetivo

Entregar o menor fluxo Slack util que respeite o padrao endurecido da Fase 2.1:

- credencial por tenant;
- evento idempotente;
- execucao assíncrona no worker;
- classificacao retryable vs fatal;
- log estruturado;
- status e ultima execucao visiveis no dashboard.

## Escopo implementado

1. `packages/integrations`
   - adapter `SlackMessageAdapter` com:
     - `auth.test` para health check;
     - `conversations.open` para DM por `userId`;
     - `chat.postMessage` para envio a canal ou conversa direta;
     - taxonomia de erro Slack com rate limit, timeout, auth e erro de request.
2. `packages/connectors-core`
   - novo provider `slack`;
   - nova action `message.send`;
   - handler do runtime para envio real de mensagem.
3. `apps/api`
   - health check Slack no servico central de conectores;
   - ingestao de evento Slack via rota generica existente;
   - normalizacao minima do evento para `message.send`.
4. `apps/worker`
   - processamento Slack no mesmo pipeline endurecido de connector events;
   - leitura de credencial por tenant;
   - persistencia de outbound log, `lastExecution` e `connectorSyncCursor`.
5. `apps/web`
   - ajuste minimo de copy no painel de atividade para refletir eventos outbound.

## Fluxo minimo

`POST /api/v1/connectors/webhooks/slack` -> `crmSyncEvent` (queued) -> fila `engagement.connector-events` -> worker -> `connectors-core` -> Slack API -> `crmSyncEvent` outbound -> `connectorAccount.metadata.lastExecution` -> dashboard

## Payload minimo esperado

```json
{
  "accountKey": "primary",
  "eventType": "message.send",
  "payload": {
    "channel": "C12345678",
    "text": "BirthHub ping"
  }
}
```

Ou para usuario:

```json
{
  "payload": {
    "text": "BirthHub ping",
    "userId": "U12345678"
  }
}
```

## Credenciais

- `botToken` e a credencial preferida para Slack.
- `accessToken` ou `apiKey` continuam aceitos como fallback operacional no mesmo fluxo de tenant.

## Regras de erro

- retryable:
  - `SLACK_RATE_LIMIT`
  - `SLACK_TIMEOUT`
  - `SLACK_SERVER_ERROR`
  - falhas de rede classificadas pelo runtime
- fatais:
  - `SLACK_AUTH_FAILED`
  - payload sem `text`
  - payload sem `channel` e sem `userId`

## Validacao planejada

- typecheck dos pacotes tocados;
- testes focados de adapter, runtime e worker;
- simulacao de:
  - envio com sucesso;
  - token invalido;
  - rate limit retryable.

## Pendencias intencionais

- OAuth Slack nao foi aberto nesta fase.
- Nenhuma nova surface de workflow foi criada para Slack.
- Nao foi adicionada sincronizacao de leitura ou webhook inbound do ecossistema Slack alem do evento minimo de envio.
