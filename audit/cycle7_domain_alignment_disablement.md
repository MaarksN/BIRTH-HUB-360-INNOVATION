# Cycle 7 Domain Alignment Disablement

Date: 2026-04-12

## Objective

Eliminar o estado hibrido em que partes do produto ainda presumiam dominio clinico, fachada FHIR e privacidade avancada sem sustentacao consistente no schema Prisma e nos fluxos ativos.

## Flags introduzidas

- `BIRTHUB_ENABLE_CLINICAL_WORKSPACE=false`
- `BIRTHUB_ENABLE_FHIR_FACADE=false`
- `BIRTHUB_ENABLE_PRIVACY_ADVANCED=false`
- `BIRTHUB_ENABLE_PRIVACY_SELF_SERVICE=true`
- `NEXT_PUBLIC_ENABLE_CLINICAL_WORKSPACE=false`
- `NEXT_PUBLIC_ENABLE_FHIR_FACADE=false`
- `NEXT_PUBLIC_ENABLE_PRIVACY_ADVANCED=false`
- `NEXT_PUBLIC_ENABLE_PRIVACY_SELF_SERVICE=true`

## Classificacao consolidada

### Ativo e suportado

- API `privacy/export` e `privacy/delete-account`
- Web `settings/privacy` em modo self-service
- Dashboard operacional, workflows, billing, analytics, notificacoes e Sales OS
- Cookie consent, footer legal e navegação para privacidade self-service

### Ativo mas inconsistente antes deste ciclo, agora explicitamente desabilitado

- API `GET /api/v1/dashboard/clinical-summary`
- API `GET/PUT /api/v1/privacy/consents`
- API `GET/PUT /api/v1/privacy/retention`
- API `POST /api/v1/privacy/retention/run`
- Scheduler de retention bootstrap em `apps/api/src/app/core.ts`
- Dashboard home: callout de consentimento avancado e grade clinica
- Web `/patients`
- Web `/patients/[id]`
- Web `/patients/[id]/appointments`
- Web `/appointments`
- BFF para paths avancados de privacidade
- Navbar com entradas clinicas

### Orfao

- Router/module `clinical` da API existe, mas nao e montado na app principal
- Router/module `fhir` da API existe, mas nao e montado na app principal
- Os routers standalone de `clinical` e `fhir` agora tambem devolvem `404` por padrao quando chamados fora de uma reintroducao explicita por flag
- Services e testes unitarios de dominio clinico/FHIR/privacidade avancada foram mantidos como base de futura reintroducao, mas deixaram de representar superficie ativa do produto

### Deve continuar desabilitado ate reintroducao formal

- Workspace clinico end-to-end
- Fachada FHIR publica
- Consentimentos auditaveis por finalidade
- Politicas de retencao e execucao manual/dry-run

## O que foi desabilitado agora

- Flags centrais de capacidade no pacote `@birthub/config`
- Short-circuit 404 explicito para superficies avancadas de privacy e resumo clinico
- Bootstrap do retention scheduler condicionado a `privacyAdvancedEnabled`
- Navbar sem `Patients` e `Appointments` quando o workspace clinico esta desligado
- Dashboard sem fetch/render de superficie clinica e de consentimento avancado
- Pagina de privacidade trocada para modo self-service
- Rota ativa de privacidade agora carrega a UI avancada apenas quando a flag correspondente e explicitamente reabilitada
- Helpers e secoes da experiencia self-service de privacidade foram separados do modulo avancado para que exportacao e exclusao nao dependam mais, nem indiretamente, de consentimentos/retencao
- Rotas clinicas do web agora exibem estado desativado em vez de tentar operar API inexistente
- Wrappers das rotas clinicas do web agora importam a implementacao `*.client` apenas quando o workspace clinico esta explicitamente habilitado
- Feed de notificacoes agora neutraliza links clinicos quando o workspace esta desligado
- BFF agora aceita apenas `privacy/export` e `privacy/delete-account` por default
- Documentacao operacional viva de LGPD/delecao foi alinhada para explicitar que apenas o fluxo self-service permanece ativo nesta implantacao
- Testes HTTP/web atualizados para refletir disablement em vez de feature ativa
- Routers standalone de clinical e FHIR blindados para negar trafego por default, mesmo fora da app principal
- Testes unitarios de clinical, FHIR e privacy advanced ficaram explicitamente em `skip` enquanto esses dominios permanecerem fora do produto ativo

## O que permaneceu ativo

- Exportacao de dados do tenant
- Solicitacao de exclusao de conta com anonimizacao
- Jornada de consentimento de cookies pelo store de preferencias
- Footer e banner apontando para a tela de privacidade self-service
- Operacao principal do produto fora do dominio clinico

## Reintroducao futura exige

- Modelos Prisma consistentes para:
- `Patient`
- `Appointment`
- `PregnancyRecord`
- `NeonatalRecord`
- `ClinicalNote`
- `PrivacyConsent`
- `PrivacyConsentEvent`
- `DataRetentionPolicy`
- `DataRetentionExecution`
- Montagem explicita dos routers clinico/FHIR na app principal
- Reabertura controlada das flags de capacidade em API e web
- Reativacao do BFF para paths avancados de privacidade
- Restauracao da navegacao clinica e do dashboard clinico somente depois de validar schema, runtime, seeds e testes end-to-end
