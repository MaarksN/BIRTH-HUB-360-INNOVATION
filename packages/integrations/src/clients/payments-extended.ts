// packages/integrations/src/clients/payments-extended.ts
import { postJson, getJson } from "./http.js";
import { withCircuitBreaker } from "./circuit-breaker.js";
import type { IPaymentsClient, PaymentCustomer, PaymentResponse } from "./payments-br.js";

// ─────────────────────────────────────────────
// ASAAS
// ─────────────────────────────────────────────

const asaasPostCb = withCircuitBreaker(
  "asaas:api",
  (url: string, key: string, payload: Record<string, unknown>) =>
    postJson(url, payload, { headers: { access_token: key }, timeoutMs: 12_000, retries: 2 }),
);

const asaasGetCb = withCircuitBreaker(
  "asaas:api:get",
  (url: string, key: string) =>
    getJson(url, { headers: { access_token: key }, timeoutMs: 12_000, retries: 2 }),
);

interface AsaasChargeResponse {
  id: string;
  status: string;
  value: number;
  pixQrCodeId?: string;
  pixTransactionId?: string;
  bankSlipUrl?: string;
  nossoNumero?: string;
}

interface AsaasPixQRResponse {
  encodedImage: string;
  payload: string;
  expirationDate: string;
}

export class AsaasClient implements IPaymentsClient {
  /**
   * @param apiKey   Asaas API Key ($aact_...)
   * @param baseUrl  Use https://www.asaas.com/api/v3 for production
   *                 or https://sandbox.asaas.com/api/v3 for sandbox
   */
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl = "https://www.asaas.com/api/v3",
  ) {}

  /** Ensure a customer exists (upsert by cpfCnpj) and return its id */
  private async ensureCustomer(customer: PaymentCustomer): Promise<string> {
    const existing = await asaasGetCb(
      `${this.baseUrl}/customers?cpfCnpj=${customer.document}`,
      this.apiKey,
    ) as { data: Array<{ id: string }> };
    if (existing.data.length > 0) return existing.data[0]!.id;

    const created = await asaasPostCb(`${this.baseUrl}/customers`, this.apiKey, {
      name: customer.name,
      email: customer.email,
      cpfCnpj: customer.document,
      mobilePhone: customer.phone,
    }) as { id: string };
    return created.id;
  }

  async generatePix(amount: number, description: string, tenantId: string, customer: PaymentCustomer): Promise<PaymentResponse> {
    const customerId = await this.ensureCustomer(customer);
    const charge = await asaasPostCb(`${this.baseUrl}/payments`, this.apiKey, {
      customer: customerId,
      billingType: "PIX",
      value: amount,
      dueDate: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10),
      description,
      externalReference: tenantId,
    }) as AsaasChargeResponse;

    const qr = await asaasGetCb(
      `${this.baseUrl}/payments/${charge.id}/pixQrCode`,
      this.apiKey,
    ) as AsaasPixQRResponse;

    return {
      id: charge.id,
      status: charge.status,
      amount,
      qrCode: qr.encodedImage,
      qrCodeUrl: qr.payload,
    };
  }

  async generateBoleto(amount: number, description: string, tenantId: string, customer: PaymentCustomer, dueDate: Date): Promise<PaymentResponse> {
    const customerId = await this.ensureCustomer(customer);
    const charge = await asaasPostCb(`${this.baseUrl}/payments`, this.apiKey, {
      customer: customerId,
      billingType: "BOLETO",
      value: amount,
      dueDate: dueDate.toISOString().slice(0, 10),
      description,
      externalReference: tenantId,
    }) as AsaasChargeResponse;

    return {
      id: charge.id,
      status: charge.status,
      amount,
      boletoUrl: charge.bankSlipUrl,
      barCode: charge.nossoNumero,
    };
  }

  async confirmPayment(paymentId: string, _tenantId: string): Promise<PaymentResponse> {
    const charge = await asaasGetCb(
      `${this.baseUrl}/payments/${paymentId}`,
      this.apiKey,
    ) as AsaasChargeResponse;
    return { id: charge.id, status: charge.status, amount: charge.value };
  }
}

// ─────────────────────────────────────────────
// VINDI
// ─────────────────────────────────────────────

const vindiPostCb = withCircuitBreaker(
  "vindi:api",
  (url: string, basicAuth: string, payload: Record<string, unknown>) =>
    postJson(url, payload, {
      headers: { Authorization: `Basic ${basicAuth}` },
      timeoutMs: 15_000,
      retries: 2,
    }),
);

const vindiGetCb = withCircuitBreaker(
  "vindi:api:get",
  (url: string, basicAuth: string) =>
    getJson(url, {
      headers: { Authorization: `Basic ${basicAuth}` },
      timeoutMs: 15_000,
      retries: 2,
    }),
);

export class VindiClient implements IPaymentsClient {
  private readonly basicAuth: string;

  constructor(
    apiKey: string,
    private readonly baseUrl = "https://app.vindi.com.br/api/v1",
  ) {
    this.basicAuth = Buffer.from(`${apiKey}:`).toString("base64");
  }

  private async ensureCustomer(customer: PaymentCustomer): Promise<string> {
    const existing = await vindiGetCb(
      `${this.baseUrl}/customers?query=registry_code:${customer.document}`,
      this.basicAuth,
    ) as { customers: Array<{ id: number }> };
    if (existing.customers.length > 0) return String(existing.customers[0]!.id);

    const created = await vindiPostCb(`${this.baseUrl}/customers`, this.basicAuth, {
      name: customer.name,
      email: customer.email,
      registry_code: customer.document,
      phones: customer.phone ? [{ phone_type: "mobile", number: customer.phone, extension: "" }] : [],
    }) as { customer: { id: number } };
    return String(created.customer.id);
  }

  async generatePix(amount: number, description: string, tenantId: string, customer: PaymentCustomer): Promise<PaymentResponse> {
    const customerId = await this.ensureCustomer(customer);
    const bill = await vindiPostCb(`${this.baseUrl}/bills`, this.basicAuth, {
      customer_id: customerId,
      payment_method_code: "pix",
      bill_items: [{ product_code: "product", amount, quantity: 1, description }],
      metadata: { tenantId },
    }) as { bill: { id: number; status: string; charges: Array<{ gateway_response_fields?: { qr_code_url?: string; qr_code?: string } }> } };

    const charge = bill.bill.charges[0];
    return {
      id: String(bill.bill.id),
      status: bill.bill.status,
      amount,
      qrCodeUrl: charge?.gateway_response_fields?.qr_code_url,
      qrCode: charge?.gateway_response_fields?.qr_code,
    };
  }

  async generateBoleto(amount: number, description: string, tenantId: string, customer: PaymentCustomer, dueDate: Date): Promise<PaymentResponse> {
    const customerId = await this.ensureCustomer(customer);
    const bill = await vindiPostCb(`${this.baseUrl}/bills`, this.basicAuth, {
      customer_id: customerId,
      payment_method_code: "bank_slip",
      due_at: dueDate.toISOString().slice(0, 10),
      bill_items: [{ product_code: "product", amount, quantity: 1, description }],
      metadata: { tenantId },
    }) as { bill: { id: number; status: string; charges: Array<{ print_url?: string; gateway_response_fields?: { barcode?: string } }> } };

    const charge = bill.bill.charges[0];
    return {
      id: String(bill.bill.id),
      status: bill.bill.status,
      amount,
      boletoUrl: charge?.print_url,
      barCode: charge?.gateway_response_fields?.barcode,
    };
  }

  async confirmPayment(paymentId: string, _tenantId: string): Promise<PaymentResponse> {
    const res = await vindiGetCb(
      `${this.baseUrl}/bills/${paymentId}`,
      this.basicAuth,
    ) as { bill: { id: number; status: string; amount: number } };
    return { id: String(res.bill.id), status: res.bill.status, amount: res.bill.amount };
  }
}

// ─────────────────────────────────────────────
// IUGU
// ─────────────────────────────────────────────

const iuguPostCb = withCircuitBreaker(
  "iugu:api",
  (url: string, apiKey: string, payload: Record<string, unknown>) =>
    postJson(url, payload, {
      headers: { Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}` },
      timeoutMs: 12_000,
      retries: 2,
    }),
);

const iuguGetCb = withCircuitBreaker(
  "iugu:api:get",
  (url: string, apiKey: string) =>
    getJson(url, {
      headers: { Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}` },
      timeoutMs: 12_000,
      retries: 2,
    }),
);

export class IuguClient implements IPaymentsClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl = "https://api.iugu.com/v1",
  ) {}

  async generatePix(amount: number, description: string, tenantId: string, customer: PaymentCustomer): Promise<PaymentResponse> {
    const res = await iuguPostCb(`${this.baseUrl}/charge`, this.apiKey, {
      method: "pix",
      email: customer.email,
      payer: { cpf_cnpj: customer.document, name: customer.name },
      items: [{ description, quantity: 1, price_cents: Math.round(amount * 100) }],
      custom_variables: [{ name: "tenantId", value: tenantId }],
    }) as { id: string; status: string; pix?: { qrcode?: string; qrcode_text?: string } };

    return {
      id: res.id,
      status: res.status,
      amount,
      qrCode: res.pix?.qrcode,
      qrCodeUrl: res.pix?.qrcode_text,
    };
  }

  async generateBoleto(amount: number, description: string, tenantId: string, customer: PaymentCustomer, dueDate: Date): Promise<PaymentResponse> {
    const res = await iuguPostCb(`${this.baseUrl}/charge`, this.apiKey, {
      method: "bank_slip",
      email: customer.email,
      payer: { cpf_cnpj: customer.document, name: customer.name },
      due_date: dueDate.toISOString().slice(0, 10),
      items: [{ description, quantity: 1, price_cents: Math.round(amount * 100) }],
      custom_variables: [{ name: "tenantId", value: tenantId }],
    }) as { id: string; status: string; url?: string; bank_slip?: { digitable_line?: string } };

    return {
      id: res.id,
      status: res.status,
      amount,
      boletoUrl: res.url,
      barCode: res.bank_slip?.digitable_line,
    };
  }

  async confirmPayment(paymentId: string, _tenantId: string): Promise<PaymentResponse> {
    const res = await iuguGetCb(
      `${this.baseUrl}/invoices/${paymentId}`,
      this.apiKey,
    ) as { id: string; status: string; total_cents: number };
    return { id: res.id, status: res.status, amount: res.total_cents / 100 };
  }
}

// ─────────────────────────────────────────────
// MERCADO PAGO
// ─────────────────────────────────────────────

const mpPostCb = withCircuitBreaker(
  "mercadopago:api",
  (url: string, token: string, payload: Record<string, unknown>) =>
    postJson(url, payload, { apiKey: token, timeoutMs: 12_000, retries: 2 }),
);

const mpGetCb = withCircuitBreaker(
  "mercadopago:api:get",
  (url: string, token: string) =>
    getJson(url, { apiKey: token, timeoutMs: 12_000, retries: 2 }),
);

export class MercadoPagoClient implements IPaymentsClient {
  constructor(
    private readonly accessToken: string,
    private readonly baseUrl = "https://api.mercadopago.com",
  ) {}

  async generatePix(amount: number, description: string, tenantId: string, customer: PaymentCustomer): Promise<PaymentResponse> {
    const res = await mpPostCb(`${this.baseUrl}/v1/payments`, this.accessToken, {
      transaction_amount: amount,
      description,
      payment_method_id: "pix",
      payer: {
        email: customer.email,
        identification: { type: customer.document.length > 11 ? "CNPJ" : "CPF", number: customer.document },
      },
      external_reference: tenantId,
    }) as { id: number; status: string; point_of_interaction?: { transaction_data?: { qr_code?: string; qr_code_base64?: string } } };

    return {
      id: String(res.id),
      status: res.status,
      amount,
      qrCode: res.point_of_interaction?.transaction_data?.qr_code,
      qrCodeUrl: res.point_of_interaction?.transaction_data?.qr_code_base64,
    };
  }

  async generateBoleto(amount: number, description: string, tenantId: string, customer: PaymentCustomer, dueDate: Date): Promise<PaymentResponse> {
    const res = await mpPostCb(`${this.baseUrl}/v1/payments`, this.accessToken, {
      transaction_amount: amount,
      description,
      payment_method_id: "bolbradesco",
      payer: {
        email: customer.email,
        first_name: customer.name.split(" ")[0],
        last_name: customer.name.split(" ").slice(1).join(" ") || customer.name,
        identification: { type: customer.document.length > 11 ? "CNPJ" : "CPF", number: customer.document },
      },
      date_of_expiration: dueDate.toISOString(),
      external_reference: tenantId,
    }) as { id: number; status: string; barcode?: { content?: string }; transaction_details?: { external_resource_url?: string } };

    return {
      id: String(res.id),
      status: res.status,
      amount,
      boletoUrl: res.transaction_details?.external_resource_url,
      barCode: res.barcode?.content,
    };
  }

  async confirmPayment(paymentId: string, _tenantId: string): Promise<PaymentResponse> {
    const res = await mpGetCb(
      `${this.baseUrl}/v1/payments/${paymentId}`,
      this.accessToken,
    ) as { id: number; status: string; transaction_amount: number };
    return { id: String(res.id), status: res.status, amount: res.transaction_amount };
  }
}

// ─────────────────────────────────────────────
// PAGSEGURO
// ─────────────────────────────────────────────

const psPostCb = withCircuitBreaker(
  "pagseguro:api",
  (url: string, token: string, payload: Record<string, unknown>) =>
    postJson(url, payload, { apiKey: token, timeoutMs: 15_000, retries: 2 }),
);

const psGetCb = withCircuitBreaker(
  "pagseguro:api:get",
  (url: string, token: string) =>
    getJson(url, { apiKey: token, timeoutMs: 12_000, retries: 2 }),
);

export class PagSeguroClient implements IPaymentsClient {
  constructor(
    private readonly token: string,
    private readonly baseUrl = "https://api.pagseguro.com",
  ) {}

  async generatePix(amount: number, description: string, tenantId: string, customer: PaymentCustomer): Promise<PaymentResponse> {
    const res = await psPostCb(`${this.baseUrl}/orders`, this.token, {
      reference_id: tenantId,
      customer: {
        name: customer.name,
        email: customer.email,
        tax_id: customer.document,
        phones: customer.phone
          ? [{ country: "55", area: customer.phone.slice(0, 2), number: customer.phone.slice(2), type: "MOBILE" }]
          : [],
      },
      items: [{ name: description, quantity: 1, unit_amount: Math.round(amount * 100) }],
      qr_codes: [{ amount: { value: Math.round(amount * 100) } }],
    }) as { id: string; qr_codes?: Array<{ id: string; text?: string; links?: Array<{ href: string }> }> };

    const qr = res.qr_codes?.[0];
    return {
      id: res.id,
      status: "WAITING",
      amount,
      qrCode: qr?.text,
      qrCodeUrl: qr?.links?.[0]?.href,
    };
  }

  async generateBoleto(amount: number, description: string, tenantId: string, customer: PaymentCustomer, dueDate: Date): Promise<PaymentResponse> {
    const res = await psPostCb(`${this.baseUrl}/orders`, this.token, {
      reference_id: tenantId,
      customer: {
        name: customer.name,
        email: customer.email,
        tax_id: customer.document,
      },
      items: [{ name: description, quantity: 1, unit_amount: Math.round(amount * 100) }],
      charges: [
        {
          reference_id: tenantId,
          description,
          amount: { value: Math.round(amount * 100), currency: "BRL" },
          payment_method: {
            type: "BOLETO",
            boleto: {
              due_date: dueDate.toISOString().slice(0, 10),
              instruction_lines: { line_1: description, line_2: "" },
            },
          },
        },
      ],
    }) as { id: string; charges?: Array<{ id: string; status: string; payment_method?: { boleto?: { formatted_barcode?: string; pdf_href?: string } } }> };

    const charge = res.charges?.[0];
    return {
      id: res.id,
      status: charge?.status ?? "WAITING",
      amount,
      boletoUrl: charge?.payment_method?.boleto?.pdf_href,
      barCode: charge?.payment_method?.boleto?.formatted_barcode,
    };
  }

  async confirmPayment(paymentId: string, _tenantId: string): Promise<PaymentResponse> {
    const res = await psGetCb(
      `${this.baseUrl}/orders/${paymentId}`,
      this.token,
    ) as { id: string; charges?: Array<{ status: string; amount: { value: number } }> };
    const charge = res.charges?.[0];
    return {
      id: res.id,
      status: charge?.status ?? "UNKNOWN",
      amount: (charge?.amount?.value ?? 0) / 100,
    };
  }
}
