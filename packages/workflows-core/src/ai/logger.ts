import { createLogger } from '@birthub/logger';
import { maskSensitivePayload } from '../masking.js';

export interface AiLogEntry {
  decisionId: string;
  timestamp: string;
  tenantId: string;
  input: unknown;
  context: unknown;
  decision: unknown;
  confidence: number;
  result: 'APPLIED' | 'REJECTED' | 'PENDING';
}

const logger = createLogger('workflows-core:ai-audit');

/**
 * Logs AI decisions with sensitive data masked for auditing and troubleshooting.
 */
export function logAiDecision(entry: AiLogEntry): void {
  const safeInput = maskSensitivePayload(entry.input);
  const safeContext = maskSensitivePayload(entry.context);
  const safeDecision = maskSensitivePayload(entry.decision);

  const finalLog = {
    ...entry,
    input: safeInput,
    context: safeContext,
    decision: safeDecision
  };

  logger.info({
    type: 'AI_DECISION_AUDIT',
    ...finalLog
  }, `AI Decision Audit [${entry.result}]`);
}
