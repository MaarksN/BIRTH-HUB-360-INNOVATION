export type MePayload = {
  plan?: {
    code?: string;
    creditBalanceCents?: number;
    currentPeriodEnd?: string | null;
    isPaid?: boolean;
    name?: string;
    status?: string | null;
  };
};

export type UsagePayload = {
  usage?: Array<{
    metric: string;
    quantity: number;
  }>;
};

export type InvoicesPayload = {
  items?: Array<{
    amountPaidCents: number;
    createdAt: string;
    currency: string;
    hostedInvoiceUrl?: string | null;
    id: string;
    invoicePdfUrl?: string | null;
    status: string;
  }>;
};

export type BudgetPayload = {
  alerts?: Array<{
    level: string;
    message: string;
    timestamp: string;
  }>;
  records?: Array<{
    agentId: string;
    consumed: number;
    limit: number;
  }>;
  usageEvents?: Array<{
    agentId: string;
    costBRL: number;
    executionMode: string;
    timestamp: string;
  }>;
};

export type BudgetEstimatePayload = {
  estimate?: {
    avgCostBRL: number;
    details: string;
  };
};

export type BudgetForm = {
  agentId: string;
  limit: number;
};

export type BudgetPanelProps = {
  budget: BudgetPayload;
  budgetEstimate: BudgetEstimatePayload;
  budgetForm: BudgetForm;
  budgetMessage: string;
  onAgentChange: (agentId: string) => void;
  onExportBudgetCsv: () => void;
  onLimitChange: (limit: number) => void;
  onSaveBudget: () => void;
};

