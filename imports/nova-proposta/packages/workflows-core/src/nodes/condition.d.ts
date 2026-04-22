import type { WorkflowRuntimeContext } from "../types.js";
interface ConditionNodeConfig {
    operator: "!=" | "<" | "<=" | "==" | ">" | ">=";
    path: string;
    value: boolean | number | string;
}
export declare function executeConditionNode(config: ConditionNodeConfig, context: WorkflowRuntimeContext): {
    expected: boolean | number | string;
    operator: ConditionNodeConfig["operator"];
    result: boolean;
    value: unknown;
};
export type { ConditionNodeConfig };
