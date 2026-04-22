# Retrospectiva Técnica (F1 a F11)

### Lições Aprendidas
1. **O custo do acoplamento**: Evite referências globais que vazam contexto do banco. O uso de `AsyncLocalStorage` demonstrou-se essencial para multitenancy limpo em Node.
2. **Padrões Rígidos de Código**: O projeto cresceu muito rápido sem regras Eslint fortes (`strict` off). Trazer isso para a realidade e fechar o débito de milhares de arquivos com regexes, find-and-replace massivo é mais exaustivo que aplicar a regra de formatação desde o dia 0.
3. **Agentes e Workflows**: Componentes assíncronos precisam de arquiteturas escaláveis. Filas (Queue), Events e workers isolados provaram a escalabilidade superior em vez da arquitetura legada web-hook-blocking.

### Processos para Prevenir Reacumulação
1. **Zero Exceções CI**: PRs bloqueados com coverage ou failures não sobem. Se existe emergência, o código é mitigado via Hotfix sem afrouxamento duradouro das regras de Typescript.
2. **Rotina de Auditoria**: Revisão técnica formal a cada Q4 para alinhar dependências, arquitetura ou refatorações de design usando ADRs e relatórios de CI.
3. **Regra do Boy Scout**: Engenheiros devem deixar o código num estado melhor do que encontraram, mantendo a regra de higiene do repositório alta.
