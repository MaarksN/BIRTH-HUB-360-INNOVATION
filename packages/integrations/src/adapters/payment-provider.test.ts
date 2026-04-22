import test from "node:test";
import assert from "node:assert";
import type { IPaymentProvider } from "./payment-provider.js";
import type { PaymentCustomer, PaymentResponse } from "../clients/payments-br.js";

test("IPaymentProvider - mock implementation", async () => {
  class MockPaymentProvider implements IPaymentProvider {
    async generatePix(
      amount: number,
      description: string,
      tenantId: string,
      customer: PaymentCustomer
    ): Promise<PaymentResponse> {
      return {
        id: "pix_123",
        status: "pending",
        amount,
        qrCode: "mock_qr_code",
        qrCodeUrl: "https://mock.url/qr",
      };
    }

    async generateBoleto(
      amount: number,
      description: string,
      tenantId: string,
      customer: PaymentCustomer,
      dueDate: Date
    ): Promise<PaymentResponse> {
      return {
        id: "bol_123",
        status: "pending",
        amount,
        barCode: "1234567890",
        boletoUrl: "https://mock.url/boleto",
      };
    }

    async confirmPayment(paymentId: string, tenantId: string): Promise<PaymentResponse> {
      return {
        id: paymentId,
        status: "paid",
        amount: 100,
      };
    }
  }

  const provider = new MockPaymentProvider();
  const customer: PaymentCustomer = {
    name: "John Doe",
    email: "john@example.com",
    document: "12345678900",
  };

  const pixResult = await provider.generatePix(100, "Test Pix", "tenant_1", customer);
  assert.strictEqual(pixResult.id, "pix_123");
  assert.strictEqual(pixResult.amount, 100);

  const boletoResult = await provider.generateBoleto(200, "Test Boleto", "tenant_1", customer, new Date());
  assert.strictEqual(boletoResult.id, "bol_123");
  assert.strictEqual(boletoResult.amount, 200);

  const confirmResult = await provider.confirmPayment("pix_123", "tenant_1");
  assert.strictEqual(confirmResult.status, "paid");
});
