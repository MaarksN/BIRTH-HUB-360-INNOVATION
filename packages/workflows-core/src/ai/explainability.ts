export interface AiDecision {
  action: string;
  contextUsed: Record<string, unknown>;
  confidence: number;
}

export interface DecisionExplanation {
  action: string;
  why: string;
  visibleContext: Record<string, unknown>;
  confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

/**
 * Transforms an AI decision into a human-readable explanation, ensuring visibility into the "black box".
 */
export function explainDecision(decision: AiDecision): DecisionExplanation {
  let confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (decision.confidence > 0.8) confidenceLevel = 'HIGH';
  else if (decision.confidence > 0.5) confidenceLevel = 'MEDIUM';

  const contextKeys = Object.keys(decision.contextUsed).join(', ');

  return {
    action: decision.action,
    why: `The action '${decision.action}' was suggested because the following context signals were detected: ${contextKeys}.`,
    visibleContext: decision.contextUsed,
    confidenceLevel
  };
}
