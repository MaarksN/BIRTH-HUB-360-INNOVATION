import type { WorkflowRuntimeContext } from "../types.js";
interface CodeNodeConfig {
    source: string;
    timeout_ms?: number;
}
export declare function executeCodeNode(config: CodeNodeConfig, input: unknown, context: WorkflowRuntimeContext): unknown;
export type { CodeNodeConfig };
