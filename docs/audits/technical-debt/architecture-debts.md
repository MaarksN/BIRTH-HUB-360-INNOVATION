# Dívidas de Arquitetura


### [TD-105] DÍVIDAS DE ARQUITETURA: Falta de análise de boundaries automatizada
- **Severidade:** ALTO
- **Prioridade:** P1 alta
- **Status:** Verificação manual necessária
- **Impacto:** Possível acoplamento de domínio e framework
- **Risco de não corrigir:** Regras de negócio viciadas ao Express/Prisma
- **Recomendação:** Instalar e rodar dependency-cruiser
- **Esforço:** M
- **Arquivo/Linha:** `N/A`
- **Evidência/Como detectado:** N/A
- **Correção sugerida:** Rodar dep-cruiser
- **Testes recomendados:** Testes unitários puros

### [TD-124] DÍVIDAS DE ARQUITETURA: Camadas misturadas
- **Severidade:** ALTO
- **Prioridade:** P1 alta
- **Status:** Verificação manual necessária
- **Impacto:** Baixa testabilidade
- **Risco de não corrigir:** Bugs no refactor
- **Recomendação:** Extrair service
- **Esforço:** M
- **Arquivo/Linha:** `apps/api/src/controllers`
- **Evidência/Como detectado:** Controller chamando ORM
- **Correção sugerida:** Service layer
- **Testes recomendados:** Testes unitários
