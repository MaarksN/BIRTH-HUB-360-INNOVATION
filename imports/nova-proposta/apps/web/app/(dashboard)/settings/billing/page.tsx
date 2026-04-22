"use client";

import {
  BillingHero,
  BudgetPanel,
  InvoiceSection,
  PlanSummarySection,
  UsageSection
} from "./billing-sections";
import { useBillingSettings } from "./use-billing-settings";

export default function BillingSettingsPage() {
  const {
    budget,
    budgetEstimate,
    budgetForm,
    budgetMessage,
    currentPlanName,
    currentPlanStatus,
    exportBudgetCsv,
    invoices,
    me,
    setBudgetForm,
    updateBudgetLimit,
    usage,
    usageMax
  } = useBillingSettings();

  return (
    <>
      <BillingHero />
      <PlanSummarySection
        currentPlanName={currentPlanName}
        currentPlanStatus={currentPlanStatus}
        me={me}
      />
      <UsageSection usage={usage} usageMax={usageMax} />
      <InvoiceSection invoices={invoices} />
      <BudgetPanel
        budget={budget}
        budgetEstimate={budgetEstimate}
        budgetForm={budgetForm}
        budgetMessage={budgetMessage}
        onAgentChange={(agentId) => setBudgetForm((current) => ({ ...current, agentId }))}
        onExportBudgetCsv={() => void exportBudgetCsv()}
        onLimitChange={(limit) => setBudgetForm((current) => ({ ...current, limit }))}
        onSaveBudget={() => void updateBudgetLimit()}
      />
    </>
  );
}

