export type CrmProvider = "hubspot" | "salesforce";
export type CrmAction = "create_lead" | "update_lead" | "create_contact";
export interface CrmInput {
    action: CrmAction;
    payload: Record<string, unknown>;
    provider: CrmProvider;
    tenantId: string;
}
export interface CrmResult {
    action: CrmAction;
    endpoint: string;
    provider: CrmProvider;
    status: "ok";
}
export declare function callCrmTool(input: CrmInput, options?: {
    simulate?: boolean;
}): Promise<CrmResult>;
