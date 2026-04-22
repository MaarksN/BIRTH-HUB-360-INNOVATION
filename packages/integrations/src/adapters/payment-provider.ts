import type { PaymentCustomer, PaymentResponse } from "../clients/payments-br.js";

export interface IPaymentProvider {
  /**
   * Generates a Pix charge.
   */
  generatePix(
    amount: number,
    description: string,
    tenantId: string,
    customer: PaymentCustomer,
  ): Promise<PaymentResponse>;

  /**
   * Generates a Boleto charge.
   */
  generateBoleto(
    amount: number,
    description: string,
    tenantId: string,
    customer: PaymentCustomer,
    dueDate: Date,
  ): Promise<PaymentResponse>;

  /**
   * Retrieves the current status of a payment.
   */
  confirmPayment(paymentId: string, tenantId: string): Promise<PaymentResponse>;
}
