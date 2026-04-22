# Guia de Migração e Operação: HubSpot Connector

> **Status:** IMPLEMENTADO_PARCIAL → pronto para hardening  
> **Fase atual:** 2.6  
> **Revisado em:** 2026-04-21

---

## 1. Visão Geral do Estado Atual

O conector HubSpot é o mais complexo dos conectores parcialmente implementados. Ele cobre dois fluxos distintos que rodam em paralelo e precisam de atenção separada:

| Fluxo | Estado | Arquivo principal |
|---|---|---|
| Sync CRM (empresa → HubSpot company) | Operacional | `apps/worker/src/integrations/hubspot.ts` |
| Webhook ingest (evento → contact upsert) | Operacional | `apps/worker/src/integrations/connector-events.ts` |
| OAuth connect/callback | Funcional após fase 2.5 | `apps/api/src/modules/connectors/service.oauth.ts` |
| Health check | Funcional | `apps/api/src/modules/connectors/service.ts` |

---

## 2. Arquitetura do Pipeline

```
HubSpot (webhook) → apps/webhook-receiver → API /connectors/webhook/ingest
                                              ↓
                                        crmSyncEvent (inbound, status=202)
                                              ↓
                                        BullMQ connector-events queue
                                              ↓
                                    apps/worker connector-events.ts
                                              ↓
                                  connectors-core ConnectorRuntime
                                              ↓
                              HubspotCrmAdapter.upsertContact()
                                              ↓
                                        HubSpot CRM API
                                              ↓
                               persistLocalLead() → customer table
                               touchConnectorCursor() → connectorSyncCursor
                               updateInboundEventStatus() → crmSyncEvent (status=200/5xx)
```

---

## 3. Tipos de Credenciais

O conector HubSpot suporta dois modelos de autenticação:

### 3.1 Private App Token (recomendado para produção)
```
credentialType: "privateAppToken"
encryptedValue: <token-criptografado>
```

No health check, quando `credentialType === "privateAppToken"`, o sistema chama `adapter.validateCrmAccess()` (GET `/crm/v3/objects/contacts?limit=1`), que é mais robusto e não depende do endpoint OAuth.

### 3.2 OAuth Access Token
```
credentialType: "accessToken"
encryptedValue: <access-token-criptografado>
refreshToken: <refresh-token-opcional>
```

Quando `credentialType === "accessToken"`, o sistema chama `adapter.validateAccessToken()` (GET `/oauth/v1/access-tokens/{token}`).

> ⚠️ **Problema conhecido:** Tokens OAuth HubSpot expiram em 30 minutos. O sistema **não** implementa token refresh automático ainda. Enquanto isso não for resolvido, prefira **Private App Token** em produção.

---

## 4. Fluxo OAuth (Connect + Callback)

### 4.1 Iniciar conexão
```
POST /api/connectors/connect
Body: { provider: "hubspot", organizationId, tenantId }
```

Cria uma `connectorAccount` com `status=pending` e retorna `authorizationUrl` para redirecionar o usuário ao HubSpot.

**Variáveis de ambiente necessárias:**
```
HUBSPOT_CLIENT_ID=...
HUBSPOT_CLIENT_SECRET=...
HUBSPOT_REDIRECT_URI=https://app.birthub.com/api/connectors/oauth/callback
```

### 4.2 Callback
```
GET /api/connectors/oauth/callback?code=...&state=...&provider=hubspot
```

O sistema:
1. Valida o `state` contra o `oauthState` armazenado
2. Troca `code` por `access_token` + `refresh_token` via `exchangeConnectorAuthorizationCode()`
3. Persiste credenciais normalizadas (`accessToken`, `refreshToken`, `expiresAt`)
4. Atualiza `connectorAccount.status = "active"`

### 4.3 Diagnóstico de falhas no callback

| Sintoma | Causa provável | Ação |
|---|---|---|
| `status = "pending_token_exchange"` | `code` recebido mas exchange falhou ou não foi tentado | Verificar `HUBSPOT_CLIENT_SECRET` e `HUBSPOT_REDIRECT_URI` |
| `status = "pending"` | Callback nunca chegou | Verificar redirect URI configurada no HubSpot App |
| `status = "active"` mas health retorna unhealthy | Token expirado sem refresh | Reconectar via OAuth ou configurar Private App Token |

---

## 5. Configuração do Webhook no HubSpot

Para receber eventos no pipeline, configure o webhook no painel de desenvolvedor do HubSpot:

**URL de destino:**
```
https://app.birthub.com/api/connectors/webhook/hubspot
```

**Eventos suportados atualmente:**
- `contact.creation` → `crm.contact.upsert`
- `contact.propertyChange` → `crm.contact.upsert`

**Verificação de assinatura:**
O HubSpot assina requisições com HMAC-SHA256 no header `X-HubSpot-Signature-v3`. O sistema valida essa assinatura antes de enfileirar o evento.

---

## 6. Tabela de Mapeamento de Campos (Contato)

| Campo HubSpot | Campo interno | Tipo | Notas |
|---|---|---|---|
| `email` | `contact.email` | string | **Obrigatório** |
| `firstname` | `contact.firstName` | string | opcional |
| `lastname` | `contact.lastName` | string | opcional |
| `phone` | `contact.phone` | string | opcional |
| `company` | `contact.companyName` | string | opcional |
| `hs_lead_status` | `contact.leadStatus` | string | opcional |
| `lifecyclestage` | `contact.lifecycleStage` | string | opcional |

---

## 7. Sync CRM (Empresa → HubSpot Company)

O fluxo de sync CRM é independente do webhook e é acionado por eventos internos da plataforma (ex: mudança de plano, atualização de healthScore):

```
Evento interno → enqueueCrmSync() → hubspot-sync queue → syncOrganizationToHubspot()
```

**Campos sincronizados:**
- `name` → company name
- `domain` → domain
- `bh_arr_cents` → Annual Recurring Revenue (centavos)
- `bh_health_score` → health score
- `bh_plan_code` → código do plano
- `bh_subscription_status` → status da assinatura
- `bh_tenant_id` → tenant ID

**Idempotência:** O worker verifica `crmSyncEvent.externalEventId` antes de processar para evitar duplicatas.

---

## 8. Lacunas Conhecidas (Gap List)

### 8.1 Token Refresh Automático
**Prioridade:** Alta  
**Descrição:** Tokens OAuth expiram em 30 minutos. Atualmente não há mecanismo de refresh automático.  
**Impacto:** Contas OAuth ficam com `status=attention` após 30 minutos sem reconexão.  
**Solução sugerida:** Implementar `refreshConnectorOauthToken()` em `service.oauth.ts` que, quando o `accessToken` tem `expiresAt < now + 5min`, faz POST para `oauth.tokenUrl` com `grant_type=refresh_token`.

### 8.2 Object ID Lookup por Email
**Prioridade:** Média  
**Descrição:** `extractHubspotObjectId()` consegue extrair o ID do HubSpot de payloads de webhook, mas `getContactById()` precisa de um token válido para buscar o contato por ID.  
**Impacto:** Se o payload do webhook não contiver `email` diretamente, o worker faz uma chamada extra à API HubSpot — isso pode falhar se o token estiver inválido.  
**Solução sugerida:** Normalizar o payload no receiver para sempre incluir `email` quando disponível.

### 8.3 Testes de Receiver
**Prioridade:** Média  
**Descrição:** O receiver de webhook HubSpot (`apps/webhook-receiver/`) não tem testes automatizados cobrindo a validação de assinatura e o enfileiramento do evento.  
**Arquivo alvo:** `apps/api/tests/connectors.hubspot.webhook.test.ts` (a criar)

### 8.4 Documentação de Campos Customizados
**Prioridade:** Baixa  
**Descrição:** O adapter suporta `customProperties` no upsert de contato e empresa, mas não há documentação de quais campos customizados o HubSpot App da BirthHub define.

---

## 9. Variáveis de Ambiente Necessárias

```bash
# OAuth
HUBSPOT_CLIENT_ID=<client-id-do-app-hubspot>
HUBSPOT_CLIENT_SECRET=<client-secret>
HUBSPOT_REDIRECT_URI=https://app.birthub.com/api/connectors/oauth/callback

# API base
HUBSPOT_BASE_URL=https://api.hubapi.com

# Criptografia de credenciais (compartilhado com todo o stack)
AUTH_MFA_ENCRYPTION_KEY=<chave-32-bytes>
ALLOW_LEGACY_PLAINTEXT_CONNECTOR_SECRETS=false  # true só em dev/test
```

---

## 10. Sequência de Hardening Recomendada

1. ✅ **Corrigir credenciais OAuth** (feito na fase 2.5 — normalização `access_token → accessToken`)
2. ✅ **Testes de adapter** (`hubspot-crm-adapter.test.ts` — criado nesta fase)
3. ✅ **Testes de worker** (`connector-events.hubspot.test.ts` — criado nesta fase)
4. 🔲 **Implementar token refresh** — `service.oauth.ts` → `refreshConnectorOauthToken()`
5. 🔲 **Testes de receiver** — cobrir `X-HubSpot-Signature-v3` + enfileiramento
6. 🔲 **Private App Token como padrão de onboarding** — simplifica deploy inicial
7. 🔲 **Monitoramento de expiração** — job periódico que detecta tokens próximos do vencimento e marca conta como `attention`

---

## 11. Checklist de Produção

Antes de declarar o conector HubSpot como `IMPLEMENTADO_COMPLETO`:

- [ ] Token refresh automático implementado e testado
- [ ] Receiver de webhook com testes de assinatura
- [ ] Private App Token configurado no ambiente de produção  
- [ ] Health check rodando periodicamente (cron ou endpoint de monitoramento)
- [ ] Alert configurado para `connectorAccount.status = "attention"` por mais de 1h
- [ ] Campos customizados do HubSpot App documentados e validados
- [ ] Rate limiting testado (429 → retry com backoff)
- [ ] Teste de carga: 100 webhooks simultâneos com idempotência validada
