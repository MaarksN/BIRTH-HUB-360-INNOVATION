# Phase 2.3 Stripe

## Objetivo

Entregar o menor fluxo Stripe util sem alterar o padrao arquitetural consolidado nas fases anteriores:

- webhook Stripe autenticado;
- idempotencia obrigatoria por `externalEventId`;
- credencial por tenant;
- execucao assincrona via worker;
- classificacao retryable vs fatal;
- log estruturado;
- persistencia de execucao visivel no runtime e dashboard.

## Escopo implementado

1. `packages/integrations`
   - adapter `StripePaymentAdapter` com:
     - leitura de `payment_intent` e `charge`;
     - health check por leitura autenticada minima;
     - taxonomia de erro Stripe com auth, timeout, rate limit e erro de servidor.
2. `packages/connectors-core`
   - novo provider `stripe`;
   - nova action `payment.read`;
   - handler do runtime para execucao real do adapter Stripe.
3. `apps/api`
   - validacao da assinatura do webhook Stripe usando segredo do tenant;
   - normalizacao de eventos suportados para `payment.read`;
   - idempotencia baseada em `externalEventId`;
   - health check Stripe no servico central de conectores.
4. `apps/webhook-receiver`
   - rota `POST /webhooks/stripe`;
   - forward do `rawBody` e do header `stripe-signature` para a API;
   - preservacao do status de erro quando a API rejeita a assinatura.
5. `apps/worker`
   - processamento Stripe no pipeline existente de connector events;
   - leitura segura de `apiKey` por tenant;
   - persistencia de outbound log, `lastExecution` e `connectorSyncCursor`.

## Fluxo minimo

`POST /webhooks/stripe` -> `POST /api/v1/connectors/webhooks/stripe` -> `crmSyncEvent` inbound -> fila `engagement.connector-events` -> worker -> `connectors-core` -> Stripe API -> `crmSyncEvent` outbound -> `connectorAccount.metadata.lastExecution` -> dashboard

## Eventos suportados nesta fase

- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.succeeded`
- `charge.failed`

O processamento funcional desta fase foca somente em leitura do pagamento relacionado ao evento. Nao foi aberto fluxo de billing completo.

## Payload minimo esperado no receiver

O webhook chega bruto do Stripe e o receiver encaminha:

```json
{
  "eventType": "payment_intent.succeeded",
  "externalEventId": "evt_123",
  "payload": {
    "stripe": {
      "id": "evt_123",
      "type": "payment_intent.succeeded",
      "data": {
        "object": {
          "id": "pi_123",
          "object": "payment_intent"
        }
      }
    }
  },
  "rawBody": "{\"id\":\"evt_123\",\"type\":\"payment_intent.succeeded\"}",
  "webhookSignature": "t=...,v1=..."
}
```

Depois da validacao da assinatura, a API normaliza o evento para o payload minimo do runtime:

```json
{
  "action": "payment.read",
  "payload": {
    "objectId": "pi_123",
    "objectType": "payment_intent"
  },
  "provider": "stripe"
}
```

## Credenciais

- `apiKey` e obrigatoria para execucao e health check.
- `webhookSecret` e obrigatorio para validar assinatura do webhook Stripe.
- Ambas sao resolvidas por tenant a partir de `connectorAccount.credentials`.
- Nenhuma chave Stripe fica hardcoded no runtime do conector.

## Regras de idempotencia

- `externalEventId` usa preferencialmente o `event.id` do Stripe.
- Eventos duplicados com o mesmo `externalEventId` sao ignorados na API antes do reprocessamento.
- O inbound existente continua registrado para rastreabilidade.

## Regras de erro

- retryable:
  - `STRIPE_RATE_LIMIT`
  - `STRIPE_TIMEOUT`
  - `STRIPE_SERVER_ERROR`
  - falhas transientes de rede normalizadas pelo runtime
- fatais:
  - `STRIPE_AUTH_FAILED`
  - assinatura invalida do webhook
  - payload sem `objectId`
  - payload com `objectType` nao suportado

## Validacao executada

- simulacao de webhook assinado com sucesso;
- simulacao de webhook com assinatura invalida;
- simulacao de duplicidade por `externalEventId` estavel;
- simulacao de leitura de pagamento com sucesso;
- simulacao de auth failure e rate limit no adapter/runtime.

## Pendencias intencionais

- Nao foi criado fluxo novo fora do pipeline generico de conectores.
- Nao foi alterado Slack ou HubSpot.
- Nao foi implementado billing completo, conciliacao ou escrita de pagamentos.
- Nao foi expandida UI alem do reaproveitamento do pipeline e dos logs existentes.
