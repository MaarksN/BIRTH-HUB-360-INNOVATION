# Dívidas de Supply Chain


### [TD-114] DÍVIDAS DE SUPPLY CHAIN E INTEGRIDADE DE DEPENDÊNCIAS: Dependências vulneráveis
- **Severidade:** ALTO
- **Prioridade:** P1 alta
- **Status:** Suspeita forte
- **Impacto:** CVEs em produção
- **Risco de não corrigir:** Ataque RCE
- **Recomendação:** Atualizar dependências
- **Esforço:** M
- **Arquivo/Linha:** `package.json`
- **Evidência/Como detectado:** pnpm audit
- **Correção sugerida:** pnpm up
- **Testes recomendados:** Testes E2E
