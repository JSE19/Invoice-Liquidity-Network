export const DEFAULT_REQUEST_TIMEOUT_MS = 30000;
export const DEFAULT_READ_TIMEOUT_MS = 10000;
export const DEFAULT_WRITE_TIMEOUT_MS = 30000;
export const DEFAULT_SIMULATION_TIMEOUT_MS = 15000;
export function resolveRequestTimeouts(config) {
    return {
        readMs: config.timeouts?.readMs ?? config.timeoutMs ?? DEFAULT_READ_TIMEOUT_MS,
        writeMs: config.timeouts?.writeMs ?? config.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS,
        simulationMs: config.timeouts?.simulationMs ??
            config.timeoutMs ??
            DEFAULT_SIMULATION_TIMEOUT_MS,
    };
}
export async function withTimeout(operation, timeoutMs, promise) {
    let timer;
    const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => {
            reject(new TimeoutError(operation, timeoutMs));
        }, timeoutMs);
    });
    try {
        return await Promise.race([promise, timeout]);
    }
    finally {
        if (timer) {
            clearTimeout(timer);
        }
    }
}
export class TimeoutError extends Error {
    constructor(operation, timeoutMs) {
        super(`${operation} timed out after ${timeoutMs}ms.`);
        this.name = "TimeoutError";
        this.operation = operation;
        this.timeoutMs = timeoutMs;
    }
}
