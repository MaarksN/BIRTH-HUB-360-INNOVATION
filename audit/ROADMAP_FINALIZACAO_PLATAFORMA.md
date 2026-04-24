# ROADMAP DE FINALIZAÇÃO DA PLATAFORMA

## 1. Objetivo do Roadmap
Remover bloqueadores técnicos reais e entregar condição auditável de go-live.

## 2. Princípios de Execução
- Zero ilusão técnica.
- Evidência por arquivo/comando.
- Prioridade por risco operacional real.

## 3. Estado Atual
- Build/lint/typecheck: verde.
- Testes críticos: ainda com falha relevante (RLS).
- Checklist de banco: drift detectado.

## 4. Estado Alvo
- Isolamento tenant comprovado e automatizado.
- Schema sem drift no pós-migração.
- Sessão auth durável pós-restart.
- Observabilidade e documentação convergentes.

## 5. Fases de Finalização
### Fase 1
- Corrigir RLS cross-tenant e estabilizar teste de isolamento.

### Fase 2
- Resolver drift de schema até checklist pós-migração passar.

### Fase 3
- Migrar refresh store para persistência distribuída.

### Fase 4
- Harmonizar política de DLQ entre documentação e alert rules.

### Fase 5
- Revalidar fluxos críticos (auth, workflow, billing) em ambiente com serviços reais.

## 6. Dependências Cruzadas
- Fase 5 depende totalmente das Fases 1-3.
- Go-live depende de convergência Fase 4.

## 7. Top Bloqueadores
- TD-001, TD-002, TD-003, TD-009.

## 8. Ordem Recomendada de Execução
1. RLS
2. Schema drift
3. Sessão persistente
4. Observabilidade/documentação
5. Revalidação full

## 9. Critérios de Go-Live
- Teste de isolamento tenant passando.
- `check-schema-drift` passando.
- Sessão auth persistente sob restart.
- Full suite crítica verde.

## 10. Parecer Final
Até a resolução dos bloqueadores listados, o go-live deve permanecer bloqueado.
