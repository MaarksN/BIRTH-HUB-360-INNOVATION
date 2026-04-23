export interface WorkflowSuggestionContext {
  events: string[];
  activeConnectors: string[];
}

export interface WorkflowSuggestion {
  id: string;
  name: string;
  description: string;
  confidence: number;
}

/**
 * Suggests workflows based on events and active connectors.
 */
export function suggestWorkflows(context: WorkflowSuggestionContext): WorkflowSuggestion[] {
  const suggestions: WorkflowSuggestion[] = [];

  if (context.events.includes('payment_failed') && context.activeConnectors.includes('stripe')) {
    suggestions.push({
      id: 'billing_recovery',
      name: 'Billing Recovery Flow',
      description: 'Automatically retry failed payments and notify customers via Stripe.',
      confidence: 0.95
    });
  }

  if (context.events.includes('lead_created') && context.activeConnectors.includes('salesforce')) {
    suggestions.push({
      id: 'lead_follow_up',
      name: 'Lead Follow-up Sequence',
      description: 'Sync lead to Salesforce and assign to an SDR.',
      confidence: 0.9
    });
  }

  return suggestions;
}

export interface FieldEnrichmentContext {
  fields: Record<string, unknown>;
}

export interface FieldSuggestion {
  field: string;
  suggestedAction: string;
  confidence: number;
}

/**
 * Suggests fields, transformations, and next actions for auto-enrichment.
 */
export function suggestEnrichment(context: FieldEnrichmentContext): FieldSuggestion[] {
  const suggestions: FieldSuggestion[] = [];

  if (context.fields['email'] && !context.fields['company']) {
    suggestions.push({
      field: 'company',
      suggestedAction: 'Extract company domain from email address',
      confidence: 0.85
    });
  }

  return suggestions;
}
