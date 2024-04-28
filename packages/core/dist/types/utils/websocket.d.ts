type Callback = (message: unknown) => void;
export declare class WebSocketManager {
    private url;
    private ws;
    private subscriptions;
    private maxRetries;
    private retryCount;
    private retryDelay;
    private isConnected;
    constructor(url: string);
    connect(): void;
    private reconnect;
    private handleWindowFocus;
    subscribe(topic: string, callback: Callback): void;
    private resubscribeAll;
    close(): void;
}
export {};
//# sourceMappingURL=websocket.d.ts.map