export interface AiAction {
  type: string;
  target: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface GovernancePolicy {
  tenantId: string;
  allowAutomaticHighImpact: boolean;
  requireExplicitConfirmationFor: string[];
}

export interface GovernanceResult {
  mode: 'ASSISTED' | 'AUTOMATIC';
  requiresConfirmation: boolean;
  reason: string;
}

/**
 * Evaluates an AI suggested action against tenant governance policies.
 * Determines if the action can run automatically or must wait in 'assisted' mode.
 */
export function evaluateActionRisk(action: AiAction, policy: GovernancePolicy): GovernanceResult {
  if (action.impact === 'HIGH' && !policy.allowAutomaticHighImpact) {
    return {
      mode: 'ASSISTED',
      requiresConfirmation: true,
      reason: 'High impact actions require explicit confirmation by tenant policy.'
    };
  }

  if (policy.requireExplicitConfirmationFor.includes(action.type)) {
    return {
      mode: 'ASSISTED',
      requiresConfirmation: true,
      reason: `Action type '${action.type}' is explicitly flagged to require confirmation.`
    };
  }

  return {
    mode: 'AUTOMATIC',
    requiresConfirmation: false,
    reason: 'Action meets criteria for automatic execution.'
  };
}
