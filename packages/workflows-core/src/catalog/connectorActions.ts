export const WORKFLOW_CONNECTOR_ACTIONS = [
  "slack.message.send",
  "zenvia.message.send",
  "hubspot.crm.contact.upsert",
  "hubspot.crm.company.upsert",
  "omie.erp.customer.upsert",
  "omie.erp.sales-order.create",
  "stripe.payment.read"
] as const;

export type WorkflowConnectorAction = (typeof WORKFLOW_CONNECTOR_ACTIONS)[number];
