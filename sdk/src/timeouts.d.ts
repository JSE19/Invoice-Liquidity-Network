export declare const DEFAULT_REQUEST_TIMEOUT_MS = 30000;
export declare const DEFAULT_READ_TIMEOUT_MS = 10000;
export declare const DEFAULT_WRITE_TIMEOUT_MS = 30000;
export declare const DEFAULT_SIMULATION_TIMEOUT_MS = 15000;
export interface RequestTimeouts {
    readMs: number;
    writeMs: number;
    simulationMs: number;
}
export declare function resolveRequestTimeouts(config: {
    timeoutMs?: number;
    timeouts?: Partial<RequestTimeouts>;
}): RequestTimeouts;
export declare function withTimeout<T>(operation: string, timeoutMs: number, promise: Promise<T>): Promise<T>;
export declare class TimeoutError extends Error {
    readonly operation: string;
    readonly timeoutMs: number;
    constructor(operation: string, timeoutMs: number);
}
//# sourceMappingURL=timeouts.d.ts.map