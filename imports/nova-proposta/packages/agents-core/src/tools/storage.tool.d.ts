export type StorageProvider = "s3" | "supabase";
export type StorageAction = "download" | "upload";
export interface StorageInput {
    action: StorageAction;
    blob?: string;
    bucket: string;
    key: string;
    provider: StorageProvider;
}
export interface StorageResult {
    action: StorageAction;
    key: string;
    provider: StorageProvider;
    signedUrl: string;
}
export declare function callStorageTool(input: StorageInput, options?: {
    simulate?: boolean;
}): Promise<StorageResult>;
