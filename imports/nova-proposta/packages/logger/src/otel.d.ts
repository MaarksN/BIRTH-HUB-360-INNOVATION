type TraceContext = {
    spanId: string | null;
    traceId: string | null;
};
export declare function getActiveTraceContext(): TraceContext | null;
export declare function setActiveSpanAttributes(attributes: Record<string, unknown>): void;
export declare function addActiveSpanEvent(name: string, attributes?: Record<string, unknown>): void;
export declare function recordActiveSpanException(error: unknown): void;
export declare function withActiveSpan<T>(name: string, options: {
    attributes?: Record<string, unknown>;
    tracerName?: string;
}, callback: () => Promise<T>): Promise<T>;
export {};
