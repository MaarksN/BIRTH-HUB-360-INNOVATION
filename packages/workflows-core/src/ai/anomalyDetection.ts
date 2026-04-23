export interface ProviderMetrics {
  provider: string;
  totalRequests: number;
  failedRequests: number;
  averageLatencyMs: number;
}

export interface AnomalyReport {
  isAnomaly: boolean;
  type?: 'DEGRADATION' | 'FAILURE_SPIKE' | 'SUSPICIOUS_WORKFLOW';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
}

export function detectProviderDegradation(metrics: ProviderMetrics): AnomalyReport {
  const failureRate = metrics.failedRequests / Math.max(1, metrics.totalRequests);

  if (failureRate > 0.15 || metrics.averageLatencyMs > 2000) {
    return {
      isAnomaly: true,
      type: 'DEGRADATION',
      severity: failureRate > 0.5 ? 'HIGH' : 'MEDIUM',
      description: `Provider ${metrics.provider} is experiencing degradation (Failure Rate: ${(failureRate*100).toFixed(1)}%, Latency: ${metrics.averageLatencyMs}ms).`
    };
  }

  return { isAnomaly: false, severity: 'LOW', description: 'Provider metrics normal.' };
}

export function detectSuspiciousWorkflow(workflowConfig: unknown): AnomalyReport {
  // Simple heuristic: excessive loops or sending sensitive data unexpectedly
  const config = workflowConfig as { nodes?: unknown[] };
  const nodeCount = Array.isArray(config?.nodes) ? config.nodes.length : 0;

  if (nodeCount > 100) {
    return {
      isAnomaly: true,
      type: 'SUSPICIOUS_WORKFLOW',
      severity: 'HIGH',
      description: 'Workflow has unusually high complexity (too many nodes), which may lead to recursive loops or abuse.'
    };
  }

  return { isAnomaly: false, severity: 'LOW', description: 'Workflow looks normal.' };
}
