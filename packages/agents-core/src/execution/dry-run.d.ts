import type { AgentManifest } from "../manifest/schema.js";
export interface DryRunResult {
    logs: string[];
    output: string;
    outputHash: string;
}
export declare function computeOutputHash(output: string): string;
export declare function runAgentDryRun(manifest: AgentManifest): Promise<DryRunResult>;
