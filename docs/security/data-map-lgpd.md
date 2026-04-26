# LGPD Data Map

## Escopo

Mapa operacional para dados pessoais tratados pelo BirthHub 360 no monorepo.

| Categoria | Exemplos | Locais de codigo | Retencao | Redaction |
| --- | --- | --- | --- | --- |
| Identidade de usuario | nome, email, role, membership | `packages/database/prisma/schema.prisma`, `packages/auth` | enquanto conta ativa + politica de retenção | sim |
| Tenant/organizacao | `tenantId`, `organizationId`, membership | `apps/api`, `packages/database` | enquanto contrato ativo | sim para logs |
| Dados comerciais | leads, contratos, invoices, CRM sync | `packages/shared-types`, `apps/api/src/modules/connectors` | conforme contrato e obrigacao legal | parcial |
| Dados clinicos/maternos | paciente, gestacao, consulta, prontuario | `apps/api/src/modules/clinical`, `apps/api/src/modules/fhir` | conforme obrigacao legal e base aplicavel | sim |
| Credenciais/tokens | sessionToken, apiKey, webhookSecret, provider tokens | `packages/database`, `packages/logger`, `packages/security` | minima necessaria | obrigatoria |
| Auditoria | actor, action, resource, metadata, IP | `AuditLog` no Prisma | conforme politica de auditoria | sim para PII |

## Controles versionados

- Redaction central em `packages/logger`.
- Retencao documentada em `docs/security/pii-retention.md`.
- Consentimento e bases no schema Prisma.
- Testes de hardening em `tests/integration/test_security_hardening.py`.

## Pendencias operacionais

- Confirmar prazos reais por cliente/contrato.
- Exportar evidencias de DSR de ambiente produtivo.
- Validar fixtures e snapshots antes de cada release.
