# Dívidas de Banco de Dados


### [TD-106] DÍVIDAS DE BANCO DE DADOS: Falta de auditoria de dados críticos
- **Severidade:** MÉDIO
- **Prioridade:** P2 média
- **Status:** Verificação manual necessária
- **Impacto:** Dados podem ser perdidos sem rastreabilidade
- **Risco de não corrigir:** Compliance LGPD
- **Recomendação:** Criar logs de auditoria no DB
- **Esforço:** G
- **Arquivo/Linha:** `packages/database/prisma/schema.prisma`
- **Evidência/Como detectado:** Prisma schema não inspecionado completamente
- **Correção sugerida:** Trigger ou Prisma middleware
- **Testes recomendados:** Testes de auditoria

### [TD-123] DÍVIDAS DE QUALIDADE DE DADOS: Estados inválidos permitidos
- **Severidade:** MÉDIO
- **Prioridade:** P2 média
- **Status:** Verificação manual necessária
- **Impacto:** Lixo na base
- **Risco de não corrigir:** Bugs difíceis
- **Recomendação:** Apertar constraints do banco
- **Esforço:** M
- **Arquivo/Linha:** `schema.prisma`
- **Evidência/Como detectado:** Prisma Schema
- **Correção sugerida:** CHECK constraints
- **Testes recomendados:** Testes de model
