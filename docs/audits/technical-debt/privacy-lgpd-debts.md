# Dividas de Privacidade e LGPD

## Achados confirmados

- `TD-001` - arquivos env/sealed rastreados podem conter material sensivel.
- `TD-009`/`TD-038` - testes de consentimento e retencao estao pulados.
- `TD-012` - modelos com `tenantId`/`organizationId` nullable para eventos/exportacoes.

## Evidencias

- `.env:1` contem `DATABASE_URL` mascarado.
- `apps/api/tests/consent.service.test.ts:49`, `:95`.
- `apps/api/tests/retention.service.test.ts:61`, `:129`, `:176`.
- `packages/database/prisma/schema.prisma:740-741` (`BillingEvent`).
- `packages/database/prisma/schema.prisma:957-958` (`DatasetExport`).
- Schema contem campos pessoais como email, telefone, documentos/dados clinicos e IPs em varios modelos.

## Pontos positivos observados

- Existem modulos de privacidade, consentimento, retencao e self-service.
- Ha paginas de privacidade no frontend.
- Existem testes dedicados, embora parte esteja pulada.

## Verificacoes manuais necessarias

- Retencao real por tipo de dado.
- Exportacao/exclusao de usuario ponta a ponta.
- Mascaramento de PII em logs e audit logs.
- Consentimento para analytics/tracking.
- Dados pessoais em seeds/fixtures.
- Politica de backup/expurgo.

## Risco

Dados pessoais sem escopo obrigatorio e testes LGPD pulados podem gerar falhas de acesso, retencao ou exclusao. Segredos/env versionados podem expor dados de ambiente.

## Recomendacoes

1. Reativar testes consent/retention.
2. Criar DLP scan para fixtures, logs e seeds.
3. Classificar campos pessoais no schema.
4. Garantir `tenantId`/`organizationId` obrigatorios quando aplicavel.
5. Documentar e testar export/delete/retention.

## Testes recomendados

- consentimento grant/revoke/export
- delete user data com confirmacao
- retention sweep em banco descartavel
- log redaction para email, telefone, token, IP e documento
