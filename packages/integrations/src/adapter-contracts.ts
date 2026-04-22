/**
 * Integration adapter boundary contracts
 * Standardizes how external integrations are plugged into BirthHub
 */

/**
 * Base contract for any external service adapter
 */
export interface ExternalServiceAdapter<Config = unknown> {
  readonly name: string;
  readonly version: string;
  initialize(config: Config): Promise<void>;
  shutdown(): Promise<void>;
  healthcheck(): Promise<boolean>;
}

/**
 * CRM Adapter contract
 */
export interface CrmAdapter extends ExternalServiceAdapter {
  createContact(data: CrmContactData): Promise<CrmContact>;
  updateContact(id: string, data: Partial<CrmContactData>): Promise<CrmContact>;
  deleteContact(id: string): Promise<void>;
  getContact(id: string): Promise<CrmContact | null>;
  listContacts(filter?: CrmContactFilter): Promise<CrmContact[]>;
  syncContacts(since?: Date): Promise<SyncResult>;
}

export interface CrmContact {
  id: string;
  email: string;
  name: string;
  phone?: string;
  externalId: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface CrmContactData {
  email: string;
  name: string;
  phone?: string;
  metadata?: Record<string, unknown>;
}

export interface CrmContactFilter {
  email?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  limit?: number;
  offset?: number;
}

/**
 * ERP Adapter contract
 */
export interface ErpAdapter extends ExternalServiceAdapter {
  createProduct(data: ErpProductData): Promise<ErpProduct>;
  updateProduct(id: string, data: Partial<ErpProductData>): Promise<ErpProduct>;
  deleteProduct(id: string): Promise<void>;
  getProduct(id: string): Promise<ErpProduct | null>;
  listProducts(filter?: ErpProductFilter): Promise<ErpProduct[]>;
  syncInventory(): Promise<SyncResult>;
}

export interface ErpProduct {
  id: string;
  sku: string;
  name: string;
  externalId: string;
  quantity: number;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ErpProductData {
  sku: string;
  name: string;
  quantity: number;
  price: number;
}

export interface ErpProductFilter {
  sku?: string;
  createdAfter?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Payment Adapter contract
 */
export interface PaymentAdapter extends ExternalServiceAdapter {
  createPayment(data: PaymentData): Promise<Payment>;
  getPayment(id: string): Promise<Payment | null>;
  refundPayment(paymentId: string, amount?: number): Promise<Refund>;
  listPayments(filter?: PaymentFilter): Promise<Payment[]>;
  webhookHandler(payload: unknown, signature?: string): Promise<WebhookEvent>;
}

export interface Payment {
  id: string;
  externalId: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface PaymentData {
  amount: number;
  currency: string;
  customerId?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentFilter {
  status?: string;
  createdAfter?: Date;
  limit?: number;
  offset?: number;
}

export interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  createdAt: Date;
}

/**
 * Messaging Adapter contract
 */
export interface MessagingAdapter extends ExternalServiceAdapter {
  sendMessage(data: MessageData): Promise<MessageSendResult>;
  sendBatch(data: MessageData[]): Promise<MessageSendResult[]>;
  getMessageStatus(id: string): Promise<MessageStatus>;
}

export interface MessageData {
  recipient: string; // phone, email, user ID depending on channel
  channel: "sms" | "email" | "slack" | "teams" | "push";
  subject?: string; // for email
  body: string;
  metadata?: Record<string, unknown>;
}

export interface MessageSendResult {
  id: string;
  status: "queued" | "sent" | "failed";
  error?: string;
}

export interface MessageStatus {
  id: string;
  status: "pending" | "sent" | "delivered" | "failed" | "read";
  deliveredAt?: Date;
  readAt?: Date;
}

/**
 * Data Sync result
 */
export interface SyncResult {
  timestamp: Date;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  errors: SyncError[];
}

export interface SyncError {
  recordId: string;
  error: string;
}

/**
 * Webhook event from external service
 */
export interface WebhookEvent {
  id: string;
  type: string;
  timestamp: Date;
  data: unknown;
  source: string;
}

/**
 * Registry for managing adapters
 */
export class AdapterRegistry {
  private adapters: Map<string, ExternalServiceAdapter> = new Map();

  register<T extends ExternalServiceAdapter>(adapter: T, key?: string): void {
    const adapterKey = key ?? adapter.name;
    if (this.adapters.has(adapterKey)) {
      throw new Error(`Adapter already registered: ${adapterKey}`);
    }
    this.adapters.set(adapterKey, adapter);
  }

  get<T extends ExternalServiceAdapter = ExternalServiceAdapter>(key: string): T {
    const adapter = this.adapters.get(key);
    if (!adapter) {
      throw new Error(`Adapter not found: ${key}`);
    }
    return adapter as T;
  }

  has(key: string): boolean {
    return this.adapters.has(key);
  }

  async shutdownAll(): Promise<void> {
    await Promise.all(Array.from(this.adapters.values()).map((a) => a.shutdown()));
  }
}

export const adapterRegistry = new AdapterRegistry();
