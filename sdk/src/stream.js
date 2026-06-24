export class SSEStream {
    constructor(url, onEvent, onError) {
        this.closed = false;
        this.reconnectDelay = 1000;
        this.maxDelay = 30000;
        this.url = url;
        this.onEvent = onEvent;
        this.onError = onError;
        this.open();
    }
    open() {
        if (this.closed)
            return;
        this.controller = new AbortController();
        const sseUrl = this.url.includes("?") ? `${this.url}&accept=text/event-stream` : `${this.url}?accept=text/event-stream`;
        globalThis.fetch(sseUrl, {
            signal: this.controller.signal,
            headers: { Accept: "text/event-stream" },
        })
            .then(async (res) => {
            if (!res.ok || !res.body) {
                throw new Error(`SSE stream failed: HTTP ${res.status}`);
            }
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";
                for (const line of lines) {
                    if (line.startsWith("data:")) {
                        const data = line.slice(5).trim();
                        if (data === "" || data === '"hello"')
                            continue;
                        try {
                            const raw = JSON.parse(data);
                            const ev = {
                                contractId: raw.contract_id ?? "",
                                type: raw.type ?? "",
                                topics: raw.topics ?? [],
                                value: raw.value ?? null,
                                ledger: raw.ledger ?? 0,
                                ledgerClosedAt: raw.ledger_closed_at ?? "",
                                txHash: raw.tx_hash ?? "",
                                pagingToken: raw.paging_token ?? "",
                            };
                            await this.onEvent(ev);
                        }
                        catch (err) {
                            // ignore malformed frames
                        }
                    }
                }
            }
        })
            .then(() => {
            // closed naturally — schedule reconnect if not intentionally closed
            if (!this.closed)
                this.scheduleReconnect();
        })
            .catch((err) => {
            if (err.name === "AbortError")
                return;
            this.onError?.(err);
            this.scheduleReconnect();
        });
    }
    scheduleReconnect() {
        if (this.closed)
            return;
        const delay = this.reconnectDelay;
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxDelay);
        this.reconnectTimer = setTimeout(() => {
            this.open();
        }, delay);
    }
    close() {
        this.closed = true;
        if (this.reconnectTimer)
            clearTimeout(this.reconnectTimer);
        this.controller?.abort();
    }
}
export function openSSE(url, onEvent, onError) {
    const s = new SSEStream(url, onEvent, onError);
    return { close: () => s.close() };
}
