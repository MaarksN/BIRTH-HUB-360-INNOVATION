export type EmailProvider = "smtp" | "sendgrid";
export interface EmailSendInput {
    body: string;
    provider: EmailProvider;
    subject: string;
    tenantId: string;
    to: string;
}
export interface EmailSendResult {
    bounced: boolean;
    messageId: string;
    provider: EmailProvider;
    retries: number;
}
export interface EmailAdapter {
    send(input: EmailSendInput): Promise<{
        bounced: boolean;
        messageId: string;
    }>;
}
export declare function sendEmail(input: EmailSendInput, options?: {
    adapters?: Partial<Record<EmailProvider, EmailAdapter>>;
    maxRetries?: number;
}): Promise<EmailSendResult>;
