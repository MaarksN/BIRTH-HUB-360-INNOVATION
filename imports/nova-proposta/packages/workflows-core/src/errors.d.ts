export declare class InvalidGraphError extends Error {
    readonly details?: Record<string, unknown>;
    constructor(message: string, details?: Record<string, unknown>);
}
export declare class CyclicDependencyError extends InvalidGraphError {
    readonly cyclePath: string[];
    constructor(cyclePath: string[]);
}
export declare class InvalidStepConfigError extends Error {
    constructor(message: string);
}
