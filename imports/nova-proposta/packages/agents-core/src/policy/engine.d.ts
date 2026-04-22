export type PolicyEffect = "allow" | "deny";
export type PolicyTemplateName = "admin" | "readonly" | "standard";
export interface PolicyRule {
    id: string;
    action: string;
    effect: PolicyEffect;
    enabled?: boolean;
    reason?: string;
    agentId?: string | null;
    tenantId?: string | null;
}
export interface PolicyEvaluationResult {
    granted: boolean;
    reason: string;
    matchedRuleId?: string;
}
export interface PolicyContext {
    tenantId?: string | null;
    metadata?: Record<string, unknown>;
}
export declare class PolicyDeniedError extends Error {
    readonly code = "POLICY_DENIED";
    constructor(message: string);
}
export declare class PolicyEngine {
    private rules;
    constructor(initialRules?: PolicyRule[]);
    setRules(rules: PolicyRule[]): void;
    getRules(): PolicyRule[];
    addRule(rule: PolicyRule): void;
    evaluate(agentId: string, action: string, context?: PolicyContext): PolicyEvaluationResult;
}
export declare function createPolicyTemplate(template: PolicyTemplateName, tenantId: string, agentId: string): PolicyRule[];
export interface ManagedPolicy extends PolicyRule {
    name: string;
}
export declare class InMemoryPolicyAdminStore {
    private readonly policies;
    list(tenantId: string, agentId: string): ManagedPolicy[];
    upsert(policy: ManagedPolicy): ManagedPolicy;
    toggle(policyId: string, enabled: boolean): ManagedPolicy | null;
}
