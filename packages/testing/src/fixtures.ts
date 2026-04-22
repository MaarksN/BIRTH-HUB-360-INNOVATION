import { randomUUID } from "node:crypto";
import type {
  CrmAdapter,
  CrmContact,
  ErpAdapter,
  ErpProduct,
  PaymentAdapter,
  Payment
} from "@birthub/integrations";

/**
 * Test fixtures and factory functions for unit and integration tests
 */

// ============ USER & ORG FIXTURES ============
export interface TestUser {
  id: string;
  email: string;
  name: string;
  organizationId: string;
  role: "admin" | "member" | "viewer";
}

export interface TestOrganization {
  id: string;
  name: string;
  createdAt: Date;
}

export function createTestUser(overrides?: Partial<TestUser>): TestUser {
  const orgId = randomUUID();
  return {
    id: randomUUID(),
    email: `user-${randomUUID()}@test.local`,
    name: "Test User",
    organizationId: orgId,
    role: "member",
    ...overrides
  };
}

export function createTestOrganization(overrides?: Partial<TestOrganization>): TestOrganization {
  return {
    id: randomUUID(),
    name: `Test Org ${randomUUID().slice(0, 8)}`,
    createdAt: new Date(),
    ...overrides
  };
}

// ============ WORKFLOW FIXTURES ============
export interface TestWorkflow {
  id: string;
  name: string;
  organizationId: string;
  definition: unknown;
  status: "draft" | "published" | "archived";
}

export function createTestWorkflow(overrides?: Partial<TestWorkflow>): TestWorkflow {
  return {
    id: randomUUID(),
    name: "Test Workflow",
    organizationId: randomUUID(),
    definition: {
      version: "1.0",
      steps: []
    },
    status: "draft",
    ...overrides
  };
}

// ============ AGENT FIXTURES ============
export interface TestAgent {
  id: string;
  name: string;
  version: string;
  organizationId: string;
  config: unknown;
}

export function createTestAgent(overrides?: Partial<TestAgent>): TestAgent {
  return {
    id: randomUUID(),
    name: "Test Agent",
    version: "1.0.0",
    organizationId: randomUUID(),
    config: {},
    ...overrides
  };
}

// ============ MOCK ADAPTERS ============
export class MockCrmAdapter implements CrmAdapter {
  readonly name = "mock-crm";
  readonly version = "1.0.0";

  private contacts: Map<string, CrmContact> = new Map();
  private initialized = false;

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  async shutdown(): Promise<void> {
    this.initialized = false;
    this.contacts.clear();
  }

  async healthcheck(): Promise<boolean> {
    return this.initialized;
  }

  async createContact(data): Promise<CrmContact> {
    const contact: CrmContact = {
      id: randomUUID(),
      externalId: `ext-${randomUUID()}`,
      email: data.email,
      name: data.name,
      phone: data.phone,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: data.metadata
    };
    this.contacts.set(contact.id, contact);
    return contact;
  }

  async updateContact(id: string, data): Promise<CrmContact> {
    const contact = this.contacts.get(id);
    if (!contact) throw new Error(`Contact ${id} not found`);

    const updated = { ...contact, ...data, updatedAt: new Date() };
    this.contacts.set(id, updated);
    return updated;
  }

  async deleteContact(id: string): Promise<void> {
    this.contacts.delete(id);
  }

  async getContact(id: string): Promise<CrmContact | null> {
    return this.contacts.get(id) ?? null;
  }

  async listContacts(filter?): Promise<CrmContact[]> {
    let results = Array.from(this.contacts.values());

    if (filter?.email) {
      results = results.filter((c) => c.email === filter.email);
    }

    return results.slice(filter?.offset ?? 0, (filter?.offset ?? 0) + (filter?.limit ?? 100));
  }

  async syncContacts(): Promise<any> {
    return {
      timestamp: new Date(),
      recordsProcessed: this.contacts.size,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsFailed: 0,
      errors: []
    };
  }
}

export class MockErpAdapter implements ErpAdapter {
  readonly name = "mock-erp";
  readonly version = "1.0.0";

  private products: Map<string, ErpProduct> = new Map();
  private initialized = false;

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  async shutdown(): Promise<void> {
    this.initialized = false;
    this.products.clear();
  }

  async healthcheck(): Promise<boolean> {
    return this.initialized;
  }

  async createProduct(data): Promise<ErpProduct> {
    const product: ErpProduct = {
      id: randomUUID(),
      externalId: `ext-${randomUUID()}`,
      sku: data.sku,
      name: data.name,
      quantity: data.quantity,
      price: data.price,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.products.set(product.id, product);
    return product;
  }

  async updateProduct(id: string, data): Promise<ErpProduct> {
    const product = this.products.get(id);
    if (!product) throw new Error(`Product ${id} not found`);

    const updated = { ...product, ...data, updatedAt: new Date() };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: string): Promise<void> {
    this.products.delete(id);
  }

  async getProduct(id: string): Promise<ErpProduct | null> {
    return this.products.get(id) ?? null;
  }

  async listProducts(filter?): Promise<ErpProduct[]> {
    let results = Array.from(this.products.values());

    if (filter?.sku) {
      results = results.filter((p) => p.sku === filter.sku);
    }

    return results.slice(filter?.offset ?? 0, (filter?.offset ?? 0) + (filter?.limit ?? 100));
  }

  async syncInventory(): Promise<any> {
    return {
      timestamp: new Date(),
      recordsProcessed: this.products.size,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsFailed: 0,
      errors: []
    };
  }
}

export class MockPaymentAdapter implements PaymentAdapter {
  readonly name = "mock-payment";
  readonly version = "1.0.0";

  private payments: Map<string, Payment> = new Map();
  private initialized = false;

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  async shutdown(): Promise<void> {
    this.initialized = false;
    this.payments.clear();
  }

  async healthcheck(): Promise<boolean> {
    return this.initialized;
  }

  async createPayment(data): Promise<Payment> {
    const payment: Payment = {
      id: randomUUID(),
      externalId: `ext-${randomUUID()}`,
      amount: data.amount,
      currency: data.currency,
      status: "completed",
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: data.metadata
    };
    this.payments.set(payment.id, payment);
    return payment;
  }

  async getPayment(id: string): Promise<Payment | null> {
    return this.payments.get(id) ?? null;
  }

  async refundPayment(paymentId: string, amount?): Promise<any> {
    const payment = this.payments.get(paymentId);
    if (!payment) throw new Error(`Payment ${paymentId} not found`);

    return {
      id: randomUUID(),
      paymentId,
      amount: amount ?? payment.amount,
      status: "completed",
      createdAt: new Date()
    };
  }

  async listPayments(filter?): Promise<Payment[]> {
    return Array.from(this.payments.values()).slice(
      filter?.offset ?? 0,
      (filter?.offset ?? 0) + (filter?.limit ?? 100)
    );
  }

  async webhookHandler(payload): Promise<any> {
    return {
      id: randomUUID(),
      type: "payment.completed",
      timestamp: new Date(),
      data: payload,
      source: "payment-adapter"
    };
  }
}

// ============ REQUEST/RESPONSE FIXTURES ============
export function createMockRequest(overrides: any = {}): any {
  return {
    context: {
      requestId: randomUUID(),
      traceId: randomUUID(),
      userId: randomUUID(),
      organizationId: randomUUID(),
      tenantId: randomUUID(),
      role: "member"
    },
    user: createTestUser(),
    body: {},
    params: {},
    query: {},
    ...overrides
  };
}

export function createMockResponse(): any {
  const response = {
    status: (code: number) => {
      response.statusCode = code;
      return response;
    },
    json: (data: unknown) => {
      response.body = data;
      return response;
    },
    send: (data: unknown) => {
      response.body = data;
      return response;
    },
    statusCode: 200,
    body: null,
    headers: {} as Record<string, string>,
    setHeader: (key: string, value: string) => {
      response.headers[key] = value;
    }
  };
  return response;
}
