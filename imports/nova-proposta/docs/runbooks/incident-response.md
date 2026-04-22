# Resposta a Incidentes (Outage, Data Loss, Security Breach)

## Outages e Performance Crítica (P1)
- Acionamento: O Cloud Monitoring sinaliza >5% 5xx errors ou latência do DB >2000ms.
- **Runbook**:
  1. Revise PgBouncer active connections e status de Locks.
  2. Verifique Redis memory eviction policies (se OOM).
  3. Desabilite tarefas assíncronas não-críticas no Worker para aliviar carga.
  4. Redimensione Verticalmente (Scale-up) instâncias na GCP Cloud Run.

## Perda de Dados
- Acionamento: Falha confirmada em DB Master ou Drop acidental.
- **Runbook (Disaster Recovery)**:
  1. Promova Replica para Master (se viável).
  2. Se corrupção lógica: acione `pgBackRest` para o Restore PITR a partir do último WAL viável.
  3. Atualize DNS interno/Secret Manager.

## Violação de Segurança (Security Breach)
- Acionamento: Alertas de MFA bruteforcing, acessos cross-tenant suspeitos em AuditLogs, ou chaves Stripe expostas.
- **Runbook**:
  1. Gire (Rotate) imediatamente os segredos comprometidos.
  2. Invalide globalmente tokens JWT antigos gerando nova salt de assinalamento.
  3. Suspenda instâncias de Agentes potencialmente afetadas para não enviar SPAM/Phishing.
  4. Notifique autoridades (DPO e LGPD Compliance Team).
