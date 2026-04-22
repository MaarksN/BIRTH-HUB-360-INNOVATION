import type { WorkflowRuntimeContext } from "../types.js";
export interface NotificationConfig {
    batchKey?: string | undefined;
    batchWindowMs?: number | undefined;
    channel: "email" | "inapp";
    message: string;
    to: string;
}
export interface NotificationDispatcher {
    send: (message: NotificationConfig) => Promise<void>;
}
export declare function executeNotificationNode(config: NotificationConfig, context: WorkflowRuntimeContext, dispatcher?: NotificationDispatcher): Promise<{
    batched?: boolean;
    batchKey?: string;
    delivered: boolean;
    payload: NotificationConfig;
}>;
