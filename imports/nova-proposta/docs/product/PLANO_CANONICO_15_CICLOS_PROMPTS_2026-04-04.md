# Plano Canônico de 15 Ciclos com Prioridades, Fases e Prompts

Data: 2026-04-04

## Objetivo
- Consolidar os modelos de ciclos e fases encontrados no repositório em um único plano operacional.
- Preservar a cadência de rollout em 15 ciclos.
- Manter a ordem de dependência dos 10 ciclos do prompt soberano.
- Cobrir as 12 fases macro de auditoria (`F0` a `F11`).
- Exigir os gates de qualidade `F1-F5` do playbook em todos os ciclos.

## Fontes de consolidação
- `.github/PLAYBOOK_AGENTES.md`
- `docs/programs/internal/prompt_soberano_v13.html`
- `audit/AUDITORIA_CODEX_RESULTADO_2026-03-29.md`

## Critério de consolidação
- A malha final usa `15 ciclos`, porque o playbook já define rollout em 15 ciclos.
- A sequência funcional segue o encadeamento do prompt soberano (`C01` a `C10`).
- As fases macro de auditoria são distribuídas ao longo dos 15 ciclos para não concentrar risco em um único bloco.
- Cada ciclo deve sair com evidência objetiva, não apenas texto declaratório.

## Mapa Rápido
| Ordem | Prioridade | Ciclo Canônico | Base Soberano | Fases Macro | Objetivo de Saída |
|---|---|---|---|---|---|
| 1 | P0 | Ciclo 01 | C01 / R0 | F0, F6, F11 | Matriz de secrets, owners e preflight equivalente validado |
| 2 | P0 | Ciclo 02 | C02 / R0 | F1, F11 | Pipeline de produção endurecido com gates reais |
| 3 | P0 | Ciclo 03 | C03 / R1 | F0, F10 | Governança documental realinhada ao cânon |
| 4 | P0 | Ciclo 04 | C04 / R2 | F7, F11 | Health, readiness e alertas do core corrigidos |
| 5 | P1 | Ciclo 05 | C05 / R3 | F2, F8 | Inventário de consumers de `packages/db` com plano de migração |
| 6 | P1 | Ciclo 06 | C05 / R3 | F8, F11 | Migrações, contratos e data plane estabilizados |
| 7 | P1 | Ciclo 07 | C06 / R3 | F2, F6, F11 | Integrações jurídicas e DR com evidência material |
| 8 | P1 | Ciclo 08 | C07 / R4 | F2, F3 | SDR e leads fora do caminho legado |
| 9 | P1 | Ciclo 09 | C07 / R4 | F3, F7 | Orquestração real consolidada em fluxo único |
| 10 | P2 | Ciclo 10 | C08 / R4 | F2, F7 | CS e BI alinhados ao stack oficial |
| 11 | P2 | Ciclo 11 | C08 / R4 | F2, F9 | Dashboard rebaixado e operadores migrados sem regressão |
| 12 | P2 | Ciclo 12 | C09 / R5 | F9, F10 | Ruído estrutural reduzido e satélites classificados |
| 13 | P2 | Ciclo 13 | Transversal | F4, F10 | Contratos de agentes, prompts e instruções padronizados |
| 14 | P3 | Ciclo 14 | Pré-C10 | F5, F6, F7, F11 | Rehearsal final com testes, performance e segurança |
| 15 | P0 | Ciclo 15 | C10 / R6 | F11 | Pacote final de release e decisão go/no-go |

## Regras Fixas para Todos os Ciclos
- Aplicar o checklist do playbook `F1-F5`: descoberta, contrato, prompting, implementação e validação cruzada.
- Não marcar ciclo como concluído sem evidência reproduzível: commit, diff, teste, log, artefato ou relatório objetivo.
- Registrar dependências bloqueantes explicitamente.
- Manter rollback, mitigação e critérios de aceite em cada entrega.

## Ciclos Prioritários

### Ciclo 01 — Secrets, owners e preflight equivalente
- Prioridade: `P0`
- Base soberano: `C01 / R0`
- Fases cobertas: `F0`, `F6`, `F11`
- Dependência: nenhuma
- Escopo exclusivo: secrets exigidos por `scripts/release/preflight-env.ts`, `.github/workflows/cd.yml` e rotinas de release.
- Saída obrigatória: matriz de owners por ambiente, equivalência staging/production e dry-run validado sem vazamento de segredo.
- Prompt robusto exclusivo:
```text
Você é o líder técnico de release do BirthHub 360. Execute o Ciclo 01 com foco exclusivo em secrets, ownership e preflight equivalente. Trabalhe sobre `scripts/release/preflight-env.ts`, `.github/workflows/cd.yml`, arquivos de ambiente de referência e documentação operacional correlata. Objetivo: inventariar todos os segredos exigidos, construir a matriz de owners por ambiente, definir lacunas de provisionamento e validar um dry-run confiável de preflight para staging e production sem expor valores sensíveis em logs. Não avance para pipeline, deploy ou cutover. Entregue: (1) diagnóstico atual, (2) tabela de secrets por owner/ambiente/criticidade, (3) mudanças de código ou workflow necessárias, (4) evidência de dry-run, (5) riscos e mitigação, (6) rollback, (7) critérios objetivos de aceite para liberar o próximo ciclo.
```

### Ciclo 02 — Workflow de produção com gates reais
- Prioridade: `P0`
- Base soberano: `C02 / R0`
- Fases cobertas: `F1`, `F11`
- Dependência: Ciclo 01 verde
- Escopo exclusivo: encadeamento entre preflight, deploy, smoke, e2e de release e rollback rehearsal.
- Saída obrigatória: workflow de produção endurecido com gates reais e artefatos verificáveis.
- Prompt robusto exclusivo:
```text
Você é o engenheiro principal de CI/CD do BirthHub 360. Execute o Ciclo 02 com foco exclusivo no endurecimento do workflow de produção. Use `.github/workflows/cd.yml`, scripts de release e jobs de validação reais. Objetivo: criar ou corrigir o encadeamento entre preflight, deploy, smoke test, e2e de release e rollback rehearsal, garantindo que produção não avance quando qualquer gate falhar. Não trate documentação ampla, observabilidade ou migração de legado neste ciclo. Entregue: (1) leitura técnica do pipeline atual, (2) mudanças por job e por arquivo, (3) políticas de fail-fast e dependências explícitas, (4) artefatos esperados do GitHub Actions, (5) teste de execução ou simulação controlada, (6) riscos de promoção indevida, (7) checklist objetivo para liberar governança canônica no ciclo seguinte.
```

### Ciclo 03 — Governança documental canônica
- Prioridade: `P0`
- Base soberano: `C03 / R1`
- Fases cobertas: `F0`, `F10`
- Dependência: Ciclo 02 em curso ou verde
- Escopo exclusivo: documentos canônicos, ownership, runbooks, critérios de aceite e coerência entre fontes.
- Saída obrigatória: uma única versão confiável para governança operacional e release.
- Prompt robusto exclusivo:
```text
Você é o responsável por governança técnica e documentação do BirthHub 360. Execute o Ciclo 03 com foco exclusivo em consolidar a documentação canônica. Revise playbooks, políticas, runbooks, ownership matrices, checklists de aceite e documentos de release para eliminar duplicidade, conflito e instrução morta. Não altere ainda cutover do legado nem fluxos de produção. Objetivo: deixar claro qual documento manda, qual está obsoleto e qual evidência é necessária para cada decisão operacional. Entregue: (1) mapa de fontes primárias e derivadas, (2) conflitos encontrados, (3) mudanças por arquivo, (4) índice canônico final, (5) política de atualização futura, (6) riscos de ambiguidade residual, (7) critérios de aceite para liberar health/readiness e fases operacionais seguintes.
```

### Ciclo 04 — Health, readiness e alertas do core
- Prioridade: `P0`
- Base soberano: `C04 / R2`
- Fases cobertas: `F7`, `F11`
- Dependência: Ciclo 03 verde
- Escopo exclusivo: readiness, health endpoints, alertas acionáveis e sinais do core.
- Saída obrigatória: health/readiness do core corrigidos e alerta útil para operação.
- Prompt robusto exclusivo:
```text
Você é o tech lead de observabilidade operacional do BirthHub 360. Execute o Ciclo 04 com foco exclusivo em healthchecks, readiness e alertas do core. Inspecione `apps/api`, `apps/web`, `apps/worker`, indicadores de monitoramento, documentação de SLO e alertas existentes. Objetivo: garantir que os sinais de saúde reflitam dependências reais, que readiness falhe quando o sistema não puder operar com segurança e que alertas apontem para ações concretas. Não trate migração de dashboard, contratos de agentes ou cutover jurídico neste ciclo. Entregue: (1) diagnóstico de health/readiness por serviço, (2) mudanças de código e monitoramento, (3) lista de alertas novos ou corrigidos, (4) testes ou simulações, (5) runbook mínimo por alerta crítico, (6) riscos operacionais, (7) critérios objetivos para liberar dados, integrações e cutover do legado.
```

### Ciclo 05 — Inventário de consumers de `packages/db`
- Prioridade: `P1`
- Base soberano: `C05 / R3`
- Fases cobertas: `F2`, `F8`
- Dependência: Ciclo 03 verde
- Escopo exclusivo: mapeamento de consumidores, contratos de acesso e dependências em banco.
- Saída obrigatória: inventário confiável de quem depende de `packages/db` e como migrar.
- Prompt robusto exclusivo:
```text
Você é o arquiteto de dados e integração interna do BirthHub 360. Execute o Ciclo 05 com foco exclusivo em mapear consumidores de `packages/db` e dependências relacionadas ao data plane. Objetivo: identificar todos os pontos de leitura e escrita, contratos implícitos, dependências frágeis, importações legadas e riscos de migração. Não execute ainda o cutover final; este ciclo é de inventário e plano verificável. Entregue: (1) mapa de consumers por pacote/serviço, (2) classificação por criticidade, (3) proposta de migração por domínio, (4) diffs necessários para reduzir acoplamento, (5) impactos em migrations e compatibilidade, (6) risco de regressão funcional, (7) critérios de aceite que liberam a estabilização do data plane no ciclo seguinte.
```

### Ciclo 06 — Data plane, migrations e contratos estáveis
- Prioridade: `P1`
- Base soberano: `C05 / R3`
- Fases cobertas: `F8`, `F11`
- Dependência: Ciclo 05 verde
- Escopo exclusivo: migrations, contratos de dados, versionamento e consistência de acesso.
- Saída obrigatória: data plane estabilizado com rollback e validação de compatibilidade.
- Prompt robusto exclusivo:
```text
Você é o owner de banco de dados e migrations do BirthHub 360. Execute o Ciclo 06 com foco exclusivo em estabilizar o data plane após o inventário de consumers. Trabalhe em contratos de schema, migrations, regras de compatibilidade, versionamento e rollback. Objetivo: preparar o banco e os acessos para suportar a nova arquitetura sem mudança silenciosa de comportamento. Não trate dashboard, agentes comerciais ou documentação ampla aqui. Entregue: (1) plano técnico de migração, (2) mudanças por migration/script/repositório, (3) estratégia backward-compatible quando necessária, (4) testes de migração e pós-migração, (5) métricas e checks de consistência, (6) rollback detalhado, (7) critérios objetivos para liberar integrações externas e fluxos críticos.
```

### Ciclo 07 — Integrações jurídicas e DR com evidência material
- Prioridade: `P1`
- Base soberano: `C06 / R3`
- Fases cobertas: `F2`, `F6`, `F11`
- Dependência: Ciclo 06 verde
- Escopo exclusivo: integrações jurídicas, recuperação de desastre e provas materiais de operação.
- Saída obrigatória: integrações críticas documentadas, testadas e com evidência verificável.
- Prompt robusto exclusivo:
```text
Você é o responsável por integrações críticas, continuidade de negócio e disaster recovery do BirthHub 360. Execute o Ciclo 07 com foco exclusivo em integrações jurídicas, fluxos regulatórios e DR. Objetivo: comprovar que esses fluxos têm contrato estável, fallback operacional, evidência material de execução e caminho de recuperação conhecido. Não misture este ciclo com SDR, BI ou padronização de prompts. Entregue: (1) inventário das integrações e dependências, (2) análise de risco por fluxo, (3) correções por arquivo e por runbook, (4) teste controlado ou evidência material, (5) matriz de contingência, (6) critérios de failover/rollback, (7) critérios de aceite para liberar os ciclos de cutover do legado.
```

### Ciclo 08 — SDR e leads fora do caminho legado
- Prioridade: `P1`
- Base soberano: `C07 / R4`
- Fases cobertas: `F2`, `F3`
- Dependência: Ciclos 04 e 05 verdes
- Escopo exclusivo: rotas e fluxos de SDR/leads no caminho crítico.
- Saída obrigatória: SDR e leads operando no stack oficial com fallback temporário controlado.
- Prompt robusto exclusivo:
```text
Você é o tech lead de cutover de SDR e leads do BirthHub 360. Execute o Ciclo 08 com foco exclusivo em remover SDR/leads do caminho legado. Analise rotas antigas, APIs oficiais, módulos de domínio e dependências transitórias. Objetivo: migrar o fluxo crítico de leads para o stack canônico, manter fallback temporário apenas quando estritamente necessário e preparar a remoção segura do legado. Não ataque BI, dashboard ou contratos de agentes neste ciclo. Entregue: (1) mapa do fluxo atual versus fluxo alvo, (2) mudanças de código por rota/módulo, (3) estratégia de compatibilidade temporária, (4) testes end-to-end, (5) métricas e sinais de regressão, (6) plano de rollback, (7) critérios objetivos para desligar o caminho legado de SDR.
```

### Ciclo 09 — Orquestração real em fluxo único
- Prioridade: `P1`
- Base soberano: `C07 / R4`
- Fases cobertas: `F3`, `F7`
- Dependência: Ciclos 04 e 05 verdes
- Escopo exclusivo: migração de orquestração para fluxo oficial e único.
- Saída obrigatória: orquestração consolidada, sem duplicidade de runtime crítico.
- Prompt robusto exclusivo:
```text
Você é o principal engenheiro de runtime e filas do BirthHub 360. Execute o Ciclo 09 com foco exclusivo em consolidar a orquestração real em um fluxo único. Avalie workers, filas, executores, jobs, fluxo legado e equivalência funcional do caminho alvo. Objetivo: remover bifurcação operacional, garantir um único fluxo crítico oficial e preservar rastreabilidade, retries, DLQ e cancelamento seguro. Não trate dashboard, documentos canônicos ou integração jurídica aqui. Entregue: (1) comparação detalhada entre fluxo legado e fluxo alvo, (2) mudanças por worker/job/executor, (3) contratos de fila e observabilidade, (4) testes de equivalência e regressão, (5) métricas e alarmes, (6) rollback funcional, (7) critérios de aceite para considerar o runtime legado fora do caminho crítico.
```

### Ciclo 10 — CS e BI alinhados ao stack oficial
- Prioridade: `P2`
- Base soberano: `C08 / R4`
- Fases cobertas: `F2`, `F7`
- Dependência: Ciclos 04, 06 e 07 verdes
- Escopo exclusivo: jobs, sinais e fluxos de CS/BI.
- Saída obrigatória: CS/BI rodando no stack oficial, sem agenda divergente.
- Prompt robusto exclusivo:
```text
Você é o responsável por Customer Success e Business Intelligence do BirthHub 360. Execute o Ciclo 10 com foco exclusivo em alinhar jobs, sinais e automações de CS/BI ao stack oficial. Objetivo: corrigir agendas divergentes, padronizar origem de eventos, remover duplicidade de cron e garantir que alertas e relatórios relevantes venham da fonte certa. Não trate ainda a migração da interface do dashboard; este ciclo é de backend, sinal e operação. Entregue: (1) inventário dos jobs e sinais atuais, (2) conflitos com o stack oficial, (3) mudanças de código e configuração, (4) validação por execução controlada, (5) observabilidade específica, (6) rollback, (7) critérios de aceite para a migração final da camada de dashboard.
```

### Ciclo 11 — Dashboard rebaixado com migração segura de operadores
- Prioridade: `P2`
- Base soberano: `C08 / R4`
- Fases cobertas: `F2`, `F9`
- Dependência: Ciclo 10 verde
- Escopo exclusivo: dashboard, paridade mínima de operação e migração de operadores.
- Saída obrigatória: dashboard fora do papel de fonte primária sem quebra operacional.
- Prompt robusto exclusivo:
```text
Você é o owner de experiência operacional e console administrativo do BirthHub 360. Execute o Ciclo 11 com foco exclusivo em rebaixar o dashboard legado e migrar operadores com segurança. Objetivo: garantir paridade mínima das funções críticas no caminho novo, documentar o procedimento de migração de operadores e impedir que o dashboard antigo permaneça como fonte primária informal. Não altere orquestração, integrações jurídicas ou pipeline de produção neste ciclo. Entregue: (1) inventário das funções críticas do dashboard, (2) matriz de paridade mínimo viável, (3) mudanças por tela/rota/guia operacional, (4) validação com cenários reais de operador, (5) comunicação e runbook de migração, (6) rollback, (7) critérios objetivos para declarar o dashboard rebaixado.
```

### Ciclo 12 — Ruído estrutural reduzido e satélites classificados
- Prioridade: `P2`
- Base soberano: `C09 / R5`
- Fases cobertas: `F9`, `F10`
- Dependência: Ciclos 03 e 11 verdes
- Escopo exclusivo: limpeza estrutural, classificação de satélites, remoção de lixo e organização.
- Saída obrigatória: estrutura do repositório com menor ruído e decisões explícitas sobre satélites.
- Prompt robusto exclusivo:
```text
Você é o responsável por higiene estrutural e racionalização do monorepo BirthHub 360. Execute o Ciclo 12 com foco exclusivo em reduzir ruído estrutural e classificar satélites. Objetivo: identificar artefatos órfãos, duplicados, espelhos analíticos, documentos mortos, scripts sem dono e diretórios satélite sem papel claro; então decidir por remover, arquivar, consolidar ou declarar como canônico. Não tente resolver produto, billing ou observabilidade aqui. Entregue: (1) inventário do ruído estrutural, (2) classificação por ação recomendada, (3) mudanças concretas por caminho, (4) riscos de remoção indevida, (5) política de arquivamento e ownership, (6) rollback documental/estrutural, (7) critérios objetivos para declarar a árvore mais limpa e inteligível.
```

### Ciclo 13 — Contratos de agentes, prompts e instruções padronizados
- Prioridade: `P2`
- Base soberano: `Transversal`
- Fases cobertas: `F4`, `F10`
- Dependência: Ciclo 03 verde
- Escopo exclusivo: prompts, skills, instructions, contratos e discoverability.
- Saída obrigatória: agentes e prompts com padrão operacional consistente e revisável.
- Prompt robusto exclusivo:
```text
Você é o mantenedor de contratos de agentes e prompting do BirthHub 360. Execute o Ciclo 13 com foco exclusivo em padronizar agentes, prompts, skills e instructions. Use o playbook, os artefatos de prompts em `.github/`, as instruções de qualidade e segurança e os padrões de contrato. Objetivo: garantir que cada agente ou prompt tenha responsabilidade única, entradas e saídas claras, ferramentas mínimas, riscos explícitos e validação F1-F5 coerente. Não trate deploy, data plane ou integração jurídica neste ciclo. Entregue: (1) taxonomia atual dos artefatos de prompt, (2) padrões obrigatórios e lacunas, (3) mudanças por arquivo, (4) exemplos de contrato correto, (5) validação cruzada, (6) riscos de ambiguidade residual, (7) critérios objetivos para considerar o ecossistema de prompts governado.
```

### Ciclo 14 — Rehearsal final com testes, performance e segurança
- Prioridade: `P3`
- Base soberano: `Pré-C10`
- Fases cobertas: `F5`, `F6`, `F7`, `F11`
- Dependência: Ciclos 04, 06, 07, 09, 11 e 13 verdes
- Escopo exclusivo: ensaio final com evidências de teste, performance, segurança e readiness.
- Saída obrigatória: rehearsal final com relatório objetivo de bloqueadores remanescentes.
- Prompt robusto exclusivo:
```text
Você é o coordenador técnico de rehearsal final do BirthHub 360. Execute o Ciclo 14 com foco exclusivo em testes, performance, segurança e readiness final antes do go/no-go. Objetivo: rodar ou validar as suítes e evidências necessárias para provar que a plataforma suporta a promoção com risco controlado, incluindo smoke, integração, performance, segurança e observabilidade. Não introduza grandes refactors; este ciclo serve para confirmar, bloquear ou devolver itens ao ciclo correto. Entregue: (1) matriz de evidências exigidas, (2) execução ou coleta dos artefatos, (3) bloqueadores por severidade, (4) gaps não comprovados, (5) recomendação técnica objetiva, (6) rollback ou mitigação por blocker, (7) critérios exatos para liberar o pacote final de release.
```

### Ciclo 15 — Pacote final de release e decisão go/no-go
- Prioridade: `P0`
- Base soberano: `C10 / R6`
- Fases cobertas: `F11`
- Dependência: Ciclos 01–14 verdes ou formalmente aceitos com ressalva
- Escopo exclusivo: pacote executivo final, decisão go/no-go e registro de riscos residuais.
- Saída obrigatória: decisão formal, fundamentada e auditável.
- Prompt robusto exclusivo:
```text
Você é o responsável técnico pelo gate final de release do BirthHub 360. Execute o Ciclo 15 com foco exclusivo em montar o pacote final e emitir uma recomendação go/no-go auditável. Use como entrada os artefatos produzidos nos ciclos anteriores, especialmente workflow endurecido, governança canônica, observabilidade, data plane, integrações críticas, cutovers e rehearsal final. Objetivo: sintetizar o estado real da plataforma sem maquiagem e decidir com base em evidência, não em intenção. Não abra novos grandes escopos; apenas consolide, aponte riscos residuais e recomende go, no-go ou go com ressalvas formais. Entregue: (1) sumário executivo, (2) tabela de evidências por ciclo, (3) bloqueadores residuais, (4) riscos aceitos e não aceitos, (5) decisão recomendada, (6) plano imediato pós-decisão, (7) critérios de reabertura caso a decisão seja no-go.
```

## Fechamento
- Esta consolidação usa `15 ciclos` como estrutura final de execução.
- Os ciclos estão em ordem de execução priorizada.
- As `12 fases` de auditoria (`F0-F11`) foram distribuídas ao longo do plano.
- Os `10 ciclos` do prompt soberano foram preservados como base semântica.
- O gate `F1-F5` do playbook é obrigatório em todos os ciclos.
