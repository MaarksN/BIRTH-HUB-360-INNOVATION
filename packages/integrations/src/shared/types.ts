export type ConnectorProvider =
  | "whatsapp-business-api"
  | "zendesk"
  | "take-blip"
  | "rd-station-crm"
  | "agendor"
  | "asaas"
  | "vindi"
  | "iugu"
  | "mercado-pago"
  | "pagseguro"
  | "conta-azul"
  | "sankhya"
  | "bling"
  | "tiny"
  | "rd-station-marketing"
  | "activecampaign"
  | "linkedin-ads"
  | "sensedata"
  | "intercom"
  | "zapsign"
  | "autentique"
  | "docusign"
  | "econodata"
  | "neoway"
  | "apollo-io"
  | "ga4"
  | "power-bi"
  | "metabase"
  | "make"
  | "zapier"
  | "n8n";

export type ExecutionStatus =
  | "success"
  | "retryable_error"
  | "fatal_error"
  | "duplicate";

export interface ConnectorCredentials {
  provider: ConnectorProvider;
  tenantId: string;
  secrets: Record<string, string | undefined>;
  metadata?: Record<string, unknown>;
}

export interface IdempotencyStore {
  claim?(
    key: string,
    value?: Record<string, unknown>,
    options?: { ttlSeconds?: number },
  ): Promise<boolean>;
  has(key: string): Promise<boolean>;
  put(
    key: string,
    value?: Record<string, unknown>,
    options?: { ttlSeconds?: number },
  ): Promise<void>;
}

export interface ExecutionLogger {
  log(entry: ExecutionLogEntry): Promise<void>;
}

export interface ExecutionLogEntry {
  tenantId: string;
  provider: ConnectorProvider;
  action: string;
  eventId: string;
  externalEventId?: string;
  status: ExecutionStatus;
  durationMs: number;
  error?: { code: string; message: string; retryable: boolean };
  result?: Record<string, unknown>;
}

export interface ConnectorExecutionContext {
  tenantId: string;
  provider: ConnectorProvider;
  action: string;
  eventId: string;
  externalEventId?: string;
  credentials: ConnectorCredentials;
  payload: Record<string, unknown>;
  idempotencyStore?: IdempotencyStore;
  executionLogger?: ExecutionLogger;
}

export interface ConnectorResult {
  ok: boolean;
  status: ExecutionStatus;
  provider: ConnectorProvider;
  action: string;
  eventId: string;
  externalEventId?: string;
  result?: Record<string, unknown>;
}
