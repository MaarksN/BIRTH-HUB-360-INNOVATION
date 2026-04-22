import { type AgentExecutor } from "./agentExecute.js";
import { type HandoffExecutor } from "./agentHandoff.js";
import { type ConnectorExecutor } from "./connectorAction.js";
import { type NotificationDispatcher } from "./notification.js";
import type { StepDefinition } from "../schemas/step.schema.js";
import type { WorkflowRuntimeContext } from "../types.js";
export interface StepExecutionDependencies {
    agentExecutor?: AgentExecutor;
    connectorExecutor?: ConnectorExecutor;
    handoffExecutor?: HandoffExecutor;
    notificationDispatcher?: NotificationDispatcher;
    httpRequestRateLimiter?: {
        consume: (key: string, limit: number, windowSeconds: number) => Promise<void>;
    };
}
export declare function executeStep(step: StepDefinition, context: WorkflowRuntimeContext, dependencies?: StepExecutionDependencies): Promise<unknown>;
