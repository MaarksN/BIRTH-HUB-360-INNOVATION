import { clearStoredSession, fetchWithSession } from "../../../../lib/auth-client";

export const DELETE_CONFIRMATION = "EXCLUIR MINHA CONTA";
export const PRIVACY_REQUEST_TIMEOUT_MS = 10_000;

function withPrivacyTimeout(
  init: RequestInit,
  timeoutMessage: string
): RequestInit & { timeoutMessage: string; timeoutMs: number } {
  return {
    ...init,
    timeoutMessage,
    timeoutMs: PRIVACY_REQUEST_TIMEOUT_MS
  };
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export async function exportPrivacyData(): Promise<{
  blob: Blob;
  fileName: string;
}> {
  const response = await fetchWithSession(
    "/api/v1/privacy/export",
    withPrivacyTimeout(
      {
        method: "GET"
      },
      `Falha ao exportar dados dentro do limite de ${PRIVACY_REQUEST_TIMEOUT_MS}ms.`
    )
  );

  if (!response.ok) {
    throw new Error(`Falha ao exportar dados (${response.status})`);
  }

  const content = await response.text();

  return {
    blob: new Blob([content], { type: "application/json" }),
    fileName: `birthub360-export-${new Date().toISOString().slice(0, 10)}.json`
  };
}

export async function requestPrivacyAccountDeletion(confirmationText: string): Promise<void> {
  const response = await fetchWithSession(
    "/api/v1/privacy/delete-account",
    withPrivacyTimeout(
      {
        body: JSON.stringify({
          confirmationText
        }),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      },
      `Falha ao excluir conta dentro do limite de ${PRIVACY_REQUEST_TIMEOUT_MS}ms.`
    )
  );

  if (!response.ok) {
    throw new Error(`Falha ao excluir conta (${response.status})`);
  }
}

export function clearStoredPrivacySession(): void {
  clearStoredSession();
}
