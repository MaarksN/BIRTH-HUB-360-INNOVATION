import { fetchWithSession } from "./auth-client";

const MARKETPLACE_MUTATION_TIMEOUT_MS = 8_000;

export async function approveOutput(outputId: string) {
  const response = await fetchWithSession(`/api/v1/outputs/${encodeURIComponent(outputId)}/approve`, {
    method: "POST",
    timeoutMessage: `Falha ao aprovar output dentro do limite de ${MARKETPLACE_MUTATION_TIMEOUT_MS}ms.`,
    timeoutMs: MARKETPLACE_MUTATION_TIMEOUT_MS
  });

  if (!response.ok) {
    throw new Error(`Failed to approve ${outputId}: ${response.status}`);
  }

  return (await response.json()) as {
    output: {
      approvedAt: string | null;
      approvedByUserId: string | null;
      id: string;
      status: string;
    };
  };
}

