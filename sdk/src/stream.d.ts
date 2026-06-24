import type { ContractEvent } from "./types";
type OnEvent = (e: ContractEvent) => void | Promise<void>;
type OnError = (err: Error) => void | undefined;
export declare class SSEStream {
    private url;
    private onEvent;
    private onError?;
    private controller?;
    private closed;
    private reconnectDelay;
    private readonly maxDelay;
    private reconnectTimer?;
    constructor(url: string, onEvent: OnEvent, onError?: OnError);
    private open;
    private scheduleReconnect;
    close(): void;
}
export declare function openSSE(url: string, onEvent: OnEvent, onError?: OnError): {
    close: () => void;
};
export {};
//# sourceMappingURL=stream.d.ts.map