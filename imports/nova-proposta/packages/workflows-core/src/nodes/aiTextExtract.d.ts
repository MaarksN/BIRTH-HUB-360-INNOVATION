import type { WorkflowRuntimeContext } from "../types.js";
export interface AiTextExtractConfig {
    fields: string[];
    text: string;
}
export declare function executeAiTextExtractNode(config: AiTextExtractConfig, context: WorkflowRuntimeContext): Record<string, string | null>;
