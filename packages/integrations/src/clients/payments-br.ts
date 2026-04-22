// 
import { postJson, getJson, type HttpRequestOptions } from "./http.js";
import { withCircuitBreaker } from "./circuit-breaker.js";

const pagarmePostCb = withCircuitBreaker("payments:pagarme", (url: string, payload: unknown, options: HttpRequestOptions) => postJson<PagarmeOrderResponse>(url, payload, options));
const pagarmeGetCb = withCircuitBreaker("payments:pagarme:get", (url: string, options: HttpRequestOptions) => getJson<PagarmeOrderResponse>(url, options));

export interface PaymentCustomer {
  name: string;
  email: string;
  document: string; // CPF or CNPJ
  phone?: string;
}

export interface PaymentResponse {
  id: string;
  status: string;
  amount: number;
  qrCode?: string;
  qrCodeUrl?: string;
  boletoUrl?: string;
  barCode?: string;
  gatewayId?: string;
}

export interface IPaymentsClient {
  generatePix(
    amount: number,
    description: string,
    tenantId: string,
    customer: PaymentCustomer,
  ): Promise<PaymentResponse>;

  generateBoleto(
    amount: number,
    description: string,
    tenantId: string,
    customer: PaymentCustomer,
    dueDate: Date,
  ): Promise<PaymentResponse>;

  confirmPayment(paymentId: string, tenantId: string): Promise<PaymentResponse>;
}

type PagarmeLastTransaction = {
  line?: string | null;
  qr_code?: string | null;
  qr_code_url?: string | null;
  url?: string | null;
};

type PagarmeCharge = {
  id: string;
  last_transaction?: PagarmeLastTransaction | null;
  status: string;
};

type PagarmeOrderResponse = {
  charges: PagarmeCharge[];
  id: string;
};

function getPrimaryCharge(response: PagarmeOrderResponse): PagarmeCharge {
  const charge = response.charges[0];

  if (!charge) {
    throw new Error("Pagar.me response did not include any charges.");
  }

  return charge;
}

export class PagarmeClient implements IPaymentsClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl = "https://api.pagar.me/core/v5",
  ) {}

  async generatePix(
    amount: number,
    description: string,
    tenantId: string, // Pagar.me usually uses customer_id or metadata for tenant
    customer: PaymentCustomer,
  ): Promise<PaymentResponse> {
    const payload = {
      items: [
        {
          amount: Math.round(amount * 100), // Pagar.me uses cents
          description,
          quantity: 1,
          code: "1",
        },
      ],
      customer: {
        name: customer.name,
        email: customer.email,
        document: customer.document,
        type: customer.document.length > 11 ? "company" : "individual",
        phones: {
          mobile_phone: {
            country_code: "55",
            area_code: customer.phone?.slice(0, 2) || "11",
            number: customer.phone?.slice(2) || "999999999",
          },
        },
      },
      payments: [
        {
          payment_method: "pix",
          pix: {
            expires_in: 3600,
          },
        },
      ],
      metadata: {
        tenantId,
      },
    };

    const response = await pagarmePostCb(`${this.baseUrl}/orders`, payload, {
      apiKey: this.apiKey, // Uses Basic Auth actually, but let's assume Bearer or header injection in postJson handles it if adapted.
      // Pagar.me uses Basic Auth with API Key as username and empty password.
      // postJson uses Bearer. I might need to adjust or override headers.
      headers: {
        Authorization: `Basic ${Buffer.from(this.apiKey + ":").toString("base64")}`,
      },
    });

    const charge = getPrimaryCharge(response);
    const txn = charge.last_transaction ?? {};

    return {
      id: response.id,
      gatewayId: charge.id,
      status: charge.status,
      amount: amount,
      ...(txn.qr_code ? { qrCode: txn.qr_code } : {}),
      ...(txn.qr_code_url ? { qrCodeUrl: txn.qr_code_url } : {})
    };
  }

  async generateBoleto(
    amount: number,
    description: string,
    tenantId: string,
    customer: PaymentCustomer,
    dueDate: Date,
  ): Promise<PaymentResponse> {
    const payload = {
      items: [
        {
          amount: Math.round(amount * 100),
          description,
          quantity: 1,
          code: "1",
        },
      ],
      customer: {
        name: customer.name,
        email: customer.email,
        document: customer.document,
        type: customer.document.length > 11 ? "company" : "individual",
      },
      payments: [
        {
          payment_method: "boleto",
          boleto: {
            due_at: dueDate.toISOString(),
            instructions: "Não receber após o vencimento",
          },
        },
      ],
      metadata: {
        tenantId,
      },
    };

    const response = await pagarmePostCb(`${this.baseUrl}/orders`, payload, {
      headers: {
        Authorization: `Basic ${Buffer.from(this.apiKey + ":").toString("base64")}`,
      },
    });

    const charge = getPrimaryCharge(response);
    const txn = charge.last_transaction ?? {};

    return {
      id: response.id,
      gatewayId: charge.id,
      status: charge.status,
      amount: amount,
      ...(txn.url ? { boletoUrl: txn.url } : {}),
      ...(txn.line ? { barCode: txn.line } : {})
    };
  }

  async confirmPayment(
    paymentId: string,
    _tenantId: string,
  ): Promise<PaymentResponse> {
    const response = await pagarmeGetCb(`${this.baseUrl}/orders/${paymentId}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(this.apiKey + ":").toString("base64")}`,
      },
    });

    const charge = getPrimaryCharge(response);
    const txn = charge.last_transaction ?? {};

    return {
      id: response.id,
      gatewayId: charge.id,
      status: charge.status,
      amount: 0,
    };
  }
}
