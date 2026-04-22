export const canonicalIntegrationDomains = [
  "analytics",
  "automation",
  "calendar",
  "contracts",
  "crm",
  "customer-success",
  "erp",
  "marketing",
  "messaging",
  "payments",
  "prospecting"
] as const;

export type CanonicalIntegrationDomain = (typeof canonicalIntegrationDomains)[number];

export interface CanonicalReference {
  displayName?: string;
  externalId?: string;
  provider?: string;
}

export interface CanonicalCrmRecord {
  companyName?: string;
  customFields?: Record<string, unknown>;
  email?: string;
  name?: string;
  owner?: CanonicalReference;
  phone?: string;
  pipeline?: CanonicalReference;
  recordType: "lead" | "contact" | "company" | "deal" | "activity";
  stage?: CanonicalReference;
  valueCents?: number;
}

export interface CanonicalMarketingCampaign {
  campaignId?: string;
  channel: "email" | "paid_social" | "paid_search" | "organic" | "webinar" | "other";
  customFields?: Record<string, unknown>;
  name: string;
  spendCents?: number;
  status: "draft" | "scheduled" | "active" | "paused" | "completed";
}

export interface CanonicalConversationThread {
  channel:
    | "whatsapp"
    | "email"
    | "chat"
    | "slack"
    | "discord"
    | "teams"
    | "ticket"
    | "other";
  contact?: CanonicalReference;
  externalThreadId?: string;
  metadata?: Record<string, unknown>;
  subject?: string;
  threadId?: string;
}

export interface CanonicalMessage {
  body: string;
  direction: "inbound" | "outbound";
  messageId?: string;
  metadata?: Record<string, unknown>;
  sentAt?: string;
  status?: "queued" | "sent" | "delivered" | "read" | "failed";
  templateName?: string;
  thread: CanonicalConversationThread;
}

export interface CanonicalCalendarEvent {
  attendees?: CanonicalReference[];
  endAt: string;
  eventId?: string;
  location?: string;
  meetingUrl?: string;
  metadata?: Record<string, unknown>;
  organizer?: CanonicalReference;
  startAt: string;
  status?: "tentative" | "confirmed" | "cancelled";
  title: string;
}

export interface CanonicalContractSigner {
  authMethod?: "email" | "sms" | "whatsapp";
  email: string;
  name: string;
  phoneNumber?: string;
  role?: string;
  signedAt?: string;
  status?: "pending" | "sent" | "viewed" | "signed" | "declined";
}

export interface CanonicalContractEnvelope {
  documentId?: string;
  documentName: string;
  metadata?: Record<string, unknown>;
  signers: CanonicalContractSigner[];
  status:
    | "draft"
    | "prepared"
    | "sent"
    | "partially_signed"
    | "completed"
    | "cancelled";
  templateReference?: CanonicalReference;
}

export interface CanonicalPaymentCustomer {
  document?: string;
  email?: string;
  externalCustomerId?: string;
  name: string;
  phone?: string;
}

export interface CanonicalInvoiceLine {
  amountCents: number;
  description: string;
  quantity?: number;
  sku?: string;
}

export interface CanonicalInvoice {
  currency: string;
  customer: CanonicalPaymentCustomer;
  dueAt?: string;
  externalInvoiceId?: string;
  invoiceNumber?: string;
  lines: CanonicalInvoiceLine[];
  metadata?: Record<string, unknown>;
  status: "draft" | "open" | "paid" | "overdue" | "void" | "refunded";
  totalCents: number;
}

export interface CanonicalPaymentEvent {
  amountCents: number;
  eventId?: string;
  eventType:
    | "invoice_created"
    | "invoice_paid"
    | "payment_failed"
    | "subscription_updated"
    | "refund_created"
    | "chargeback_opened";
  metadata?: Record<string, unknown>;
  occurredAt?: string;
  relatedInvoice?: CanonicalReference;
  relatedSubscription?: CanonicalReference;
  status?: "queued" | "processed" | "failed";
}

export interface CanonicalErpDocument {
  customer?: CanonicalReference;
  documentNumber?: string;
  documentType: "invoice" | "service_invoice" | "receivable" | "payable" | "order";
  issuedAt?: string;
  lines?: CanonicalInvoiceLine[];
  metadata?: Record<string, unknown>;
  totalCents?: number;
}

export interface CanonicalAnalyticsEvent {
  anonymousId?: string;
  attributes?: Record<string, unknown>;
  eventName: string;
  occurredAt?: string;
  sessionId?: string;
  userId?: string;
}

export interface CanonicalMetricSnapshot {
  dimensions?: Record<string, string>;
  metricName: string;
  periodEnd?: string;
  periodStart?: string;
  unit?: "count" | "currency" | "percent" | "seconds" | "bytes";
  value: number;
}

export interface CanonicalProspectSnapshot {
  company?: CanonicalReference;
  contact?: CanonicalReference;
  enrichmentProvider?: string;
  fitScore?: number;
  metadata?: Record<string, unknown>;
  signals?: string[];
}

export interface CanonicalCustomerSuccessSnapshot {
  account: CanonicalReference;
  healthScore?: number;
  lifecycleStage?: string;
  metadata?: Record<string, unknown>;
  nextBestAction?: string;
  riskLevel?: "low" | "medium" | "high" | "critical";
}

