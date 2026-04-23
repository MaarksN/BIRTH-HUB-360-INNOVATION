import { WorkflowTemplate } from './templates.js';

export interface CopilotResponse {
  intent: string;
  confidence: number;
  suggestedTemplateId?: string;
  generatedWorkflow?: WorkflowTemplate;
  explanation: string;
}

/**
 * Acts as an AI Copilot to interpret prompts and map them to workflow templates or generation.
 * "crie um fluxo de cobrança", "crie um fluxo de follow-up de lead"
 */
export function generateWorkflowFromPrompt(prompt: string): CopilotResponse {
  const normalizedPrompt = prompt.toLowerCase();

  if (normalizedPrompt.includes('cobrança') || normalizedPrompt.includes('billing')) {
    return {
      intent: 'billing_workflow',
      confidence: 0.9,
      suggestedTemplateId: 'tpl_billing_01',
      explanation: 'Identified request for a billing or collections workflow.'
    };
  }

  if (normalizedPrompt.includes('lead') || normalizedPrompt.includes('follow-up')) {
    return {
      intent: 'lead_follow_up',
      confidence: 0.88,
      suggestedTemplateId: 'tpl_lead_01',
      explanation: 'Identified request for a lead follow-up workflow.'
    };
  }

  return {
    intent: 'unknown',
    confidence: 0.1,
    explanation: 'Could not confidently match the prompt to a known workflow pattern.'
  };
}
