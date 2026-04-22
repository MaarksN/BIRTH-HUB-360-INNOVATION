export interface DelayNodeConfig {
    duration_ms: number;
}
export declare function executeDelayNode(config: DelayNodeConfig): {
    delayMs: number;
    releaseAt: Date;
};
