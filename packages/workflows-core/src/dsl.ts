import { z } from "zod";

import { WORKFLOW_CONNECTOR_ACTIONS } from "./catalog/connectorActions.js";
import { workflowCanvasSchema, type WorkflowCanvas } from "./schemas/step.schema.js";

export const WORKFLOW_EVENT_TOPICS = [
  "lead.created",
  "payment.succeeded",
  "message.received",
  "contract.signed",
  "crm.contact.updated"
] as const;

const workflowDslStepSchema = z.object({
  action: z.enum(WORKFLOW_CONNECTOR_ACTIONS),
  config: z.record(z.string(), z.unknown()).default({}),
  key: z.string().min(1),
  name: z.string().min(1)
}).strict();

export const workflowDslSchema = z.object({
  steps: z.array(workflowDslStepSchema).max(100),
  trigger: z.object({
    eventTopic: z.enum(WORKFLOW_EVENT_TOPICS),
    triggerKey: z.string().min(1)
  }).strict()
}).strict();

export type WorkflowDsl = z.infer<typeof workflowDslSchema>;

export function compileDslToCanvas(dsl: WorkflowDsl): WorkflowCanvas {
  const triggerKey = dsl.trigger.triggerKey;
  const steps = [
    {
      config: { topic: dsl.trigger.eventTopic },
      isTrigger: true as const,
      key: triggerKey,
      name: `Trigger ${dsl.trigger.eventTopic}`,
      type: "TRIGGER_EVENT" as const
    },
    ...dsl.steps.map((step) => ({
      config: {
        action: step.action,
        payload: step.config
      },
      key: step.key,
      name: step.name,
      type: "CONNECTOR_ACTION" as const
    }))
  ];

  const transitions: Array<{ route: "ALWAYS"; source: string; target: string }> = [];
  for (let index = 0; index < steps.length - 1; index += 1) {
    const source = steps[index];
    const target = steps[index + 1];
    if (!source || !target) {
      continue;
    }

    transitions.push({
      route: "ALWAYS",
      source: source.key,
      target: target.key
    });
  }

  return workflowCanvasSchema.parse({
    steps,
    transitions
  });
}
