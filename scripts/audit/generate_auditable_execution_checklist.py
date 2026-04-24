from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DOCS_OUTPUT = ROOT / "docs" / "CODEX-AUDIT-EXECUTION-CHECKLIST.html"
DESKTOP_OUTPUT = Path.home() / "Desktop" / "20 DIVIDAS TECNICAS" / "CODEX-AUDIT-EXECUTION-CHECKLIST.html"
REPO_PATH = str(ROOT).replace("\\", "/")
DESKTOP_DIR_URI = "file:///C:/Users/Marks/Desktop/20%20DIVIDAS%20TECNICAS"


AUDITS = [
    {
        "code": "15",
        "title": "Variaveis de Ambiente sem Validacao",
        "severity": "BAIXO",
        "phase": "Fase 1 - Base de seguranca operacional",
        "cycle": "Ciclo 1",
        "findings": 91,
        "objective": "Estabilizar a configuracao para impedir erro silencioso, drift de ambiente e deploy quebrado por ENV ausente.",
        "steps": [
            "Criar schema central de ENV e encapsular acessos diretos.",
            "Fazer bootstrap falhar rapido para variaveis obrigatorias.",
            "Mapear process.env sem fallback e migrar para config validada.",
            "Atualizar .env.example e exemplos de operacao.",
            "Cobrir carregamento de configuracao com teste automatico.",
        ],
        "expected": [
            "Aplicacao falha com mensagem clara quando ENV critica faltar.",
            "Acessos a process.env ficam centralizados e rastreaveis.",
            ".env.example cobre as variaveis obrigatorias.",
        ],
        "validation": [
            "cmd /c corepack pnpm lint",
            "cmd /c corepack pnpm test",
            "Reexecutar a auditoria 15 e reduzir as 91 ocorrencias.",
        ],
        "error_handling": [
            "Se o bootstrap quebrar em todos os ambientes, restaurar defaults seguros no config loader antes de seguir.",
            "Se uma ENV critica nao existir em producao, bloquear deploy e registrar a necessidade no runbook.",
            "Se o schema invalidar valores existentes, criar camada temporaria de compatibilidade com alerta.",
        ],
        "depends_on": [],
    },
    {
        "code": "10",
        "title": "Observabilidade - APM e Monitoramento",
        "severity": "MEDIO",
        "phase": "Fase 1 - Base de seguranca operacional",
        "cycle": "Ciclo 1",
        "findings": 0,
        "objective": "Consolidar e travar a base de health, metricas e telemetria para sustentar as correcoes seguintes.",
        "steps": [
            "Validar /health, readiness e dependencia critica.",
            "Confirmar inicializacao de Sentry/APM e metricas no bootstrap.",
            "Checar latencia, error rate e sinais minimos de alerta.",
            "Documentar SENTRY_DSN e variaveis relacionadas.",
            "Adicionar guardrails para nao perder observabilidade em refactors futuros.",
        ],
        "expected": [
            "Health check e metricas respondem de forma consistente.",
            "Falhas importantes aparecem no APM/log sem depender de incidente manual.",
            "A auditoria continua zerada apos novas entregas.",
        ],
        "validation": [
            "Validar /health e readiness no ambiente local/staging.",
            "Confirmar inicializacao de metricas e APM no bootstrap.",
            "Reexecutar a auditoria 10 e manter 0 achados.",
        ],
        "error_handling": [
            "Se health indicar degradacao, pausar refactor e estabilizar dependencia antes de seguir.",
            "Se o APM gerar ruido alto, ajustar sampling/filters antes do rollout.",
            "Se a instrumentacao impactar latencia, isolar o caminho critico e medir novamente.",
        ],
        "depends_on": ["15"],
    },
    {
        "code": "09",
        "title": "Trilhas de Auditoria e Logging Estruturado",
        "severity": "MEDIO",
        "phase": "Fase 1 - Base de seguranca operacional",
        "cycle": "Ciclo 1",
        "findings": 191,
        "objective": "Garantir logs estruturados com contexto de tenant e usuario, e fechar lacunas de trilha auditavel.",
        "steps": [
            "Padronizar logger estruturado e contexto de request.",
            "Propagar tenantId, userId, requestId e correlationId.",
            "Garantir AuditLog nos fluxos sensiveis.",
            "Remover logs sem contexto e normalizar eventos.",
            "Adicionar testes de auditoria e logging.",
        ],
        "expected": [
            "Logs de dominio e seguranca trazem tenantId e userId.",
            "Mudancas sensiveis geram trilha auditavel.",
            "As 191 ocorrencias caem fortemente apos a consolidacao.",
        ],
        "validation": [
            "cmd /c corepack pnpm test",
            "Validar logs de request, auth, billing e IA.",
            "Reexecutar a auditoria 09 e comparar contagem.",
        ],
        "error_handling": [
            "Se o volume de log explodir, reduzir nivel e amostragem antes de seguir.",
            "Se faltarem campos de contexto, corrigir middleware/request context antes de mudar services.",
            "Se um AuditLog quebrar fluxo transacional, mover persistencia para estrategia segura de fallback.",
        ],
        "depends_on": ["15", "10"],
    },
    {
        "code": "20",
        "title": "Tratamento de Erros - Catch Vazio e Falhas Silenciosas",
        "severity": "MEDIO",
        "phase": "Fase 1 - Base de seguranca operacional",
        "cycle": "Ciclo 1",
        "findings": 9,
        "objective": "Eliminar falhas silenciosas e criar uma superficie previsivel de erro para API, workers e jobs.",
        "steps": [
            "Registrar filtro global de excecao.",
            "Tratar unhandledRejection e uncaughtException.",
            "Eliminar catches vazios e comentarios sem acao.",
            "Padronizar erros de dominio e resposta publica.",
            "Impedir vazamento de stack trace para cliente.",
        ],
        "expected": [
            "Excecoes sao capturadas, logadas e respondidas de forma consistente.",
            "Nao existem catches vazios em caminhos de producao.",
            "Erros criticos de processo geram shutdown ou alerta controlado.",
        ],
        "validation": [
            "cmd /c corepack pnpm test",
            "Testar respostas de erro e falhas de job deliberadas.",
            "Reexecutar a auditoria 20 e reduzir os 9 achados.",
        ],
        "error_handling": [
            "Se o filtro global mudar contrato de resposta, alinhar testes/consumidores antes do merge.",
            "Se um catch tiver efeito colateral importante, substituir por fallback explicito e logado.",
            "Se erros de processo derrubarem a app localmente, validar estrategia de restart antes de promover.",
        ],
        "depends_on": ["09", "10"],
    },
    {
        "code": "11",
        "title": "Cobertura de Testes Insuficiente",
        "severity": "MEDIO",
        "phase": "Fase 1 - Base de seguranca operacional",
        "cycle": "Ciclo 1",
        "findings": 4,
        "objective": "Criar baseline de seguranca para refactors nas auditorias criticas e estabelecer validacao automatica continua.",
        "steps": [
            "Criar smoke tests para multitenancy, auth, billing, IA e CRM.",
            "Cobrir modulos sem teste: metering e crm.",
            "Adicionar onboarding, invite e signup em e2e.",
            "Definir threshold minimo e coleta de cobertura.",
            "Integrar a suite ao gate de CI.",
        ],
        "expected": [
            "Fluxos criticos tem regressao minima automatizada.",
            "Metering e CRM deixam de ser zonas cegas.",
            "A cobertura vira criterio de entrega, nao so observacao.",
        ],
        "validation": [
            "cmd /c corepack pnpm test",
            "cmd /c corepack pnpm test:e2e",
            "Rodar cobertura e validar threshold definido.",
        ],
        "error_handling": [
            "Se cobertura completa ficar pesada demais, criar suite tier-1 obrigatoria e suite tier-2 assicrona.",
            "Se e2e ficar instavel, isolar dependencias externas com fixtures/mocks controlados.",
            "Se a coleta de coverage nao sair no runner atual, registrar a lacuna e tratar no proprio CI script.",
        ],
        "depends_on": ["15", "10", "09", "20"],
    },
    {
        "code": "01",
        "title": "Multi-tenancy - Isolamento de Tenant",
        "severity": "CRITICO",
        "phase": "Fase 2 - Blindagem de dados e fronteiras de acesso",
        "cycle": "Ciclo 2",
        "findings": 67,
        "objective": "Fechar o maior risco de vazamento entre clientes e garantir isolamento por tenant em query, cache e contexto de request.",
        "steps": [
            "Definir uma fonte unica de tenant no request context.",
            "Fechar queries Prisma sem filtro explicito de tenant.",
            "Revisar repositories e services mais criticos primeiro.",
            "Ajustar models multi-tenant quando faltarem chaves de escopo.",
            "Adicionar testes de isolamento cruzado.",
        ],
        "expected": [
            "Toda query critica traz tenantId ou organizationId de forma explicita.",
            "Nao existe leitura cruzada entre tenants em API, worker ou cache.",
            "A contagem de 67 achados cai prioritariamente nos caminhos de maior risco.",
        ],
        "validation": [
            "cmd /c corepack pnpm test:isolation",
            "cmd /c corepack pnpm test",
            "Reexecutar a auditoria 01 e comparar o delta de ocorrencias.",
        ],
        "error_handling": [
            "Se uma query nao puder receber tenant sem quebrar contrato, parar e redesenhar o boundary antes de seguir.",
            "Se houver divergencia entre tenantId e organizationId, corrigir a modelagem e o request context antes do hotfix em massa.",
            "Se teste de isolamento falhar, bloquear merge e tratar como incidente de seguranca.",
        ],
        "depends_on": ["09", "20", "11"],
    },
    {
        "code": "02",
        "title": "Segredos Hardcoded no Codigo-Fonte",
        "severity": "CRITICO",
        "phase": "Fase 2 - Blindagem de dados e fronteiras de acesso",
        "cycle": "Ciclo 2",
        "findings": 2,
        "objective": "Eliminar segredos do codigo e tratar exposicao historica para reduzir risco de comprometimento e acesso indevido.",
        "steps": [
            "Remover segredos hardcoded atuais.",
            "Rotacionar credenciais que possam ter sido expostas.",
            "Garantir .env ignorado e exemplos seguros.",
            "Revisar historico git e definir purge se necessario.",
            "Ativar scanner preventivo no CI.",
        ],
        "expected": [
            "Codigo-fonte nao carrega segredo literal.",
            "Credenciais sensiveis sao rotacionadas e rastreadas.",
            "Scanner de credenciais passa a bloquear regressao.",
        ],
        "validation": [
            "cmd /c corepack pnpm security:inline-credentials",
            "Revisar historico git para strings comprometidas.",
            "Reexecutar a auditoria 02 e zerar os achados correntes.",
        ],
        "error_handling": [
            "Se uma credencial estiver em uso ativo, rotacionar primeiro e so depois remover do codigo.",
            "Se o purge do historico for arriscado para a equipe, abrir plano controlado de remediacao e rotacao imediata.",
            "Se scanner gerar falso positivo, ajustar regra com justificativa versionada.",
        ],
        "depends_on": ["15", "09"],
    },
    {
        "code": "08",
        "title": "Conformidade LGPD",
        "severity": "ALTO",
        "phase": "Fase 2 - Blindagem de dados e fronteiras de acesso",
        "cycle": "Ciclo 3",
        "findings": 43,
        "objective": "Fechar lacunas de consentimento, exportacao, exclusao e protecao de dados sensiveis, especialmente no dominio clinico.",
        "steps": [
            "Mapear PII e dados sensiveis por model e fluxo.",
            "Garantir base de consentimento e privacidade.",
            "Implementar exportacao de dados.",
            "Implementar exclusao e anonimzacao conforme politica.",
            "Cobrir retencao e trilha de operacoes LGPD.",
        ],
        "expected": [
            "Fluxos de exportacao e exclusao existem e sao auditaveis.",
            "Dados sensiveis tem tratamento reforcado.",
            "A contagem de 43 achados cai com foco em maior risco legal.",
        ],
        "validation": [
            "cmd /c corepack pnpm privacy:verify",
            "cmd /c corepack pnpm test",
            "Reexecutar a auditoria 08 e revisar os deltas.",
        ],
        "error_handling": [
            "Se anonimzacao afetar relatorios historicos, separar camada operacional de camada analitica antes de apagar dados.",
            "Se exclusao de conta quebrar integridade referencial, introduzir soft delete ou tombstone controlado.",
            "Se o dominio clinico exigir regra especial, documentar e isolar tratamento por modulo.",
        ],
        "depends_on": ["01", "09", "20"],
    },
    {
        "code": "18",
        "title": "Vazamento de IA - Prompt Injection e Sanitizacao",
        "severity": "ALTO",
        "phase": "Fase 2 - Blindagem de dados e fronteiras de acesso",
        "cycle": "Ciclo 3",
        "findings": 16,
        "objective": "Blindar chamadas LLM contra prompt injection, concatenacao insegura de input e falta de trilha de uso.",
        "steps": [
            "Inserir sanitizacao antes de toda chamada LLM.",
            "Bloquear concatenacao direta de input do usuario em prompt de sistema.",
            "Adicionar rate limit por tenant.",
            "Registrar tokens e uso em toda chamada.",
            "Criar testes de prompt injection e abuso.",
        ],
        "expected": [
            "Chamadas LLM passam por sanitize/guardrail antes do envio.",
            "Nao ha system prompt montado com input cru do usuario.",
            "Todos os fluxos de IA geram log e metering minimo.",
        ],
        "validation": [
            "cmd /c corepack pnpm test:security",
            "cmd /c corepack pnpm test",
            "Reexecutar a auditoria 18 e reduzir os 16 achados.",
        ],
        "error_handling": [
            "Se um guardrail bloquear prompts legitimos, reduzir falsos positivos com allowlist auditada.",
            "Se a sanitizacao alterar demais a experiencia, separar higienizacao de texto de bloqueio de instrucoes hostis.",
            "Se o rate limit impactar clientes legitimos, adicionar janelas por plano/tenant.",
        ],
        "depends_on": ["01", "09", "15"],
    },
    {
        "code": "19",
        "title": "Modelagem de Dados - Schemas e Relacoes",
        "severity": "MEDIO",
        "phase": "Fase 3 - Nucleo de monetizacao e integracoes",
        "cycle": "Ciclo 4",
        "findings": 10,
        "objective": "Estabilizar o schema para suportar billing, metering, CRM e politicas de retencao sem remendo estrutural.",
        "steps": [
            "Ajustar models criticos ausentes ou incompletos.",
            "Garantir tenant nas entidades multi-tenant.",
            "Criar indices dos fluxos mais consultados.",
            "Adicionar deletedAt onde o dominio pede soft delete.",
            "Revisar seed e migracoes.",
        ],
        "expected": [
            "Schema Prisma fica coerente com os fluxos do produto.",
            "Indices e soft delete protegem performance e operacao.",
            "Billing, metering e CRM passam a ter base estavel.",
        ],
        "validation": [
            "cmd /c corepack pnpm db:generate",
            "cmd /c corepack pnpm db:check:drift",
            "Reexecutar a auditoria 19 e comparar os 10 achados.",
        ],
        "error_handling": [
            "Se a migracao quebrar dados existentes, criar migração expand/contract em vez de troca direta.",
            "Se indices impactarem escrita, medir plano de execucao e aplicar por lote.",
            "Se soft delete conflitar com unicidade, revisar constraints antes do rollout.",
        ],
        "depends_on": ["01", "08"],
    },
    {
        "code": "05",
        "title": "Metering - Uso e Consumo por Tenant Ausente",
        "severity": "ALTO",
        "phase": "Fase 3 - Nucleo de monetizacao e integracoes",
        "cycle": "Ciclo 4",
        "findings": 8,
        "objective": "Criar medicao de uso por tenant para IA e recursos cobraveis, habilitando quota, visibilidade e precificacao.",
        "steps": [
            "Definir contrato de UsageRecord, quota e agregados.",
            "Registrar uso em toda chamada de IA e recurso faturavel.",
            "Expor dashboard ou endpoint de consumo.",
            "Criar reset periodico de quota.",
            "Bloquear excedente de forma controlada.",
        ],
        "expected": [
            "Uso passa a ser contabilizado por tenant com trilha confiavel.",
            "Quotas e limites podem ser aplicados sem logica duplicada.",
            "As 8 lacunas viram contratos operacionais claros.",
        ],
        "validation": [
            "cmd /c corepack pnpm test",
            "Validar uso e reset de quota em cenarios de IA.",
            "Reexecutar a auditoria 05 e comparar os 8 achados.",
        ],
        "error_handling": [
            "Se o tracking criar overhead alto, desacoplar persistencia para fila/evento.",
            "Se houver discrepancia entre uso real e agregado, tratar como bug de faturamento e bloquear liberacao.",
            "Se quota excedida gerar falso bloqueio, priorizar fail-open controlado com alerta e trilha.",
        ],
        "depends_on": ["19", "09", "11"],
    },
    {
        "code": "04",
        "title": "Billing e Gateway de Pagamento",
        "severity": "ALTO",
        "phase": "Fase 3 - Nucleo de monetizacao e integracoes",
        "cycle": "Ciclo 5",
        "findings": 1,
        "objective": "Fechar o fluxo de monetizacao com guard de plano, reconciliacao e protecao de acesso premium.",
        "steps": [
            "Consolidar models e estados de plano.",
            "Criar ou fechar guard de plano ativo.",
            "Garantir webhook de pagamento e reconciliacao.",
            "Expor portal ou checkout de faturamento.",
            "Testar cobranca, falha, upgrade e downgrade.",
        ],
        "expected": [
            "Rotas premium respeitam plano ativo.",
            "Webhook atualiza estado financeiro sem ambiguidade.",
            "Billing deixa de depender de operacao manual.",
        ],
        "validation": [
            "cmd /c corepack pnpm test:billing:coverage",
            "cmd /c corepack pnpm test",
            "Reexecutar a auditoria 04 e zerar a lacuna principal.",
        ],
        "error_handling": [
            "Se webhook falhar, manter reconciliacao idempotente e fila de retry.",
            "Se guard bloquear tenant pago por atraso de sync, adicionar janela de tolerancia controlada.",
            "Se checkout/portal depender de secret faltante, voltar para a auditoria 15 antes de prosseguir.",
        ],
        "depends_on": ["19", "05", "15"],
    },
    {
        "code": "06",
        "title": "Integracao CRM",
        "severity": "ALTO",
        "phase": "Fase 3 - Nucleo de monetizacao e integracoes",
        "cycle": "Ciclo 5",
        "findings": 1,
        "objective": "Estruturar conexao por tenant, webhook e sync confiavel com CRM para fechar o RevOps OS.",
        "steps": [
            "Definir conexao e credencial por tenant.",
            "Criar receiver de webhook de CRM.",
            "Implementar sync de contatos, companies e deals.",
            "Registrar cursor, eventos e retries.",
            "Testar deduplicacao, conflito e reconciliação.",
        ],
        "expected": [
            "Conexao com CRM fica desacoplada por tenant.",
            "Eventos externos sao recebidos e processados com idempotencia.",
            "Sync bidirecional minimo deixa de ser lacuna arquitetural.",
        ],
        "validation": [
            "cmd /c corepack pnpm test",
            "Executar testes especificos de sync criados para o modulo.",
            "Reexecutar a auditoria 06 e zerar a lacuna principal.",
        ],
        "error_handling": [
            "Se o provider limitar webhook, criar polling ou cursor de compensacao.",
            "Se houver conflito de dados, definir fonte da verdade por campo antes de sincronizar em massa.",
            "Se retries gerarem duplicata, adicionar idempotency key por evento.",
        ],
        "depends_on": ["19", "01", "08"],
    },
    {
        "code": "03",
        "title": "Operacoes Bloqueantes - Sync I/O",
        "severity": "ALTO",
        "phase": "Fase 4 - Performance, manutencao e simplificacao",
        "cycle": "Ciclo 6",
        "findings": 298,
        "objective": "Reduzir gargalos de event loop e throughput degradado removendo I/O sincrono dos caminhos relevantes.",
        "steps": [
            "Priorizar caminhos quentes de API e worker.",
            "Trocar APIs Sync por alternativas async.",
            "Eliminar require(json) em runtime critico.",
            "Revisar requests Python bloqueantes.",
            "Medir regressao e ganho de throughput.",
        ],
        "expected": [
            "Caminhos sensiveis deixam de bloquear event loop.",
            "Scripts/processos criticos usam leitura async ou preloading controlado.",
            "As 298 ocorrencias comecam a cair pelos hotspots, nao por limpeza aleatoria.",
        ],
        "validation": [
            "cmd /c corepack pnpm test",
            "Medir latencia dos endpoints/processos alterados.",
            "Reexecutar a auditoria 03 e comparar a contagem.",
        ],
        "error_handling": [
            "Se a troca para async aumentar complexidade demais, encapsular adaptador antes de espalhar mudanca.",
            "Se um script operacional depender de sync por simplicidade, isolar fora do caminho de producao.",
            "Se a troca alterar ordem de execucao, adicionar testes de concorrencia e integridade.",
        ],
        "depends_on": ["11", "09", "20"],
    },
    {
        "code": "07",
        "title": "Acoplamento - Arquivos Gigantes",
        "severity": "ALTO",
        "phase": "Fase 4 - Performance, manutencao e simplificacao",
        "cycle": "Ciclo 6",
        "findings": 107,
        "objective": "Quebrar hotspots de complexidade para reduzir risco de regressao e facilitar evolucao dos modulos centrais.",
        "steps": [
            "Priorizar arquivos >400 linhas com risco de negocio.",
            "Separar controller, service, repository, schema e util.",
            "Remover logica de negocio da camada HTTP.",
            "Resolver dependencias circulares.",
            "Consolidar testes do modulo fatiado.",
        ],
        "expected": [
            "Arquivos grandes deixam de concentrar multiplas responsabilidades.",
            "Controllers passam a orquestrar em vez de implementar regra.",
            "Os 107 achados caem por refator seguro e testado.",
        ],
        "validation": [
            "cmd /c corepack pnpm lint",
            "cmd /c corepack pnpm test",
            "Reexecutar a auditoria 07 e comparar a contagem.",
        ],
        "error_handling": [
            "Se o refactor quebrar imports em cascata, reduzir o escopo e extrair por camada.",
            "Se surgir ciclo novo, parar e redesenhar o boundary antes de seguir.",
            "Se o arquivo grande estiver em dominio critico sem teste, voltar para auditoria 11 localmente nesse modulo.",
        ],
        "depends_on": ["11", "03"],
    },
    {
        "code": "13",
        "title": "TODOs e FIXMEs",
        "severity": "MEDIO",
        "phase": "Fase 4 - Performance, manutencao e simplificacao",
        "cycle": "Ciclo 7",
        "findings": 99,
        "objective": "Reduzir divida explicita em codigo de producao, principalmente HACK/FIXME em areas sensiveis.",
        "steps": [
            "Resolver FIXME e HACK em auth, billing e IA primeiro.",
            "Converter TODOs validos em backlog rastreavel.",
            "Remover comentarios obsoletos.",
            "Ativar regra de lint preventiva.",
            "Revalidar os modulos tocados.",
        ],
        "expected": [
            "Comentarios deixam de esconder bug conhecido em area critica.",
            "TODO valido vira backlog com dono e rastreio.",
            "O numero de 99 ocorrencias cai sem perder contexto importante.",
        ],
        "validation": [
            "cmd /c corepack pnpm lint",
            "cmd /c corepack pnpm test",
            "Reexecutar a auditoria 13 e comparar a contagem.",
        ],
        "error_handling": [
            "Se um TODO representar trabalho grande, abrir item rastreavel e deixar referencia explicita.",
            "Se um FIXME expor bug ativo, tratar antes de qualquer limpeza cosmética.",
            "Se a regra de lint bloquear legados demais, ativar em modo progressivo com allowlist curta.",
        ],
        "depends_on": ["07"],
    },
    {
        "code": "14",
        "title": "console.log em Producao",
        "severity": "BAIXO",
        "phase": "Fase 4 - Performance, manutencao e simplificacao",
        "cycle": "Ciclo 7",
        "findings": 241,
        "objective": "Eliminar logs de debug e migrar sinais relevantes para logger estruturado controlado.",
        "steps": [
            "Remover logs com dado sensivel primeiro.",
            "Trocar logs tecnicos por logger estruturado.",
            "Ativar no-console com excecoes bem justificadas.",
            "Revisar scripts que ainda precisam stdout operacional.",
            "Revalidar trilha e ruído de log.",
        ],
        "expected": [
            "Nao ha console.log em caminhos de producao sem justificativa.",
            "Sinais importantes migram para o logger padrao.",
            "As 241 ocorrencias caem sem perder observabilidade.",
        ],
        "validation": [
            "cmd /c corepack pnpm lint",
            "cmd /c corepack pnpm test",
            "Reexecutar a auditoria 14 e comparar a contagem.",
        ],
        "error_handling": [
            "Se remover um console atrapalhar suporte operacional, substituir por logger com nivel e contexto.",
            "Se um script CLI precisar stdout, documentar excecao fora do caminho de producao.",
            "Se o lint bloquear build legado, introduzir regra gradual com lista curta de excecoes.",
        ],
        "depends_on": ["09", "13"],
    },
    {
        "code": "16",
        "title": "URLs e Endpoints Hardcoded",
        "severity": "BAIXO",
        "phase": "Fase 4 - Performance, manutencao e simplificacao",
        "cycle": "Ciclo 7",
        "findings": 74,
        "objective": "Retirar endpoints e origins literais do codigo para permitir troca segura de ambiente e operacao 12-factor.",
        "steps": [
            "Remover localhost e URLs produtivas hardcoded do codigo.",
            "Subir origins e endpoints para ENV/config.",
            "Revisar CORS e IPs fixos.",
            "Centralizar builders de URL por integracao.",
            "Revalidar comportamento por ambiente.",
        ],
        "expected": [
            "Ambientes mudam via configuracao e nao por edicao de codigo.",
            "CORS fica governado por ENV segura.",
            "As 74 ocorrencias reduzem com padrao unico de configuracao.",
        ],
        "validation": [
            "cmd /c corepack pnpm test",
            "Validar CORS, origins e endpoints em local/staging.",
            "Reexecutar a auditoria 16 e comparar a contagem.",
        ],
        "error_handling": [
            "Se uma URL hardcoded estiver em fallback critico, substituir por config com default seguro e rastreavel.",
            "Se o CORS quebrar frontend existente, validar matriz de origins antes do merge.",
            "Se um IP fixo for dependencia operacional real, mover para config documentada e protegida.",
        ],
        "depends_on": ["15", "13"],
    },
    {
        "code": "12",
        "title": "Design System - Tokens e Variaveis CSS",
        "severity": "MEDIO",
        "phase": "Fase 5 - Consistencia de produto e governanca",
        "cycle": "Ciclo 8",
        "findings": 491,
        "objective": "Consolidar tokens de interface para reduzir drift visual e facilitar manutencao global de tema e componentes.",
        "steps": [
            "Criar tokens globais de cor, fonte e espacamento.",
            "Migrar cores e fontes hardcoded.",
            "Remover inline styles literais.",
            "Consolidar extensoes do Tailwind ou tema global.",
            "Validar superficies principais em desktop e mobile.",
        ],
        "expected": [
            "Tema passa a ser governado por tokens reutilizaveis.",
            "Componentes deixam de repetir cores/fontes literais.",
            "As 491 ocorrencias caem com migracao sistemica, nao manual aleatoria.",
        ],
        "validation": [
            "cmd /c corepack pnpm lint",
            "cmd /c corepack pnpm test",
            "Reexecutar a auditoria 12 e comparar a contagem.",
        ],
        "error_handling": [
            "Se a migracao visual quebrar layout, criar camada de compatibilidade de tokens antes de trocar tudo.",
            "Se houver divergencia entre apps, definir fonte canonica dos tokens primeiro.",
            "Se inline style for necessario em caso isolado, documentar a excecao e limitar escopo.",
        ],
        "depends_on": ["07", "16"],
    },
    {
        "code": "17",
        "title": "Documentacao e Onboarding",
        "severity": "BAIXO",
        "phase": "Fase 5 - Consistencia de produto e governanca",
        "cycle": "Ciclo 8",
        "findings": 0,
        "objective": "Consolidar a documentacao final depois da estabilizacao estrutural, refletindo o estado real do projeto e das decisoes.",
        "steps": [
            "Atualizar README com setup, stack, deploy e testes.",
            "Documentar ENV critica e operacao minima.",
            "Registrar ADRs das decisoes tomadas nas fases anteriores.",
            "Atualizar CONTRIBUTING, playbooks e runbooks.",
            "Congelar a auditoria 17 como guardrail de qualidade.",
        ],
        "expected": [
            "Onboarding fica alinhado com a implementacao real.",
            "Decisoes arquiteturais ficam rastreaveis.",
            "A auditoria segue em 0 achados apos as mudancas.",
        ],
        "validation": [
            "cmd /c corepack pnpm docs:verify",
            "Revisao manual de README, ADRs e CONTRIBUTING.",
            "Reexecutar a auditoria 17 e manter 0 achados.",
        ],
        "error_handling": [
            "Se a documentacao divergir do codigo, corrigir o codigo ou a doc antes de publicar.",
            "Se ADR faltar contexto, anexar o racional tecnico antes de encerrar o ciclo.",
            "Se docs:verify quebrar por link legado, atualizar referencias antes do merge.",
        ],
        "depends_on": ["12", "19", "04", "06"],
    },
]


for audit in AUDITS:
    audit["report"] = f"{DESKTOP_DIR_URI}/CODEX-AUDIT-{audit['code']}-{audit['title'].upper().replace(' ', '-').replace('/', '-')}.html"


REPORT_OVERRIDES = {
    "15": "CODEX-AUDIT-15-ENV-VARS.html",
    "10": "CODEX-AUDIT-10-OBSERVABILITY.html",
    "09": "CODEX-AUDIT-09-AUDIT-TRAIL.html",
    "20": "CODEX-AUDIT-20-ERROR-HANDLING.html",
    "11": "CODEX-AUDIT-11-TESTS.html",
    "01": "CODEX-AUDIT-01-MULTITENANCY.html",
    "02": "CODEX-AUDIT-02-SECRETS.html",
    "08": "CODEX-AUDIT-08-LGPD.html",
    "18": "CODEX-AUDIT-18-AI-LEAK.html",
    "19": "CODEX-AUDIT-19-DATA-MODELS.html",
    "05": "CODEX-AUDIT-05-METERING.html",
    "04": "CODEX-AUDIT-04-BILLING.html",
    "06": "CODEX-AUDIT-06-CRM-SYNC.html",
    "03": "CODEX-AUDIT-03-SYNC-BLOCKING.html",
    "07": "CODEX-AUDIT-07-COUPLING.html",
    "13": "CODEX-AUDIT-13-TODO-FIXME.html",
    "14": "CODEX-AUDIT-14-CONSOLE-LOG.html",
    "16": "CODEX-AUDIT-16-HARDCODED-URLS.html",
    "12": "CODEX-AUDIT-12-DESIGN-SYSTEM.html",
    "17": "CODEX-AUDIT-17-DOCUMENTATION.html",
}


for audit in AUDITS:
    audit["report"] = f"{DESKTOP_DIR_URI}/{REPORT_OVERRIDES[audit['code']]}"
    numbered_steps = "\n".join(f"{index + 1}. {step}" for index, step in enumerate(audit["steps"]))
    validations = "\n".join(f"- {entry}" for entry in audit["validation"])
    audit["prompt"] = (
        "MODO: EXECUCAO CONTROLADA\n"
        f"Repositorio: {REPO_PATH}\n"
        f"Auditoria: {audit['code']} - {audit['title']}\n"
        f"Fase: {audit['phase']} | Ciclo: {audit['cycle']} | Severidade: {audit['severity']}\n"
        f"Achados atuais: {audit['findings']}\n"
        f"Objetivo: {audit['objective']}\n\n"
        "EXECUTE NESTA ORDEM:\n"
        f"{numbered_steps}\n\n"
        "AO FINAL, ESPERE:\n"
        + "\n".join(f"- {entry}" for entry in audit["expected"])
        + "\n\nVALIDE COM:\n"
        + validations
        + "\n\nREGISTRE EVIDENCIAS NO CHECKLIST E REEXECUTE O RELATORIO HTML DA AUDITORIA."
    )


HTML = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>CODEX Audit Execution Checklist</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Syne:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    :root {{
      --bg:#060812; --panel:rgba(255,255,255,.06); --panel2:rgba(255,255,255,.04); --border:rgba(255,255,255,.09);
      --text:#f7f8fb; --muted:#a8b1c7; --ok:#00d084; --warn:#f5c518; --danger:#ff4d6d; --info:#7dd3fc; --accent:#ff8c42;
    }}
    * {{ box-sizing:border-box; }}
    body {{
      margin:0; color:var(--text); font-family:'JetBrains Mono',monospace;
      background:radial-gradient(circle at top left, rgba(125,211,252,.18), transparent 26%), radial-gradient(circle at top right, rgba(255,77,109,.12), transparent 24%), var(--bg);
    }}
    header, section {{
      width:min(1320px, calc(100% - 32px)); margin:24px auto; background:var(--panel);
      border:1px solid var(--border); border-radius:24px; backdrop-filter:blur(16px); box-shadow:0 20px 60px rgba(0,0,0,.35);
    }}
    header {{ padding:28px; }}
    section {{ padding:24px; }}
    h1, h2, h3, h4 {{ font-family:'Syne',sans-serif; margin:0 0 12px; }}
    p, li, label, summary, td, th {{ color:var(--muted); }}
    .meta, .filters, .group-meta {{ display:flex; gap:12px; flex-wrap:wrap; }}
    .pill {{
      padding:10px 14px; border-radius:999px; border:1px solid var(--border); background:var(--panel2); color:var(--text);
    }}
    .filters button, .copy, .open-report {{
      appearance:none; border:0; cursor:pointer; border-radius:999px; padding:10px 14px; font-weight:700; font-family:'JetBrains Mono',monospace;
      background:linear-gradient(135deg, var(--accent), var(--info)); color:#0a111c;
    }}
    .filters button.active {{ background:linear-gradient(135deg, var(--danger), var(--warn)); }}
    .tabs {{ display:flex; gap:10px; flex-wrap:wrap; margin-top:18px; }}
    .tabs button {{
      appearance:none; border:1px solid var(--border); cursor:pointer; border-radius:999px; padding:10px 14px; background:var(--panel2); color:var(--text); font-family:'JetBrains Mono',monospace;
    }}
    .tabs button.active {{ border-color:rgba(255,255,255,.18); background:rgba(255,255,255,.12); }}
    .view {{ display:none; }}
    .view.active {{ display:block; }}
    .group {{ margin-top:22px; padding:18px; border-radius:22px; background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.06); }}
    .cards {{ display:grid; grid-template-columns:repeat(auto-fit, minmax(360px, 1fr)); gap:16px; margin-top:16px; }}
    .card {{ border:1px solid rgba(255,255,255,.08); border-radius:22px; background:rgba(0,0,0,.18); overflow:hidden; }}
    .card-header {{ padding:18px 18px 12px; border-bottom:1px solid rgba(255,255,255,.06); }}
    .card-body {{ padding:18px; display:grid; gap:14px; }}
    .title-row {{ display:flex; gap:10px; align-items:center; flex-wrap:wrap; }}
    .sev, .status-badge {{
      display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border-radius:999px; font-size:12px; font-weight:700;
    }}
    .sev.CRITICO {{ background:rgba(255,77,109,.16); color:#ff9bae; }}
    .sev.ALTO {{ background:rgba(255,140,66,.16); color:#ffc39c; }}
    .sev.MEDIO {{ background:rgba(245,197,24,.16); color:#ffe58a; }}
    .sev.BAIXO {{ background:rgba(125,211,252,.16); color:#a7e5ff; }}
    .status-badge {{ background:rgba(255,255,255,.08); color:var(--text); }}
    .grid-2 {{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }}
    .field, details {{ background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.06); border-radius:18px; padding:14px; }}
    select, input, textarea {{
      width:100%; margin-top:8px; border-radius:14px; border:1px solid rgba(255,255,255,.1); background:rgba(6,8,18,.75); color:var(--text); padding:10px 12px; font-family:'JetBrains Mono',monospace;
    }}
    textarea {{ min-height:110px; resize:vertical; }}
    summary {{ cursor:pointer; color:var(--text); }}
    ul {{ margin:0; padding-left:18px; }}
    .checklist label {{ display:flex; gap:10px; align-items:flex-start; margin:8px 0; }}
    .checklist input[type="checkbox"] {{ width:auto; margin:2px 0 0; }}
    .toolbar {{ display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap; align-items:center; }}
    .subtle {{ color:var(--muted); font-size:12px; }}
    .hidden {{ display:none !important; }}
    .footer-note {{ color:var(--muted); font-size:13px; }}
    a {{ color:var(--info); }}
    @media (max-width: 900px) {{ .grid-2 {{ grid-template-columns:1fr; }} }}
  </style>
</head>
<body>
  <header>
    <h1>Checklist Auditavel de Execucao das 20 Auditorias</h1>
    <p>Documento operacional para acompanhar a execucao por fase e por ciclo. Cada item traz prompt de execucao, evidencias esperadas, tratamento de erro, validacoes e campos auditaveis persistidos em localStorage.</p>
    <div class="meta">
      <span class="pill"><strong>Repositorio:</strong> {REPO_PATH}</span>
      <span class="pill"><strong>Total de auditorias:</strong> {len(AUDITS)}</span>
      <span class="pill"><strong>Total de achados atuais:</strong> <span id="total-findings"></span></span>
      <span class="pill"><strong>Checklist:</strong> auditable / localStorage</span>
    </div>
    <div class="tabs">
      <button class="tab active" data-view="phase-view">Ver por Fase</button>
      <button class="tab" data-view="cycle-view">Ver por Ciclo</button>
    </div>
  </header>
  <section>
    <div class="toolbar">
      <div class="filters">
        <button class="filter active" data-filter="ALL">Todas</button>
        <button class="filter" data-filter="Nao iniciado">Nao iniciado</button>
        <button class="filter" data-filter="Em execucao">Em execucao</button>
        <button class="filter" data-filter="Bloqueado">Bloqueado</button>
        <button class="filter" data-filter="Validacao">Validacao</button>
        <button class="filter" data-filter="Concluido">Concluido</button>
      </div>
      <div class="group-meta">
        <span class="pill">Concluidos: <strong id="done-count">0</strong></span>
        <span class="pill">Bloqueados: <strong id="blocked-count">0</strong></span>
        <span class="pill">Validando: <strong id="review-count">0</strong></span>
      </div>
    </div>
    <div id="phase-view" class="view active"></div>
    <div id="cycle-view" class="view"></div>
  </section>
  <section>
    <h2>Como usar este checklist</h2>
    <ul>
      <li>Abra a auditoria pelo relatorio HTML correspondente antes de iniciar a execucao.</li>
      <li>Atualize status, responsavel, evidencias e bloqueios em cada item.</li>
      <li>Use o prompt de execucao como runbook inicial e adapte so quando houver justificativa tecnica.</li>
      <li>Feche um item apenas quando implementacao, validacao e evidencia estiverem completas.</li>
    </ul>
    <p class="footer-note">Observacao: os campos deste checklist ficam persistidos no navegador por localStorage. Para auditoria formal, exporte os dados ou tire snapshot do HTML apos cada ciclo.</p>
  </section>
  <script>
    const AUDITS = {json.dumps(AUDITS, ensure_ascii=False)};
    const STATUS_OPTIONS = ["Nao iniciado", "Em execucao", "Bloqueado", "Validacao", "Concluido"];
    let currentFilter = "ALL";

    const totalFindings = AUDITS.reduce((acc, item) => acc + item.findings, 0);
    document.getElementById("total-findings").textContent = totalFindings;

    const storageKey = (code, field) => `codex-checklist:${{code}}:${{field}}`;
    const readValue = (code, field, fallback="") => localStorage.getItem(storageKey(code, field)) ?? fallback;
    const writeValue = (code, field, value) => localStorage.setItem(storageKey(code, field), value);

    function getStatus(code) {{
      return readValue(code, "status", "Nao iniciado");
    }}

    function severityClass(severity) {{
      return severity.normalize("NFD").replace(/[^A-Za-z]/g, "").toUpperCase();
    }}

    function defaultChecklist(item) {{
      return [
        "Escopo e dependencia confirmados",
        "Implementacao principal concluida",
        "Validacao tecnica executada",
        "Evidencia registrada",
      ];
    }}

    function renderCard(item) {{
      const status = getStatus(item.code);
      const phaseClass = currentFilter !== "ALL" && status !== currentFilter ? "hidden" : "";
      const checklistItems = defaultChecklist(item).map((label, index) => {{
        const key = `task-${{index}}`;
        const checked = readValue(item.code, key, "false") === "true" ? "checked" : "";
        return `<label><input type="checkbox" data-code="${{item.code}}" data-field="${{key}}" ${{checked}}><span>${{label}}</span></label>`;
      }}).join("");
      const expected = item.expected.map(entry => `<li>${{entry}}</li>`).join("");
      const errorHandling = item.error_handling.map(entry => `<li>${{entry}}</li>`).join("");
      const validation = item.validation.map(entry => `<li><code>${{entry}}</code></li>`).join("");
      const dependsOn = (item.depends_on.length ? item.depends_on : ["Sem dependencia critica anterior."]).map(entry => `<li>${{entry}}</li>`).join("");
      return `
        <article class="card audit-card ${{phaseClass}}" data-status="${{status}}" data-code="${{item.code}}">
          <div class="card-header">
            <div class="title-row">
              <span class="sev ${{severityClass(item.severity)}}">${{item.severity}}</span>
              <span class="status-badge">${{status}}</span>
            </div>
            <h3>${{item.code}} - ${{item.title}}</h3>
            <p>${{item.objective}}</p>
            <div class="group-meta">
              <span class="pill">${{item.phase}}</span>
              <span class="pill">${{item.cycle}}</span>
              <span class="pill">Achados: <strong>${{item.findings}}</strong></span>
            </div>
          </div>
          <div class="card-body">
            <div class="grid-2">
              <div class="field">
                <label>Status
                  <select data-code="${{item.code}}" data-field="status">
                    ${{STATUS_OPTIONS.map(option => `<option value="${{option}}" ${{option === status ? "selected" : ""}}>${{option}}</option>`).join("")}}
                  </select>
                </label>
              </div>
              <div class="field">
                <label>Responsavel
                  <input type="text" data-code="${{item.code}}" data-field="owner" value="${{readValue(item.code, "owner")}}" placeholder="Nome ou squad">
                </label>
              </div>
            </div>
            <div class="field checklist">
              <h4>Checklist auditavel</h4>
              ${{checklistItems}}
            </div>
            <details>
              <summary>Passos de execucao</summary>
              <ul>${{item.steps.map(step => `<li>${{step}}</li>`).join("")}}</ul>
            </details>
            <details>
              <summary>Prompt de execucao</summary>
              <button class="copy" data-text="${{encodeURIComponent(item.prompt)}}">Copiar prompt</button>
              <pre>${{item.prompt}}</pre>
            </details>
            <details>
              <summary>O que deve esperar</summary>
              <ul>${{expected}}</ul>
            </details>
            <details>
              <summary>Tratativa de erros</summary>
              <ul>${{errorHandling}}</ul>
            </details>
            <details>
              <summary>Validacao e evidencia</summary>
              <ul>${{validation}}</ul>
            </details>
            <details>
              <summary>Dependencias</summary>
              <ul>${{dependsOn}}</ul>
            </details>
            <div class="grid-2">
              <div class="field">
                <label>Evidencia
                  <textarea data-code="${{item.code}}" data-field="evidence" placeholder="Cole links, commits, arquivos, prints, comandos executados e resultados">${{readValue(item.code, "evidence")}}</textarea>
                </label>
              </div>
              <div class="field">
                <label>Bloqueios / observacoes
                  <textarea data-code="${{item.code}}" data-field="blockers" placeholder="Descreva erro, impedimento, rollback, dependencia externa ou decisao tomada">${{readValue(item.code, "blockers")}}</textarea>
                </label>
              </div>
            </div>
            <div class="toolbar">
              <a class="open-report" href="${{item.report}}" target="_blank" rel="noreferrer">Abrir relatorio da auditoria</a>
              <span class="subtle">Ultima atualizacao: ${{readValue(item.code, "updated_at", "nao registrada")}}</span>
            </div>
          </div>
        </article>
      `;
    }}

    function renderGroups(targetId, groupField) {{
      const target = document.getElementById(targetId);
      const groups = [...new Set(AUDITS.map(item => item[groupField]))];
      target.innerHTML = groups.map(groupName => {{
        const entries = AUDITS.filter(item => item[groupField] === groupName);
        const findings = entries.reduce((acc, item) => acc + item.findings, 0);
        return `
          <div class="group">
            <h2>${{groupName}}</h2>
            <div class="group-meta">
              <span class="pill">Auditorias: <strong>${{entries.length}}</strong></span>
              <span class="pill">Achados neste grupo: <strong>${{findings}}</strong></span>
            </div>
            <div class="cards">${{entries.map(renderCard).join("")}}</div>
          </div>
        `;
      }}).join("");
    }}

    function refreshCounters() {{
      const statuses = AUDITS.map(item => getStatus(item.code));
      document.getElementById("done-count").textContent = statuses.filter(value => value === "Concluido").length;
      document.getElementById("blocked-count").textContent = statuses.filter(value => value === "Bloqueado").length;
      document.getElementById("review-count").textContent = statuses.filter(value => value === "Validacao").length;
    }}

    function renderAll() {{
      renderGroups("phase-view", "phase");
      renderGroups("cycle-view", "cycle");
      bindEvents();
      refreshCounters();
    }}

    function bindEvents() {{
      document.querySelectorAll("[data-code][data-field]").forEach(element => {{
        const handler = () => {{
          if (element.type === "checkbox") {{
            writeValue(element.dataset.code, element.dataset.field, String(element.checked));
          }} else {{
            writeValue(element.dataset.code, element.dataset.field, element.value);
          }}
          writeValue(element.dataset.code, "updated_at", new Date().toLocaleString("pt-BR"));
          if (element.dataset.field === "status") {{
            renderAll();
            applyFilter();
            return;
          }}
          document.querySelectorAll(`article[data-code="${{element.dataset.code}}"] .subtle`).forEach(node => {{
            node.textContent = `Ultima atualizacao: ${{readValue(element.dataset.code, "updated_at", "nao registrada")}}`;
          }});
          refreshCounters();
        }};
        element.addEventListener("change", handler);
        element.addEventListener("input", handler);
      }});
      document.querySelectorAll(".copy").forEach(button => {{
        button.addEventListener("click", async () => {{
          const text = decodeURIComponent(button.dataset.text);
          await navigator.clipboard.writeText(text);
          const previous = button.textContent;
          button.textContent = "Copiado";
          setTimeout(() => button.textContent = previous, 1200);
        }});
      }});
    }}

    function applyFilter() {{
      document.querySelectorAll(".audit-card").forEach(card => {{
        const visible = currentFilter === "ALL" || card.dataset.status === currentFilter;
        card.classList.toggle("hidden", !visible);
      }});
    }}

    document.querySelectorAll(".filter").forEach(button => {{
      button.addEventListener("click", () => {{
        currentFilter = button.dataset.filter;
        document.querySelectorAll(".filter").forEach(node => node.classList.remove("active"));
        button.classList.add("active");
        applyFilter();
      }});
    }});

    document.querySelectorAll(".tab").forEach(button => {{
      button.addEventListener("click", () => {{
        document.querySelectorAll(".tab").forEach(node => node.classList.remove("active"));
        document.querySelectorAll(".view").forEach(node => node.classList.remove("active"));
        button.classList.add("active");
        document.getElementById(button.dataset.view).classList.add("active");
      }});
    }});

    renderAll();
    applyFilter();
  </script>
</body>
</html>
"""


def main() -> int:
    DOCS_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    DESKTOP_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    DOCS_OUTPUT.write_text(HTML, encoding="utf-8")
    DESKTOP_OUTPUT.write_text(HTML, encoding="utf-8")
    print(json.dumps({"docs": str(DOCS_OUTPUT), "desktop": str(DESKTOP_OUTPUT)}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
