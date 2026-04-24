# Dívidas de Infraestrutura, DevEx e Release


### [TD-119] DÍVIDAS DE BACKUP, ROLLBACK E RECUPERAÇÃO: Falta de documentação de rollback
- **Severidade:** MÉDIO
- **Prioridade:** P2 média
- **Status:** Confirmado por evidência
- **Impacto:** Demora no incidente
- **Risco de não corrigir:** Downtime
- **Recomendação:** Escrever runbook
- **Esforço:** P
- **Arquivo/Linha:** `docs/`
- **Evidência/Como detectado:** README não cobre
- **Correção sugerida:** Doc
- **Testes recomendados:** N/A

### [TD-120] DÍVIDAS DE INFRAESTRUTURA E AMBIENTE: Falta de limites de container
- **Severidade:** MÉDIO
- **Prioridade:** P2 média
- **Status:** Verificação manual necessária
- **Impacto:** OOMKills
- **Risco de não corrigir:** Queda
- **Recomendação:** Definir mem_limit
- **Esforço:** P
- **Arquivo/Linha:** `docker-compose.yml`
- **Evidência/Como detectado:** docker-compose
- **Correção sugerida:** Limites no compose
- **Testes recomendados:** N/A

### [TD-121] DÍVIDAS DE VERSIONAMENTO, RELEASE E COMPATIBILIDADE: Falta de changelog automatizado
- **Severidade:** BAIXO
- **Prioridade:** P3 baixa
- **Status:** Verificação manual necessária
- **Impacto:** Comunicação ruim
- **Risco de não corrigir:** Quebras não mapeadas
- **Recomendação:** Usar changesets
- **Esforço:** P
- **Arquivo/Linha:** `CHANGELOG.md`
- **Evidência/Como detectado:** N/A
- **Correção sugerida:** Setup changesets
- **Testes recomendados:** N/A

### [TD-122] DÍVIDAS DE EXPERIÊNCIA DE DESENVOLVEDOR: Scripts inconsistentes
- **Severidade:** BAIXO
- **Prioridade:** P3 baixa
- **Status:** Confirmado por evidência
- **Impacto:** Curva de aprendizado
- **Risco de não corrigir:** Perda de tempo
- **Recomendação:** Unificar via turbo
- **Esforço:** M
- **Arquivo/Linha:** `package.json`
- **Evidência/Como detectado:** package.json complexo
- **Correção sugerida:** Mover scripts
- **Testes recomendados:** N/A
