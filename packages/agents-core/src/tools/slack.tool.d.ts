export type SlackMode = "webhook" | "api";
export interface SlackMessageInput {
    channel: string;
    mode: SlackMode;
    text: string;
    token?: string;
    webhookUrl?: string;
}
export interface SlackMessageResult {
    mode: SlackMode;
    ok: boolean;
    ts: string;
}
export declare function postSlackMessage(input: SlackMessageInput, options?: {
    simulate?: boolean;
}): Promise<SlackMessageResult>;
