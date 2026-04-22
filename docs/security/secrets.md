# Secrets e Config Central

Esta etapa consolida a leitura e a validação de segredos sensíveis no pacote `@birthub/config`, reduzindo leitura ad-hoc em runtimes e preparando a base para rotação e futuras integrações com secret managers.

## O que mudou

- `packages/config/src/api.config.ts`
  - centraliza `SESSION_SECRET`, `JOB_HMAC_GLOBAL_SECRET` e `STRIPE_WEBHOOK_SECRET`
  - expõe listas ordenadas de rotação:
    - `sessionSecretCandidates`
    - `jobHmacSecretCandidates`
    - `stripeWebhookSecretCandidates`
  - expõe `secretCatalog` com metadados de origem para auditoria e futura integração com secret manager

- `packages/config/src/worker.config.ts`
  - centraliza `JOB_HMAC_GLOBAL_SECRET`
  - expõe `jobHmacSecretCandidates`
  - adiciona `secretCatalog` para worker

- `packages/config/src/webhook-receiver.config.ts`
  - remove leitura solta de segredos no runtime do webhook receiver
  - padroniza `JOB_HMAC_GLOBAL_SECRET`, `STRIPE_WEBHOOK_SECRET`, `HUBSPOT_CLIENT_SECRET` e `SVIX_WEBHOOK_SECRET`
  - preserva o comportamento de `strictRuntime` por ambiente

- `packages/config/src/secrets.ts`
  - concentra parsing e deduplicação de candidatos de rotação
  - descreve a origem do segredo para observabilidade e futura evolução

## Rotação suportada agora

As verificações sensíveis aceitam uma chave principal e fallbacks configurados por ambiente:

- `SESSION_SECRET` + `SESSION_SECRET_FALLBACKS`
- `JOB_HMAC_GLOBAL_SECRET` + `JOB_HMAC_GLOBAL_SECRET_FALLBACKS`
- `STRIPE_WEBHOOK_SECRET` + `STRIPE_WEBHOOK_SECRET_FALLBACKS`

Uso recomendado:

1. Promover a nova chave para a variável principal.
2. Manter a chave anterior em `*_FALLBACKS` pelo tempo mínimo de drenagem.
3. Remover o fallback após expiração segura de sessões, jobs ou webhooks em trânsito.

## Onde os fallbacks são usados

- autenticação de sessão: aceita tokens assinados com segredo anterior durante rotação controlada
- verificação HMAC interna: aceita segredos globais anteriores para webhooks internos e compatibilidade de jobs legados
- webhook Stripe: aceita segredos anteriores sem interromper replay legítimo durante a troca
- webhook receiver Node: aceita fallback para assinatura Stripe antes do forward para a API

## Hardcoded secrets no runtime

O objetivo desta fase é que runtimes não leiam segredos críticos diretamente com fallback hardcoded fora da camada central.

Estado atual:

- API: leitura centralizada em `@birthub/config`
- Worker: leitura centralizada em `@birthub/config`
- Webhook receiver: leitura centralizada em `@birthub/config`

Defaults de desenvolvimento continuam existindo apenas na camada central de config para compatibilidade local e testes. Em produção, placeholders e defaults inseguros são rejeitados por validação.

## Tenant e provider credentials

Credenciais de conectores continuam armazenadas por tenant/provider em `connectorCredential`, com normalização canônica já adotada pela fase anterior:

- `accessToken`
- `refreshToken`
- `apiKey`
- `appKey`
- `appSecret`
- `webhookSecret`

O runtime de conectores usa esses registros por tenant, sem reintroduzir segredos globais por provider.

## Health checks com credenciais reais

Os health checks de conectores usam credenciais reais armazenadas no tenant:

- HubSpot: token armazenado no `connectorCredential`
- Slack: token armazenado no `connectorCredential`
- Stripe: API key armazenada no `connectorCredential`
- Zenvia: token armazenado no `connectorCredential`
- Omie: `appKey` e `appSecret` armazenados no `connectorCredential`

O fluxo descriptografa o valor persistido e valida acesso no provider real correspondente. Isso evita health checks falsamente verdes baseados em variáveis globais do ambiente.

## Preparação para Vault / Secret Manager

`secretCatalog` registra metadados de origem para permitir a introdução de um resolvedor externo sem remodelar a API de configuração.

Escopo atual:

- pronto para catalogar origem e rotação
- sem resolver automaticamente `Vault`/`Secret Manager` nesta fase
- runtime atual ainda espera valores já injetados no ambiente antes do boot

Quando um resolvedor externo for introduzido, ele deve ser encaixado na camada `@birthub/config`, não diretamente nos apps.
