export interface TemplateContext {
  tenantId: string;
  industry?: string;
  size?: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  nodes: unknown[];
  edges: unknown[];
  metadata?: Record<string, string>;
}

const templateCatalog: WorkflowTemplate[] = [
  {
    id: 'tpl_billing_01',
    name: 'Standard Billing Retry',
    nodes: [{ id: 'trigger', type: 'TRIGGER_WEBHOOK' }, { id: 'retry', type: 'CONNECTOR_ACTION' }],
    edges: [{ source: 'trigger', target: 'retry' }]
  },
  {
    id: 'tpl_lead_01',
    name: 'Standard Lead Follow-up',
    nodes: [{ id: 'trigger', type: 'TRIGGER_EVENT' }, { id: 'notify', type: 'SEND_NOTIFICATION' }],
    edges: [{ source: 'trigger', target: 'notify' }]
  }
];

/**
 * Adapts a template from the catalog based on tenant context.
 */
export function adaptTemplate(templateId: string, context: TemplateContext): WorkflowTemplate | null {
  const template = templateCatalog.find(t => t.id === templateId);
  if (!template) {
    return null;
  }

  // Idempotent adaptation creating a copy
  const adapted = {
    ...template,
    name: `${template.name} (Adapted for ${context.tenantId})`,
    metadata: {
      adaptedIndustry: context.industry || 'general'
    }
  };

  return adapted;
}

export function getTemplateCatalog(): WorkflowTemplate[] {
  return templateCatalog;
}
