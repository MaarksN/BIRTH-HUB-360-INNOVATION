import type { WorkflowRuntimeContext } from "../types.js";
interface TransformerConfig {
    filter?: string | undefined;
    map?: Record<string, unknown> | undefined;
    sourcePath?: string | undefined;
}
export declare function executeTransformerNode(config: TransformerConfig, context: WorkflowRuntimeContext): unknown[];
export type { TransformerConfig };
