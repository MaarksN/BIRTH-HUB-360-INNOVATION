# Post-mortem: [Título Curto do Incidente]

**Data do Incidente**: [DD/MM/YYYY]
**Autores**: [Nome]
**Status**: [Draft / Under Review / Published]

## Sumário Executivo
O que aconteceu, impacto principal para os clientes (e % de afetados), tempo de indisponibilidade e causa raiz principal, tudo resumido em um parágrafo.

## 5-Whys (Análise da Causa Raiz)
1. **Por que [X aconteceu]?** Porque [Y falhou].
2. **Por que [Y falhou]?** Porque [Z estava mal configurado].
3. **Por que [Z]?** Porque o deploy não rodou migrations.
4. **Por que o deploy não rodou migrations?** Porque o script do CI/CD timeoutou antes.
5. **Por que o script timeoutou?** Porque tentou processar batching numa conexão limitando PgBouncer em modo incorreto.

## Linha do Tempo (Timeline UTC)
- **HH:MM** - Início do impacto.
- **HH:MM** - Alerta acionado.
- **HH:MM** - Equipe de plantão assume (Triage).
- **HH:MM** - Causa mitigada ou Rollback feito.

## Plano de Ação
- [ ] [Ação 1: Configurar timeout no pgbouncer] - Resp: @dev - Prazo: DD/MM
- [ ] [Ação 2: Melhorar health check do banco] - Resp: @dev2 - Prazo: DD/MM
