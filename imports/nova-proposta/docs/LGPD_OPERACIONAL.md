# LGPD Operacional

Status operacional atual em 2026-04-13:

- Ativo e suportado:
- exportar dados por tenant
- anonimizar/excluir conta via fluxo self-service
- Desabilitado nesta implantacao:
- consentimentos granulares por finalidade
- politicas de retencao configuraveis
- execucao manual ou agendada de retention sweep avancado

Referência de serviço: módulos de privacy em `apps/api/src/modules/privacy`.
Fonte operacional de capabilities ativas: `docs/operations/active-product-capabilities.md`.

Observacao:

- O produto ativo nao deve presumir consentimentos auditaveis nem retention orchestration enquanto `BIRTHUB_ENABLE_PRIVACY_ADVANCED` e `NEXT_PUBLIC_ENABLE_PRIVACY_ADVANCED` permanecerem `false`.
