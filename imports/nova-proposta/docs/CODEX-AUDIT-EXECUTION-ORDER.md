# Ordem de Execucao das 20 Auditorias

## Objetivo
Definir a sequencia correta para executar todos os itens levantados nas 20 auditorias do BirthHub360, reduzindo risco de regressao, protegendo dados primeiro e evitando retrabalho.

## Principios de Prioridade
1. Primeiro corrigir o que protege cliente, dados e receita.
2. Depois corrigir o que cria base para validar o restante.
3. Em seguida atacar itens estruturais que afetam varias areas ao mesmo tempo.
4. Por ultimo fazer limpeza, padronizacao visual e documentacao.

## Ordem Mestra de Execucao
1. `15` Variaveis de Ambiente sem Validacao
2. `10` Observabilidade - APM e Monitoramento
3. `09` Trilhas de Auditoria e Logging Estruturado
4. `20` Tratamento de Erros - Catch Vazio e Falhas Silenciosas
5. `11` Cobertura de Testes Insuficiente
6. `01` Multi-tenancy - Isolamento de Tenant
7. `02` Segredos Hardcoded no Codigo-Fonte
8. `08` Conformidade LGPD
9. `18` Vazamento de IA - Prompt Injection e Sanitizacao
10. `19` Modelagem de Dados - Schemas e Relacoes
11. `05` Metering - Uso e Consumo por Tenant
12. `04` Billing e Gateway de Pagamento
13. `06` Integracao CRM
14. `03` Operacoes Bloqueantes - Sync I/O
15. `07` Acoplamento - Arquivos Gigantes
16. `13` TODOs e FIXMEs
17. `14` console.log em Producao
18. `16` URLs e Endpoints Hardcoded
19. `12` Design System - Tokens e Variaveis CSS
20. `17` Documentacao e Onboarding

## Ordem por Fase

### Fase 1 - Base de seguranca operacional
Executar: `15 -> 10 -> 09 -> 20 -> 11`

Motivo:
- sem validacao de ambiente, qualquer deploy pode quebrar silenciosamente
- sem observabilidade e logging, fica perigoso mexer nas camadas criticas
- sem tratamento de erro, os testes e a telemetria nao mostram a causa real
- sem baseline minima de testes, correcoes em cascata ficam inseguras

Saida esperada:
- bootstrap falha rapido quando faltar ENV critica
- `/health`, metricas e telemetria ativas
- logger estruturado com `tenantId`, `userId`, `requestId`
- filtros globais de erro ativos
- suite minima de regressao pronta para rodar a cada bloco

### Fase 2 - Blindagem de dados e fronteiras de acesso
Executar: `01 -> 02 -> 08 -> 18`

Motivo:
- multi-tenancy e o risco mais grave de vazamento entre clientes
- secrets expostos ampliam impacto de qualquer falha
- LGPD depende de isolamento, trilha e tratamento correto de dados
- fluxos de IA podem vazar contexto sensivel se entrarem antes das protecoes

Saida esperada:
- toda query critica com escopo de tenant
- secrets removidos do codigo e rotacionados
- consentimento, exportacao e exclusao mapeados
- sanitizacao, rate limit e tracking em chamadas de IA

### Fase 3 - Nucleo de monetizacao e integracoes
Executar: `19 -> 05 -> 04 -> 06`

Motivo:
- schema e contratos de dados precisam estabilizar antes de billing e CRM
- metering vem antes de billing porque precificacao e bloqueio dependem dele
- billing vem antes de CRM para garantir base de monetizacao e plano ativo
- CRM entra depois com contratos de integracao mais estaveis

Saida esperada:
- schema consistente com tenant, indices e soft delete
- uso de IA/recursos registrado por tenant
- billing com plano, webhook e guard de acesso
- CRM com conexao por tenant, webhook e sync confiavel

### Fase 4 - Performance, manutencao e simplificacao
Executar: `03 -> 07 -> 13 -> 14 -> 16`

Motivo:
- I/O sync e gargalo tecnico imediato
- depois vale quebrar arquivos gigantes ja com testes e logs protegendo
- TODOs, console e URLs hardcoded devem ser limpos apos refactors principais

Saida esperada:
- caminhos quentes sem operacoes bloqueantes
- modulos grandes fatiados por responsabilidade
- TODOs/FIXMEs remanescentes reduzidos ao minimo e rastreaveis
- logs de debug removidos
- endpoints e origins vindos de configuracao

### Fase 5 - Consistencia de produto e governanca
Executar: `12 -> 17`

Motivo:
- design system e documentacao devem refletir a arquitetura ja estabilizada
- fazer isso antes gera retrabalho visual e de onboarding

Saida esperada:
- tokens globais de design aplicados
- README, ADRs e guias alinhados com a implementacao final

## Ordem Interna Dentro de Cada Auditoria

### `15` ENV Vars
1. Criar schema central de ENV.
2. Fazer bootstrap falhar rapido para variaveis obrigatorias.
3. Mapear todas as `process.env.*` sem fallback.
4. Atualizar `.env.example`.
5. Criar teste de carga de configuracao.

### `10` Observabilidade
1. Garantir `/health` e readiness.
2. Inicializar Sentry/APM no bootstrap.
3. Expor metricas de latencia e erro.
4. Documentar `SENTRY_DSN` e correlatas.
5. Validar alarmes e sinais minimos.

### `09` Audit Trail
1. Padronizar logger estruturado.
2. Injetar contexto de request, tenant e usuario.
3. Garantir `AuditLog` nas operacoes sensiveis.
4. Remover logs sem contexto.
5. Cobrir com testes de logging/auditoria.

### `20` Error Handling
1. Registrar filter global.
2. Tratar `unhandledRejection` e `uncaughtException`.
3. Eliminar catches vazios.
4. Padronizar erros de dominio.
5. Garantir que stack trace nao vaze para resposta publica.

### `11` Tests
1. Criar smoke tests para multitenancy, auth, billing, IA e CRM.
2. Cobrir modulos sem teste: `metering` e `crm`.
3. Adicionar onboarding/invite/signup e2e.
4. Definir threshold minimo.
5. Integrar a suite nos gates de CI.

### `01` Multi-tenancy
1. Definir fonte unica de tenant no request context.
2. Fechar queries Prisma sem filtro.
3. Ajustar services/repositories mais criticos.
4. Revisar models sem chave de tenant onde fizer sentido.
5. Adicionar testes de isolamento cruzado.

### `02` Secrets
1. Remover segredos hardcoded atuais.
2. Rotacionar credenciais comprometidas.
3. Garantir `.env` ignorado e exemplos seguros.
4. Revisar historico git e plano de purge se necessario.
5. Adicionar scanner preventivo no CI.

### `08` LGPD
1. Mapear dados PII e dados sensiveis.
2. Garantir base de consentimento.
3. Implementar exportacao de dados.
4. Implementar exclusao/anomimizacao.
5. Cobrir trilha e retencao.

### `18` AI Leak
1. Inserir sanitizacao antes de toda chamada LLM.
2. Bloquear concatenacao direta de input do usuario em prompt de sistema.
3. Adicionar rate limit por tenant.
4. Registrar tokens e uso.
5. Criar testes de prompt injection.

### `19` Data Models
1. Ajustar models criticos ausentes/incompletos.
2. Garantir tenant nas entidades multi-tenant.
3. Garantir indices dos fluxos mais consultados.
4. Adicionar `deletedAt` onde o dominio pede soft delete.
5. Revisar seed/migracao.

### `05` Metering
1. Definir contrato de `UsageRecord`/quota.
2. Registrar uso em toda chamada de IA e recursos cobraveis.
3. Expor dashboard de consumo.
4. Criar reset periodico de quota.
5. Bloquear quando exceder limite.

### `04` Billing
1. Consolidar models e estados de plano.
2. Criar ou fechar guard de plano ativo.
3. Garantir webhook de pagamento.
4. Expor portal/checkout.
5. Testar cobranca, falha e reconciliacao.

### `06` CRM
1. Definir conexao por tenant.
2. Criar receiver de webhook.
3. Implementar sync de contatos/companies/deals.
4. Registrar cursor/eventos de sincronizacao.
5. Testar retry, deduplicacao e conflito.

### `03` Sync I/O
1. Atacar primeiro caminhos quentes e runtime de API/worker.
2. Trocar APIs `*Sync` por async.
3. Eliminar `require(json)` em runtime critico.
4. Revisar scripts Python de request bloqueante.
5. Medir ganho e regressao.

### `07` Coupling
1. Priorizar arquivos com risco de negocio e mais de 400 linhas.
2. Separar controller, service, repository, schema e util.
3. Remover logica de negocio da camada HTTP.
4. Resolver dependencias circulares.
5. Consolidar testes dos modulos quebrados.

### `13` TODO/FIXME
1. Resolver `FIXME` e `HACK` em auth, billing e IA.
2. Converter TODOs validos em backlog rastreavel.
3. Remover comentarios obsoletos.
4. Ativar regra de lint preventiva.

### `14` console.log
1. Remover logs com dado sensivel.
2. Trocar logs tecnicos por logger estruturado.
3. Ativar `no-console`.

### `16` Hardcoded URLs
1. Remover localhost em codigo de producao.
2. Subir origins e endpoints para ENV/config.
3. Revisar CORS e IPs fixos.

### `12` Design System
1. Criar tokens globais.
2. Migrar cores/fontes hardcoded.
3. Remover inline styles literais.
4. Consolidar extensoes do Tailwind ou tema global.

### `17` Documentation
1. Atualizar README com setup, stack, deploy e testes.
2. Documentar ENV critica.
3. Registrar ADRs das decisoes feitas nas fases 1 a 4.
4. Atualizar CONTRIBUTING e playbooks.

## Dependencias Criticas Entre Auditorias
- `15` desbloqueia `10`, `04`, `05`, `06`, `18`
- `09` e `20` desbloqueiam investigacao segura de `01`, `08`, `18`
- `11` protege refactors de `01`, `03`, `07`, `19`
- `19` vem antes de `05`, `04`, `06`
- `05` vem antes de `04`
- `01` e `08` precisam estar estabilizadas antes de expandir `06`
- `12` e `17` ficam por ultimo para refletir o estado final

## Regra de Execucao por Sprint
Para cada auditoria, repetir sempre esta micro-ordem:
1. Corrigir fundacao compartilhada.
2. Corrigir itens criticos e de maior blast radius.
3. Corrigir ocorrencias repetidas com automacao segura.
4. Atualizar testes.
5. Atualizar observabilidade e logs.
6. Atualizar documentacao local da mudanca.

## Sequencia Recomendada de Entrega
1. Sprint 1: `15, 10, 09, 20, 11`
2. Sprint 2: `01, 02`
3. Sprint 3: `08, 18`
4. Sprint 4: `19, 05`
5. Sprint 5: `04, 06`
6. Sprint 6: `03, 07`
7. Sprint 7: `13, 14, 16`
8. Sprint 8: `12, 17`

## Resultado Esperado
Se essa ordem for seguida, o projeto reduz primeiro risco de vazamento, depois estabiliza monetizacao e integracoes, e so entao limpa o restante. Isso minimiza retrabalho e evita corrigir sintomas antes de fechar as causas estruturais.
