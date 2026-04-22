# PII, Retenção e Anonimização (LGPD/CCPA baseline)

Este documento define o baseline operacional de privacidade da Fase 2 para operação multi-tenant do BirthHub, sem ampliar escopo de produto.

## Objetivo

- reduzir exposição de dados pessoais (PII) em logs, auditoria e integrações
- definir retenção mínima por categoria de dado
- padronizar anonimização após janela de retenção
- preparar base para evolução de controles LGPD/CCPA

## Classificação prática de dados

- **Identificadores diretos**: e-mail, telefone, documento, nome completo, endereço.
- **Identificadores indiretos**: IP, user-agent, IDs externos de provider, metadados de sessão.
- **Dados sensíveis operacionais**: tokens, segredos, chaves de API, refresh tokens, webhook secrets.
- **Eventos operacionais/auditoria**: ação administrativa, status de execução, falhas técnicas.

## Política mínima de retenção

- **Audit logs administrativos**: 365 dias.
- **Eventos operacionais de baixo risco**: 90 dias.
- **Telemetria técnica agregada (sem PII direta)**: 365 dias.
- **Segredos e credenciais de provider**: retenção enquanto vínculo ativo + janela curta de rotação/revogação.

> Qualquer obrigação legal/contratual que exija prazo maior prevalece sobre este baseline.

## Regras obrigatórias de minimização

- logs e auditoria devem preferir `tenantId`, `userId`, `entityId` e status ao invés de payload bruto.
- não persistir tokens, segredos, cookies, authorization headers ou assinaturas em texto claro.
- respostas administrativas com material sensível devem retornar apenas identificadores e metadados seguros para trilha de auditoria.
- exports/deleções de dados pessoais devem registrar o evento, sem duplicar conteúdo exportado/deletado no audit log.

## Estratégia de anonimização

Ao atingir retenção, aplicar uma destas estratégias conforme categoria:

- **pseudonimização irreversível** para identificadores diretos (hash com salt rotacionável por ambiente).
- **remoção completa** para dados sem necessidade operacional pós-prazo.
- **agregação estatística** para métricas históricas, quando possível.

Critérios:

- preservar capacidade mínima de investigação de segurança.
- impedir reidentificação por junção simples de campos remanescentes.

## Controles já aplicados nesta fase

- envelope de auditoria com redaction centralizada de chaves sensíveis.
- segregação por tenant em operações de domínio e credenciais por provider.
- validação estrita de DTOs para reduzir mass assignment e ingestão indevida de PII.

## Próximos passos (fora de escopo imediato)

- política automática de purge/anonimização por tabela com scheduler dedicado.
- runbook de resposta a DSR (acesso, correção, exclusão e portabilidade).
- trilha de evidências para auditoria formal LGPD/CCPA/SOC2.
