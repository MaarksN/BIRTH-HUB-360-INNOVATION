import { useEffect, useMemo, useState } from "react";

import { fetchWithSession } from "../../../../lib/auth-client";
import type {
  BudgetEstimatePayload,
  BudgetForm,
  BudgetPayload,
  InvoicesPayload,
  MePayload,
  UsagePayload
} from "./billing.types";

export function useBillingSettings() {
  const [me, setMe] = useState<MePayload | null>(null);
  const [usage, setUsage] = useState<UsagePayload>({ usage: [] });
  const [invoices, setInvoices] = useState<InvoicesPayload>({ items: [] });
  const [budget, setBudget] = useState<BudgetPayload>({ alerts: [], records: [], usageEvents: [] });
  const [budgetEstimate, setBudgetEstimate] = useState<BudgetEstimatePayload>({});
  const [budgetForm, setBudgetForm] = useState<BudgetForm>({
    agentId: "ceo-pack",
    limit: 100
  });
  const [budgetMessage, setBudgetMessage] = useState("");

  async function refreshBudget(agentId = budgetForm.agentId): Promise<void> {
    const [budgetResponse, estimateResponse] = await Promise.all([
      fetchWithSession("/api/v1/budgets/usage"),
      fetchWithSession(`/api/v1/budgets/estimate?agentId=${encodeURIComponent(agentId)}`)
    ]);

    if (budgetResponse.ok) {
      setBudget((await budgetResponse.json()) as BudgetPayload);
    }

    if (estimateResponse.ok) {
      setBudgetEstimate((await estimateResponse.json()) as BudgetEstimatePayload);
    }
  }

  useEffect(() => {
    void Promise.all([
      fetchWithSession("/api/v1/me"),
      fetchWithSession("/api/v1/billing/usage"),
      fetchWithSession("/api/v1/billing/invoices")
    ])
      .then(async ([meResponse, usageResponse, invoiceResponse]) => {
        if (meResponse.ok) {
          setMe((await meResponse.json()) as MePayload);
        }
        if (usageResponse.ok) {
          setUsage((await usageResponse.json()) as UsagePayload);
        }
        if (invoiceResponse.ok) {
          setInvoices((await invoiceResponse.json()) as InvoicesPayload);
        }
      })
      .catch(() => undefined);

    void refreshBudget().catch(() => undefined);
  }, []);

  const usageMax = useMemo(() => {
    const values = (usage.usage ?? []).map((item) => item.quantity);
    return Math.max(1, ...values);
  }, [usage.usage]);

  const currentPlanStatus = me?.plan?.status ?? null;
  const currentPlanName = me?.plan?.name ?? "Starter";

  async function updateBudgetLimit(): Promise<void> {
    const response = await fetchWithSession("/api/v1/budgets/limits", {
      body: JSON.stringify({
        agentId: budgetForm.agentId,
        limit: Number(budgetForm.limit)
      }),
      headers: {
        "content-type": "application/json"
      },
      method: "POST"
    });

    setBudgetMessage(response.ok ? "Limite atualizado com sucesso." : `Falha ao salvar limite (${response.status}).`);

    if (response.ok) {
      await refreshBudget();
    }
  }

  async function exportBudgetCsv(): Promise<void> {
    const response = await fetchWithSession("/api/v1/budgets/export.csv");

    if (!response.ok) {
      setBudgetMessage(`Falha ao exportar CSV (${response.status}).`);
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "budget-usage.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    setBudgetMessage("CSV exportado com sucesso.");
  }

  return {
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
  };
}

