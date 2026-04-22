import type { WorkflowRuntimeContext } from "../types.js";
export declare function interpolateTemplate(value: string, context: WorkflowRuntimeContext): string;
export declare function interpolateValue<T>(value: T, context: WorkflowRuntimeContext): T;
