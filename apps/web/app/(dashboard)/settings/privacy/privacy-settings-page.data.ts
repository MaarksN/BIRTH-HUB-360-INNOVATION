import { clearStoredSession, fetchWithSession } from "../../../../lib/auth-client";

export const DELETE_CONFIRMATION = "EXCLUIR MINHA CONTA";
export const PRIVACY_REQUEST_TIMEOUT_MS = 10_000;

export type ConsentPurpose = "ANALYTICS" | "HEALTH_DATA_SHARING" | "MARKETING";
export type ConsentSource = "API" | "BANNER" | "SETTINGS";
export type ConsentStatus = "GRANTED" | "PENDING" | "REVOKED";
export type RetentionAction = "ANONYMIZE" | "DELETE";
export type RetentionDataCategory =
  | "LOGIN_ALERTS"
  | "MFA_CHALLENGES"
  | "MFA_RECOVERY_CODES"
  | "OUTPUT_ARTIFACTS"
  | "SUSPENDED_USERS";
export type RetentionExecutionMode = "AUTOMATED" | "DRY_RUN" | "MANUAL";

export type PrivacyConsent = {
  grantedAt: string | null;
  id: string;
  lastChangedAt: string;
  lawfulBasis: string;
  purpose: ConsentPurpose;
  revokedAt: string | null;
  source: ConsentSource;
  status: ConsentStatus;
};

export type PrivacyConsentEvent = {
  createdAt: string;
  id: string;
  newStatus: ConsentStatus;
  previousStatus: ConsentStatus | null;
  purpose: ConsentPurpose;
  source: ConsentSource;
};

export type PrivacyConsentPreferences = {
  cookieConsent: "ACCEPTED" | "PENDING" | "REJECTED";
  emailNotifications: boolean;
  inAppNotifications: boolean;
  lgpdConsentedAt: string | null;
  lgpdConsentStatus: "ACCEPTED" | "PENDING" | "REJECTED";
  lgpdConsentVersion: string;
  lgpdLegalBasis:
    | "CONSENT"
    | "CONTRACT"
    | "HEALTH_PROTECTION"
    | "LEGAL_OBLIGATION"
    | "LEGITIMATE_INTEREST";
  marketingEmails: boolean;
  pushNotifications: boolean;
};

export type RetentionPolicy = {
  action: RetentionAction;
  createdAt: string;
  dataCategory: RetentionDataCategory;
  enabled: boolean;
  id: string;
  legalBasis: string;
  retentionDays: number;
  updatedAt: string;
};

export type RetentionExecution = {
  action: RetentionAction;
  affectedCount: number;
  createdAt: string;
  dataCategory: RetentionDataCategory;
  id: string;
  mode: RetentionExecutionMode;
  scannedCount: number;
};

export type RetentionRunResult = {
  affectedCount: number;
  dataCategory: RetentionDataCategory;
  executionId: string;
  scannedCount: number;
};

export type PrivacyStateSnapshot = {
  consentHistory: PrivacyConsentEvent[];
  consentPreferences: PrivacyConsentPreferences | null;
  consents: PrivacyConsent[];
  retentionAccessDenied: boolean;
  retentionExecutions: RetentionExecution[];
  retentionPolicies: RetentionPolicy[];
};

export const consentCopy: Record<
  ConsentPurpose,
  {
    description: string;
    title: string;
  }
> = {
  ANALYTICS: {
    description: "Telemetria sem PII para produto, performance e qualidade operacional.",
    title: "Analytics e telemetria"
  },
  HEALTH_DATA_SHARING: {
    description: "Compartilhamento controlado de dados operacionais para integracoes e interoperabilidade.",
    title: "Compartilhamento de dados operacionais"
  },
  MARKETING: {
    description: "Comunicacoes promocionais, novidades do produto e convites comerciais.",
    title: "Marketing e campanhas"
  }
};

export const retentionCopy: Record<RetentionDataCategory, string> = {
  LOGIN_ALERTS: "Alertas de novo dispositivo e sinais de acesso suspeito.",
  MFA_CHALLENGES: "Desafios temporarios de MFA usados no login.",
  MFA_RECOVERY_CODES: "Codigos de recuperacao de MFA ja usados ou expirados.",
  OUTPUT_ARTIFACTS: "Artefatos gerados por automacoes, execucoes e relatorios.",
  SUSPENDED_USERS: "Contas suspensas elegiveis para anonimizacao posterior."
};

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

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "Nao registrado";
  }

  return new Date(value).toLocaleString("pt-BR");
}

export function formatConsentStatus(status: ConsentStatus): string {
  switch (status) {
    case "GRANTED":
      return "Concedido";
    case "REVOKED":
      return "Revogado";
    default:
      return "Pendente";
  }
}

export function formatRetentionAction(action: RetentionAction): string {
  return action === "ANONYMIZE" ? "Anonimizar" : "Excluir";
}

export function formatExecutionMode(mode: RetentionExecutionMode): string {
  switch (mode) {
    case "AUTOMATED":
      return "Automatizado";
    case "DRY_RUN":
      return "Dry-run";
    default:
      return "Manual";
  }
}

export async function loadPrivacyState(): Promise<PrivacyStateSnapshot> {
  const [consentResponse, retentionResponse] = await Promise.all([
    fetchWithSession(
      "/api/v1/privacy/consents",
      withPrivacyTimeout(
        {
          cache: "no-store"
        },
        `Falha ao carregar consentimentos dentro do limite de ${PRIVACY_REQUEST_TIMEOUT_MS}ms.`
      )
    ),
    fetchWithSession(
      "/api/v1/privacy/retention",
      withPrivacyTimeout(
        {
          cache: "no-store"
        },
        `Falha ao carregar retencao dentro do limite de ${PRIVACY_REQUEST_TIMEOUT_MS}ms.`
      )
    )
  ]);

  if (!consentResponse.ok) {
    throw new Error(`Falha ao carregar consentimentos (${consentResponse.status}).`);
  }

  const consentPayload = await parseJson<{
    history?: PrivacyConsentEvent[];
    items?: PrivacyConsent[];
    preferences?: PrivacyConsentPreferences;
  }>(consentResponse);

  let retentionPolicies: RetentionPolicy[] = [];
  let retentionExecutions: RetentionExecution[] = [];
  let retentionAccessDenied = false;

  if (retentionResponse.ok) {
    const retentionPayload = await parseJson<{
      executions?: RetentionExecution[];
      items?: RetentionPolicy[];
    }>(retentionResponse);

    retentionPolicies = retentionPayload.items ?? [];
    retentionExecutions = retentionPayload.executions ?? [];
  } else if (retentionResponse.status === 401 || retentionResponse.status === 403) {
    retentionAccessDenied = true;
  } else {
    throw new Error(`Falha ao carregar retencao (${retentionResponse.status}).`);
  }

  return {
    consentHistory: consentPayload.history ?? [],
    consentPreferences: consentPayload.preferences ?? null,
    consents: consentPayload.items ?? [],
    retentionAccessDenied,
    retentionExecutions,
    retentionPolicies
  };
}

export async function persistPrivacyConsents(consents: PrivacyConsent[]): Promise<void> {
  const response = await fetchWithSession(
    "/api/v1/privacy/consents",
    withPrivacyTimeout(
      {
        body: JSON.stringify({
          decisions: consents.map((item) => ({
            purpose: item.purpose,
            source: "SETTINGS",
            status: item.status
          }))
        }),
        headers: {
          "content-type": "application/json"
        },
        method: "PUT"
      },
      `Falha ao salvar consentimentos dentro do limite de ${PRIVACY_REQUEST_TIMEOUT_MS}ms.`
    )
  );

  if (!response.ok) {
    throw new Error(`Falha ao salvar consentimentos (${response.status}).`);
  }
}

export async function persistRetentionPolicies(policies: RetentionPolicy[]): Promise<void> {
  const response = await fetchWithSession(
    "/api/v1/privacy/retention",
    withPrivacyTimeout(
      {
        body: JSON.stringify({
          policies: policies.map((policy) => ({
            action: policy.action,
            dataCategory: policy.dataCategory,
            enabled: policy.enabled,
            retentionDays: policy.retentionDays
          }))
        }),
        headers: {
          "content-type": "application/json"
        },
        method: "PUT"
      },
      `Falha ao salvar retencao dentro do limite de ${PRIVACY_REQUEST_TIMEOUT_MS}ms.`
    )
  );

  if (!response.ok) {
    throw new Error(`Falha ao salvar retencao (${response.status}).`);
  }
}

export async function executeRetentionRun(
  mode: "DRY_RUN" | "MANUAL"
): Promise<RetentionRunResult[]> {
  const response = await fetchWithSession(
    "/api/v1/privacy/retention/run",
    withPrivacyTimeout(
      {
        body: JSON.stringify({
          mode
        }),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      },
      `Falha ao executar retencao dentro do limite de ${PRIVACY_REQUEST_TIMEOUT_MS}ms.`
    )
  );

  if (!response.ok) {
    throw new Error(`Falha ao executar retencao (${response.status}).`);
  }

  const payload = await parseJson<{
    items?: RetentionRunResult[];
  }>(response);

  return payload.items ?? [];
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
