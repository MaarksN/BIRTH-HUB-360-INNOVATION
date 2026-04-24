# Top 20 Dividas Mais Importantes

Ordenacao por risco real, impacto e urgencia. IDs referenciam o relatorio completo.

| Rank | ID | Severidade | Justificativa de prioridade | Fase |
| ---: | --- | --- | --- | --- |
| 1 | TD-001 | Critico | `.env` e arquivos sealed/env rastreados podem expor credenciais ou material sensivel no historico. | Fase 0 |
| 2 | TD-003 | Critico | Tokens em query string podem vazar por logs, proxies, APM e mensagens de erro. | Fase 0 |
| 3 | TD-002 | Critico | Manifest K8s mistura `Secret.stringData`, placeholder de senha e imagens `:latest`; risco de deploy fragil e nao reprodutivel. | Fase 0 |
| 4 | TD-010 | Alto | Governanca de migrations falha para duas migrations recentes, afetando rastreabilidade de schema. | Fase 2 |
| 5 | TD-020 | Alto | CI chama `pnpm test:isolation` inexistente; gate de isolamento pode estar quebrado. | Fase 1 |
| 6 | TD-004 | Alto | Typecheck global falha, removendo uma garantia basica de integridade. | Fase 3 |
| 7 | TD-013 | Alto | Regra anti-query Prisma sem tenant cobre apenas 10 arquivos, deixando grande superficie sem gate. | Fase 1 |
| 8 | TD-014 | Alto | Webhook Zenvia busca conta por id/provider sem tenant no `where`; precisa provar isolamento. | Fase 1 |
| 9 | TD-015 | Alto | `trustedContext` pula verificacao de assinatura de webhook se rota chamadora nao for rigorosa. | Fase 0 |
| 10 | TD-022 | Alto | Actions sem SHA e `trivy-action@master` elevam risco de supply chain no CI. | Fase 10 |
| 11 | TD-023 | Alto | Semgrep/Gitleaks sao obtidos sem pin/checksum forte, fragilizando os proprios scanners. | Fase 10 |
| 12 | TD-016 | Alto | Webhook receiver faz fetch para API sem timeout; risco operacional sob indisponibilidade. | Fase 7 |
| 13 | TD-031 | Alto | Timeout generico de tool calling nao cancela side effects subjacentes. | Fase 8 |
| 14 | TD-032 | Alto | Falta prova de testes adversariais amplos para prompt injection/exfiltracao. | Fase 8 |
| 15 | TD-011 | Alto | Valores monetarios BRL em `Float` podem causar erro financeiro acumulado. | Fase 2 |
| 16 | TD-012 | Alto | `BillingEvent` e `DatasetExport` permitem escopo nulo, sensivel para tenant/LGPD. | Fase 1 |
| 17 | TD-006 | Alto | Scripts padrao de teste quebram no Windows, reduzindo execucao local. | Fase 4 |
| 18 | TD-008 | Alto | Teste i18n falhando mostra divergencia de copy/contrato no frontend. | Fase 9 |
| 19 | TD-009 | Alto | Testes pulados em consentimento, retencao, FHIR e clinico deixam fluxos sensiveis sem gate. | Fase 4 |
| 20 | TD-021 | Alto | CI tenta cobertura sem script/artefato confiavel; metrica pode ser falsa. | Fase 4 |

## Sugestao de fase de correcao

Fase 0 deve ser feita antes de qualquer refatoracao: segredos, tokens em URL, webhooks e supply-chain de scanners. Depois, estabilizar Fase 1 e Fase 2 para multi-tenancy, RBAC, migrations e dados. Typecheck/testes entram logo em seguida para impedir que a correcao reabra as mesmas feridas.
