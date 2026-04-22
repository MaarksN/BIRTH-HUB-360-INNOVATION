export interface IJobContext {
    actorId: string;
    jobId: string;
    scopedAt: string;
    tenantId: string;
}
export declare function validateJobContext(context: IJobContext): boolean;
export declare function signJobPayload(payload: string, secret: string): string;
export declare function verifyJobPayloadSignature(payload: string, secret: string, signature: string): boolean;
