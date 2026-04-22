import { z } from 'zod';
export declare const LeadSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodString;
    company: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<{
        new: "new";
        contacted: "contacted";
        qualified: "qualified";
        lost: "lost";
    }>>;
}, z.core.$strip>;
export type LeadInput = z.infer<typeof LeadSchema>;
export declare enum QueueName {
    LDR_QUEUE = "ldr-queue",
    SDR_QUEUE = "sdr-queue",
    AE_QUEUE = "ae-queue",
    MARKETING_QUEUE = "marketing-queue",
    FINANCE_QUEUE = "finance-queue",
    FINANCEIRO_QUEUE = "financeiro-queue",
    LEGAL_QUEUE = "legal-queue",
    JURIDICO_QUEUE = "juridico-queue",
    POS_VENDA_QUEUE = "pos-venda-queue",
    ANALISTA_QUEUE = "analista-queue",
    PARTNERS_QUEUE = "partners-queue",
    ENABLEMENT_QUEUE = "enablement-queue",
    PRE_SALES_QUEUE = "pre-sales-queue",
    FIELD_QUEUE = "field-queue",
    SALES_OPS_QUEUE = "sales-ops-queue",
    KAM_QUEUE = "kam-queue",
    BDR_QUEUE = "bdr-queue",
    SOCIAL_QUEUE = "social-queue",
    CLOSER_QUEUE = "closer-queue",
    COPYWRITER_QUEUE = "copywriter-queue",
    ORCHESTRATOR_QUEUE = "orchestrator-queue",
    LEAD_ENRICHMENT = "lead-enrichment",
    DEAL_CLOSED_WON = "deal-closed-won",
    HEALTH_ALERT = "health-alert",
    CHURN_RISK_HIGH = "churn-risk-high",
    HEALTH_SCORE_UPDATE = "health-score-update",
    EMAIL_CADENCE_SEND = "email-cadence-send",
    INVOICE_GENERATE = "invoice-generate",
    NPS_ANALYSIS = "nps-analysis",
    CONTRACT_ANALYSIS = "contract-analysis",
    BANK_RECONCILIATION = "bank-reconciliation",
    COMMISSION_CALC = "commission-calc",
    BOARD_REPORT = "board-report",
    CONTRACT_DEADLINES = "contract-deadlines",
    DOMAIN_WARMUP = "domain-warmup"
}
